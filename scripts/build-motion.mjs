#!/usr/bin/env node
/**
 * Compiles motion clips for the homepage stage from the 100STYLE dataset
 * (Ian Mason, CC BY 4.0), using the skeleton-only GLBs published at
 * huggingface.co/datasets/codepawl/100style-glb.
 *
 *   node scripts/build-motion.mjs <dir-of-downloaded-glbs>
 *
 * For each clip: find a straight run of walking, cut one seamless stride, remove
 * the travel, rebuild the pose on neutral body proportions, smooth, resample to
 * 24 fps and quantise to millimetres. Rebuilding on one fixed set of bone lengths
 * drops the performer's own proportions; only the joint directions survive.
 *
 * The downloads stay out of the repo. Only the generated module is committed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TAKES = [
  { id: 'neutral', label: 'NEUTRAL', file: 'Neutral_FW_skeleton.glb' },
  { id: 'strut', label: 'STRUT', file: 'Strutting_FW_skeleton.glb' },
  { id: 'robot', label: 'ROBOT', file: 'Robot_FW_skeleton.glb' },
  { id: 'zombie', label: 'ZOMBIE', file: 'Zombie_FW_skeleton.glb' },
];

// Stage joint → source node. Order is the stage's joint order.
const JOINTS = [
  ['PELVIS', 'Hips'],
  ['CHEST', 'Chest3'],
  ['NECK', 'Neck'],
  ['HEAD', 'Head'],
  ['L_SHLD', 'LeftShoulder'],
  ['R_SHLD', 'RightShoulder'],
  ['L_ELBW', 'LeftElbow'],
  ['R_ELBW', 'RightElbow'],
  ['L_WRST', 'LeftWrist'],
  ['R_WRST', 'RightWrist'],
  ['L_HAND', 'LeftWrist_end'],
  ['R_HAND', 'RightWrist_end'],
  ['L_HIP', 'LeftHip'],
  ['R_HIP', 'RightHip'],
  ['L_KNEE', 'LeftKnee'],
  ['R_KNEE', 'RightKnee'],
  ['L_ANKL', 'LeftAnkle'],
  ['R_ANKL', 'RightAnkle'],
  ['L_TOE', 'LeftToe_end'],
  ['R_TOE', 'RightToe_end'],
];
const INDEX = Object.fromEntries(JOINTS.map(([name], i) => [name, i]));

// Neutral body in metres: [joint, parent, length]. Symmetric on purpose.
const NEUTRAL = [
  ['CHEST', 'PELVIS', 0.3],
  ['NECK', 'CHEST', 0.24],
  ['HEAD', 'NECK', 0.11],
  ['L_SHLD', 'CHEST', 0.21],
  ['R_SHLD', 'CHEST', 0.21],
  ['L_ELBW', 'L_SHLD', 0.29],
  ['R_ELBW', 'R_SHLD', 0.29],
  ['L_WRST', 'L_ELBW', 0.25],
  ['R_WRST', 'R_ELBW', 0.25],
  ['L_HAND', 'L_WRST', 0.12],
  ['R_HAND', 'R_WRST', 0.12],
  ['L_HIP', 'PELVIS', 0.1],
  ['R_HIP', 'PELVIS', 0.1],
  ['L_KNEE', 'L_HIP', 0.43],
  ['R_KNEE', 'R_HIP', 0.43],
  ['L_ANKL', 'L_KNEE', 0.42],
  ['R_ANKL', 'R_KNEE', 0.42],
  ['L_TOE', 'L_ANKL', 0.2],
  ['R_TOE', 'R_ANKL', 0.2],
];
const LEG = 0.43 + 0.42;
const FPS_OUT = 24;
const MIN_STRIDE = 48; // source frames (60 fps)
const MAX_STRIDE = 170;

function readGlb(file) {
  const b = fs.readFileSync(file);
  if (b.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${file}: not a GLB`);
  const jsonLen = b.readUInt32LE(12);
  const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
  const binStart = 20 + jsonLen + 8;

  const accessor = (i) => {
    const acc = json.accessors[i];
    const view = json.bufferViews[acc.bufferView];
    if (acc.componentType !== 5126) throw new Error('expected float accessors');
    const size = { SCALAR: 1, VEC3: 3, VEC4: 4 }[acc.type];
    const offset = binStart + (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const out = new Float32Array(acc.count * size);
    for (let n = 0; n < out.length; n++) out[n] = b.readFloatLE(offset + n * 4);
    return out;
  };

  const anim = json.animations[0];
  const tracks = anim.channels.map((c) => ({
    node: c.target.node,
    path: c.target.path,
    values: accessor(anim.samplers[c.sampler].output),
    count: json.accessors[anim.samplers[c.sampler].input].count,
  }));
  return { nodes: json.nodes, tracks, frames: Math.max(...tracks.map((t) => t.count)) };
}

const qmul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qrot = (q, v) => {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + y * tz - z * ty,
    v[1] + w * ty + z * tx - x * tz,
    v[2] + w * tz + x * ty - y * tx,
  ];
};

/** Forward kinematics over the whole clip: [frame][joint] → world xyz. */
function worldPositions({ nodes, tracks, frames }) {
  const parent = new Array(nodes.length).fill(-1);
  nodes.forEach((n, i) => (n.children ?? []).forEach((c) => (parent[c] = i)));
  const nodeOf = Object.fromEntries(nodes.map((n, i) => [n.name, i]));
  const rot = tracks.filter((t) => t.path === 'rotation');
  const pos = tracks.filter((t) => t.path === 'translation');

  const out = new Float32Array(frames * JOINTS.length * 3);
  const R = nodes.map(() => [0, 0, 0, 1]);
  const P = nodes.map(() => [0, 0, 0]);

  for (let f = 0; f < frames; f++) {
    const lr = nodes.map((n) => n.rotation ?? [0, 0, 0, 1]);
    const lt = nodes.map((n) => n.translation ?? [0, 0, 0]);
    for (const t of rot) {
      const i = Math.min(f, t.count - 1) * 4;
      lr[t.node] = [t.values[i], t.values[i + 1], t.values[i + 2], t.values[i + 3]];
    }
    for (const t of pos) {
      const i = Math.min(f, t.count - 1) * 3;
      lt[t.node] = [t.values[i], t.values[i + 1], t.values[i + 2]];
    }
    for (let n = 0; n < nodes.length; n++) {
      const p = parent[n];
      if (p < 0) {
        R[n] = lr[n];
        P[n] = lt[n];
      } else {
        R[n] = qmul(R[p], lr[n]);
        const v = qrot(R[p], lt[n]);
        P[n] = [P[p][0] + v[0], P[p][1] + v[1], P[p][2] + v[2]];
      }
    }
    JOINTS.forEach(([, source], j) => {
      const q = P[nodeOf[source]];
      const k = (f * JOINTS.length + j) * 3;
      out[k] = q[0];
      out[k + 1] = q[1];
      out[k + 2] = q[2];
    });
  }
  return { data: out, frames };
}

/** Lowest-error straight stride. Prefers the shortest period that closes well. */
function findStride({ data, frames }) {
  const J = JOINTS.length;
  const hips = (f) => [data[f * J * 3], data[f * J * 3 + 1], data[f * J * 3 + 2]];
  const closure = (a, b) => {
    const ha = hips(a), hb = hips(b);
    let sum = 0;
    for (let j = 0; j < J; j++) {
      const ka = (a * J + j) * 3, kb = (b * J + j) * 3;
      sum += Math.hypot(
        data[ka] - ha[0] - (data[kb] - hb[0]),
        data[ka + 1] - data[kb + 1],
        data[ka + 2] - ha[2] - (data[kb + 2] - hb[2]),
      );
    }
    return sum / J;
  };

  const candidates = [];
  for (let f = 120; f + MAX_STRIDE < frames - 120; f += 4) {
    let best = null;
    for (let p = MIN_STRIDE; p <= MAX_STRIDE; p++) {
      const a = hips(f), m = hips(f + (p >> 1)), b = hips(f + p);
      const d1 = [m[0] - a[0], m[2] - a[2]], d2 = [b[0] - m[0], b[2] - m[2]];
      const l1 = Math.hypot(...d1), l2 = Math.hypot(...d2);
      if (l1 < 0.25 || l2 < 0.25) continue; // not walking
      const cos = (d1[0] * d2[0] + d1[1] * d2[1]) / (l1 * l2);
      if (cos < 0.994) continue; // turning
      const e = closure(f, f + p);
      if (!best || e < best.e) best = { f, p, e };
    }
    if (best) candidates.push(best);
  }
  if (!candidates.length) throw new Error('no straight walking found');
  const bestErr = Math.min(...candidates.map((c) => c.e));
  const good = candidates.filter((c) => c.e < Math.max(bestErr * 1.35, 0.02));
  return good.reduce((a, c) => (c.p < a.p || (c.p === a.p && c.e < a.e) ? c : a));
}

function bakeStride({ data }, { f, p }) {
  const J = JOINTS.length;
  const get = (frame, j) => {
    const k = (frame * J + j) * 3;
    return [data[k], data[k + 1], data[k + 2]];
  };
  const start = get(f, 0), end = get(f + p, 0);
  const heading = Math.atan2(end[0] - start[0], end[2] - start[2]);
  const c = Math.cos(-heading), s = Math.sin(-heading);

  // Travel removed and walking direction aligned to +z. Hip sway stays.
  const raw = [];
  for (let i = 0; i < p; i++) {
    const u = i / p;
    const ox = start[0] + (end[0] - start[0]) * u;
    const oz = start[2] + (end[2] - start[2]) * u;
    const pose = [];
    for (let j = 0; j < J; j++) {
      const q = get(f + i, j);
      const x = q[0] - ox, z = q[2] - oz;
      pose.push([x * c + z * s, q[1], -x * s + z * c]);
    }
    raw.push(pose);
  }

  // Close the seam: spread the end-to-start error over the stride.
  const seam = [];
  for (let j = 0; j < J; j++) {
    const q = get(f + p, j);
    const x = q[0] - end[0], z = q[2] - end[2];
    const closed = [x * c + z * s, q[1], -x * s + z * c];
    seam.push(closed.map((v, a) => v - raw[0][j][a]));
  }
  for (let i = 0; i < p; i++) {
    const u = i / p;
    for (let j = 0; j < J; j++) for (let a = 0; a < 3; a++) raw[i][j][a] -= seam[j][a] * u;
  }

  // Rebuild on neutral proportions: keep each bone's direction, replace its length.
  const rebuilt = raw.map((pose) => {
    const out = new Array(J);
    const hipHeight = pose[0][1] / sourceLegLength(pose);
    out[0] = [pose[0][0], hipHeight * LEG, pose[0][2]];
    for (const [name, parent, length] of NEUTRAL) {
      const j = INDEX[name], pj = INDEX[parent];
      const d = [0, 1, 2].map((a) => pose[j][a] - pose[pj][a]);
      const l = Math.hypot(...d) || 1;
      out[j] = [0, 1, 2].map((a) => out[pj][a] + (d[a] / l) * length);
    }
    return out;
  });

  // Circular Gaussian smooth: takes out sensor noise, keeps the gait.
  const sigma = 2.2, radius = 7;
  const weights = [];
  for (let r = -radius; r <= radius; r++) weights.push(Math.exp(-(r * r) / (2 * sigma * sigma)));
  const total = weights.reduce((a, b) => a + b, 0);
  const smooth = rebuilt.map((_, i) =>
    Array.from({ length: J }, (_, j) =>
      [0, 1, 2].map((a) => {
        let v = 0;
        for (let r = -radius; r <= radius; r++) {
          v += rebuilt[(i + r + p) % p][j][a] * weights[r + radius];
        }
        return v / total;
      }),
    ),
  );

  // Resample to 24 fps.
  const count = Math.round((p / 60) * FPS_OUT);
  const frames = Array.from({ length: count }, (_, n) => {
    const t = (n / count) * p;
    const i = Math.floor(t), u = t - i;
    const A = smooth[i % p], B = smooth[(i + 1) % p];
    return A.map((q, j) => q.map((v, a) => v + (B[j][a] - v) * u));
  });

  // Foot on the floor: the lowest point of the stride is y = 0.
  let floor = Infinity;
  for (const pose of frames) {
    for (const name of ['L_TOE', 'R_TOE', 'L_ANKL', 'R_ANKL']) floor = Math.min(floor, pose[INDEX[name]][1]);
  }
  for (const pose of frames) for (const q of pose) q[1] -= floor;

  // Centre the stride on the mark.
  let mx = 0, mz = 0;
  for (const pose of frames) {
    mx += pose[0][0];
    mz += pose[0][2];
  }
  mx /= count;
  mz /= count;
  for (const pose of frames) {
    for (const q of pose) {
      q[0] -= mx;
      q[2] -= mz;
    }
  }
  return frames;
}

function sourceLegLength(pose) {
  const seg = (a, b) => Math.hypot(...[0, 1, 2].map((x) => pose[INDEX[a]][x] - pose[INDEX[b]][x]));
  return (seg('L_HIP', 'L_KNEE') + seg('L_KNEE', 'L_ANKL') + seg('R_HIP', 'R_KNEE') + seg('R_KNEE', 'R_ANKL')) / 2;
}

function encode(frames) {
  const J = JOINTS.length;
  const out = new Int16Array(frames.length * J * 3);
  frames.forEach((pose, f) =>
    pose.forEach((q, j) =>
      q.forEach((v, a) => {
        out[(f * J + j) * 3 + a] = Math.round(v * 1000);
      }),
    ),
  );
  return Buffer.from(out.buffer).toString('base64');
}

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/build-motion.mjs <dir-of-downloaded-glbs>');
  process.exit(1);
}

const baked = TAKES.map((take) => {
  const clip = worldPositions(readGlb(path.join(src, take.file)));
  const stride = findStride(clip);
  const frames = bakeStride(clip, stride);
  console.log(
    `${take.id}: ${clip.frames} frames, stride ${stride.p} at ${stride.f}, closure ${(stride.e * 1000).toFixed(1)} mm, ${frames.length} out`,
  );
  return { ...take, count: frames.length, data: encode(frames) };
});

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/components/stage/takes.ts');
fs.writeFileSync(
  out,
  `// Generated by scripts/build-motion.mjs. Do not edit.
// Motion: The 100STYLE Dataset, Ian Mason (CC BY 4.0), https://www.ianxmason.com/100style/
// Changed: cut to a single looping stride, travel removed, rebuilt on neutral body
// proportions, smoothed, resampled to ${FPS_OUT} fps. Int16 millimetres, little-endian.

export const JOINT_NAMES = ${JSON.stringify(JOINTS.map(([name]) => name))} as const;
export const TAKE_FPS = ${FPS_OUT};

export const TAKES = [
${baked
  .map(
    (t) => `  { id: '${t.id}', label: '${t.label}', frames: ${t.count}, data: '${t.data}' },`,
  )
  .join('\n')}
] as const;
`,
);
console.log(`wrote ${path.relative(process.cwd(), out)} (${fs.statSync(out).size} bytes)`);
