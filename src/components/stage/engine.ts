import { JOINT_NAMES, TAKE_FPS, TAKES } from './takes';

/**
 * The capture stage: a point-cloud performer playing back real motion on a
 * canvas. Away from the lens its markers show raw tracker noise; under the lens
 * they lock and the skeleton solve appears. Loose dust accretes around the
 * cursor. Everything is canvas 2D, and it renders nothing while off screen.
 */

export type Scene = { jitter: number; skeleton: number };
export type Framing = { x: number; floor: number; scale: number; visible: boolean };
export type Hud = { timecode: string; jitter: string };

type Bone = { a: number; b: number; ra: number; rb: number; share: number; line: boolean; flat: number };

const J = JOINT_NAMES.length;
const jointIndex = (name: (typeof JOINT_NAMES)[number]) => JOINT_NAMES.indexOf(name) * 3;

const bone = (
  a: (typeof JOINT_NAMES)[number],
  b: (typeof JOINT_NAMES)[number],
  ra: number,
  rb: number,
  share: number,
  flat = 1,
): Bone => ({ a: jointIndex(a), b: jointIndex(b), ra, rb, share, line: a !== b, flat });

const BONES: Bone[] = [
  bone('PELVIS', 'CHEST', 0.135, 0.165, 0.2, 0.68),
  bone('CHEST', 'NECK', 0.15, 0.055, 0.09, 0.68),
  bone('HEAD', 'HEAD', 0.108, 0.108, 0.1),
  bone('L_SHLD', 'R_SHLD', 0.055, 0.055, 0.035),
  bone('L_HIP', 'R_HIP', 0.075, 0.075, 0.03),
  bone('L_HIP', 'L_KNEE', 0.088, 0.058, 0.07),
  bone('R_HIP', 'R_KNEE', 0.088, 0.058, 0.07),
  bone('L_KNEE', 'L_ANKL', 0.056, 0.036, 0.055),
  bone('R_KNEE', 'R_ANKL', 0.056, 0.036, 0.055),
  bone('L_ANKL', 'L_TOE', 0.034, 0.024, 0.018),
  bone('R_ANKL', 'R_TOE', 0.034, 0.024, 0.018),
  bone('L_SHLD', 'L_ELBW', 0.052, 0.04, 0.045),
  bone('R_SHLD', 'R_ELBW', 0.052, 0.04, 0.045),
  bone('L_ELBW', 'L_WRST', 0.04, 0.028, 0.035),
  bone('R_ELBW', 'R_WRST', 0.04, 0.028, 0.035),
  bone('L_WRST', 'L_HAND', 0.028, 0.024, 0.012),
  bone('R_WRST', 'R_HAND', 0.028, 0.024, 0.012),
];

/** Joints that crowd each other get a marker but no label. */
const UNLABELLED = /PELVIS|HIP|HAND|TOE/;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const pad = (n: number) => String(n).padStart(2, '0');

function decodeTakes() {
  return TAKES.map((take) => {
    const bytes = Uint8Array.from(atob(take.data), (c) => c.charCodeAt(0));
    const ints = new Int16Array(bytes.buffer);
    const pos = new Float32Array(ints.length);
    for (let i = 0; i < ints.length; i++) pos[i] = ints[i]! / 1000;
    return { label: take.label, frames: take.frames, pos };
  });
}

export function createStage(canvas: HTMLCanvasElement, opts: { reduce: boolean; onHud: (hud: Hud) => void }) {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx = context;
  const { reduce, onHud } = opts;
  const styles = getComputedStyle(canvas);
  const INK = styles.getPropertyValue('--ink').trim() || '#11110e';
  const SPIKE = styles.getPropertyValue('--spike').trim() || '#ff1f6b';
  const DATA_FONT = styles.getPropertyValue('--data').trim() || 'monospace';

  const takes = decodeTakes();
  let take = takes[0]!;
  let phase = 0;
  let blend = 1;
  const pose = new Float32Array(J * 3);
  const from = new Float32Array(J * 3);

  // Particles
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 620;
  const N_BODY = smallScreen ? 1500 : 2800;
  const N_DUST = smallScreen ? 240 : 620;
  let bodyCount = N_BODY;
  let dustCount = N_DUST;
  const pBone = new Uint8Array(N_BODY);
  const pS = new Float32Array(N_BODY);
  const pC = new Float32Array(N_BODY);
  const pN = new Float32Array(N_BODY);
  const pY = new Float32Array(N_BODY);
  const pPh = new Float32Array(N_BODY);
  const pF = new Float32Array(N_BODY);
  {
    // Shuffled so that dropping quality thins the whole body evenly.
    const shares = BONES.reduce((sum, b) => sum + b.share, 0);
    const assign: number[] = [];
    BONES.forEach((b, i) => {
      const n = Math.round((b.share / shares) * N_BODY);
      for (let k = 0; k < n; k++) assign.push(i);
    });
    for (let i = assign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assign[i], assign[j]] = [assign[j]!, assign[i]!];
    }
    for (let i = 0; i < N_BODY; i++) {
      const bi = assign[i] ?? 0;
      const b = BONES[bi]!;
      const s = Math.random();
      const r = (b.ra + (b.rb - b.ra) * s) * Math.sqrt(0.55 + 0.45 * Math.random());
      const th = Math.random() * Math.PI * 2;
      pBone[i] = bi;
      pS[i] = s;
      if (b.line) {
        pC[i] = Math.cos(th) * r;
        pN[i] = Math.sin(th) * r * b.flat;
        pY[i] = 0;
      } else {
        const u = Math.random() * 2 - 1;
        const q = Math.sqrt(1 - u * u);
        pC[i] = q * Math.cos(th) * r * 0.86;
        pN[i] = q * Math.sin(th) * r;
        pY[i] = u * r * 1.18 + 0.09;
      }
      pPh[i] = Math.random() * Math.PI * 2;
      pF[i] = 16 + Math.random() * 26;
    }
  }
  const basis = new Float32Array(BONES.length * 6);
  const dx = new Float32Array(N_DUST);
  const dy = new Float32Array(N_DUST);
  const dvx = new Float32Array(N_DUST);
  const dvy = new Float32Array(N_DUST);
  const da = new Float32Array(N_DUST);

  // View state
  let W = 0;
  let H = 0;
  let dpr = 1;
  let dprCap = Math.min(window.devicePixelRatio || 1, smallScreen ? 1.75 : 2);
  let lensR = 170;
  const target: Framing = { x: 0, floor: 0, scale: 300, visible: true };
  let x = 0;
  let floor = 0;
  let S = 300;
  let alpha = 1;
  let framed = false;
  let jitter = reduce ? 0.2 : 0.62;
  let jitterTo = jitter;
  let skel = 0;
  let skelTo = 0;
  const lens = { x: 0, y: 0, tx: 0, ty: 0, last: -1e9 };
  let pull = 0.4;

  let t = reduce ? 3.1 : 0;
  let raf = 0;
  let running = false;
  let lastNow = 0;
  let lastHud = 0;
  let slowFrames = 0;
  let frameEma = 16;

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    dpr = dprCap;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    lensR = Math.min(W, H) * (W < H ? 0.26 : 0.2);
  }

  function seedDust() {
    for (let i = 0; i < N_DUST; i++) {
      dx[i] = Math.random() * W;
      dy[i] = Math.random() * H;
      dvx[i] = (Math.random() - 0.5) * 6;
      dvy[i] = (Math.random() - 0.5) * 6;
      da[i] = Math.random() * Math.PI * 2;
    }
  }

  function samplePose() {
    const f = ((phase % take.frames) + take.frames) % take.frames;
    const i0 = Math.floor(f);
    const i1 = (i0 + 1) % take.frames;
    const u = f - i0;
    const a = i0 * J * 3;
    const b = i1 * J * 3;
    const e = blend >= 1 ? 1 : blend * blend * (3 - 2 * blend);
    for (let k = 0; k < J * 3; k++) {
      const v = take.pos[a + k]! + (take.pos[b + k]! - take.pos[a + k]!) * u;
      pose[k] = e >= 1 ? v : from[k]! + (v - from[k]!) * e;
    }
  }

  /** Per-bone cross-section axes, aligned to the shoulders so the torso stays flat-chested. */
  function computeBasis() {
    const ls = jointIndex('L_SHLD');
    const rs = jointIndex('R_SHLD');
    let hx = pose[ls]! - pose[rs]!;
    let hy = pose[ls + 1]! - pose[rs + 1]!;
    let hz = pose[ls + 2]! - pose[rs + 2]!;
    const hl = Math.hypot(hx, hy, hz) || 1;
    hx /= hl;
    hy /= hl;
    hz /= hl;
    BONES.forEach((b, i) => {
      let dX = pose[b.b]! - pose[b.a]!;
      let dY = pose[b.b + 1]! - pose[b.a + 1]!;
      let dZ = pose[b.b + 2]! - pose[b.a + 2]!;
      const l = Math.hypot(dX, dY, dZ);
      if (l < 1e-4) {
        basis.set([1, 0, 0, 0, 0, 1], i * 6);
        return;
      }
      dX /= l;
      dY /= l;
      dZ /= l;
      let dot = hx * dX + hy * dY + hz * dZ;
      let ax = hx;
      let ay = hy;
      let az = hz;
      if (Math.abs(dot) > 0.92) {
        ax = 0;
        ay = 0;
        az = 1;
        dot = dZ;
      }
      let ux = ax - dX * dot;
      let uy = ay - dY * dot;
      let uz = az - dZ * dot;
      const ul = Math.hypot(ux, uy, uz) || 1;
      ux /= ul;
      uy /= ul;
      uz /= ul;
      basis[i * 6] = ux;
      basis[i * 6 + 1] = uy;
      basis[i * 6 + 2] = uz;
      basis[i * 6 + 3] = dY * uz - dZ * uy;
      basis[i * 6 + 4] = dZ * ux - dX * uz;
      basis[i * 6 + 5] = dX * uy - dY * ux;
    });
  }

  function draw(now: number) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    x += (target.x - x) * 0.05;
    floor += (target.floor - floor) * 0.06;
    S += (target.scale - S) * 0.06;
    alpha += ((target.visible ? 1 : 0) - alpha) * 0.08;
    jitter += (jitterTo - jitter) * 0.045;
    skel += (skelTo - skel) * 0.05;

    // Lens: steered by the cursor, otherwise it patrols the performer.
    const steering = now - lens.last < 1600;
    if (steering) {
      lens.x += (lens.tx - lens.x) * 0.16;
      lens.y += (lens.ty - lens.y) * 0.16;
    } else {
      const ax = x + Math.sin(t * 0.43) * S * 0.42;
      const ay = floor - S * (0.95 + 0.72 * Math.sin(t * 0.31));
      lens.x += (ax - lens.x) * 0.03;
      lens.y += (ay - lens.y) * 0.03;
    }
    const lx = lens.x;
    const ly = lens.y;
    const R = Math.min(lensR, S * 0.62);
    const mark = Math.min(3, S / 40);

    samplePose();

    const nx = clamp((lx - x) / (W * 0.5), -1, 1);
    const yaw = -0.95 + nx * 0.42 + Math.sin(t * 0.17) * 0.05;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);

    // Capture volume: ring of cameras, contact shadow, tape mark.
    if (alpha > 0.01) {
      const rx = Math.min(S * 1.02, W * 0.44);
      const ry = S * 0.2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, floor);
      ctx.scale(1, ry / (rx * 0.5));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 0.5);
      g.addColorStop(0, 'rgba(17,17,14,.28)');
      g.addColorStop(1, 'rgba(17,17,14,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.34 * alpha;
      ctx.beginPath();
      ctx.ellipse(x, floor, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.moveTo(x + Math.cos(a) * rx, floor + Math.sin(a) * ry);
        ctx.lineTo(x + Math.cos(a) * (rx + 9), floor + Math.sin(a) * (ry + 2.2));
      }
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = SPIKE;
      ctx.fillRect(x - S * 0.11, floor + ry * 0.74, S * 0.22, 3);
      ctx.fillRect(x - 1.5, floor + ry * 0.74, 3, S * 0.05);
      ctx.globalAlpha = 1;
    }

    // Dust
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    const reach = lensR * 1.9;
    const gravity = steering ? pull : 0.4;
    for (let i = 0; i < dustCount; i++) {
      if (!reduce) {
        const ox = lx - dx[i]!;
        const oy = ly - dy[i]!;
        const d = Math.hypot(ox, oy) || 1;
        const f = (1 - ss(0, reach, d)) * gravity * 0.34;
        // Radial pull plus a tangential push, so grains orbit into a disc.
        dvx[i] = dvx[i]! + (ox / d) * f - (oy / d) * f * 1.5 + Math.cos(da[i]!) * 0.012;
        dvy[i] = dvy[i]! + (oy / d) * f + (ox / d) * f * 1.5 + Math.sin(da[i]!) * 0.012;
        da[i] = da[i]! + 0.01;
        if (d < lensR * 0.32) {
          dvx[i] = dvx[i]! - (ox / d) * 0.7;
          dvy[i] = dvy[i]! - (oy / d) * 0.7;
        }
        dvx[i] = dvx[i]! * 0.955;
        dvy[i] = dvy[i]! * 0.955;
        dx[i] = dx[i]! + dvx[i]!;
        dy[i] = dy[i]! + dvy[i]!;
        if (dx[i]! < -8) dx[i] = W + 8;
        else if (dx[i]! > W + 8) dx[i] = -8;
        if (dy[i]! < -8) dy[i] = H + 8;
        else if (dy[i]! > H + 8) dy[i] = -8;
      }
      ctx.rect(dx[i]!, dy[i]!, 1.3, 1.3);
    }
    ctx.fill();
    ctx.globalAlpha = 1;

    if (alpha > 0.01) {
      computeBasis();

      // Markers
      const amp = S * 0.1;
      const swapWindow = Math.floor(t * 7);
      const noisy = new Path2D();
      const clean = new Path2D();
      for (let i = 0; i < bodyCount; i++) {
        const bi = pBone[i]!;
        const b = BONES[bi]!;
        const s = pS[i]!;
        const c = pC[i]!;
        const n = pN[i]!;
        const k = bi * 6;
        const wx = pose[b.a]! + (pose[b.b]! - pose[b.a]!) * s + basis[k]! * c + basis[k + 3]! * n;
        const wy = pose[b.a + 1]! + (pose[b.b + 1]! - pose[b.a + 1]!) * s + basis[k + 1]! * c + basis[k + 4]! * n + pY[i]!;
        const wz = pose[b.a + 2]! + (pose[b.b + 2]! - pose[b.a + 2]!) * s + basis[k + 2]! * c + basis[k + 5]! * n;
        const X = wx * cy + wz * sy;
        const Z = -wx * sy + wz * cy;
        const p = 1 / (1 - Z * 0.16);
        let px = x + X * S * p;
        let py = floor - wy * S * p + Z * S * 0.09;
        const l = 1 - ss(R * 0.42, R, Math.hypot(px - lx, py - ly));
        const A = jitter * (1 - l);
        if (A > 0.01) {
          const q = amp * A;
          const ph = pPh[i]!;
          const fr = pF[i]!;
          px += q * Math.sin(t * fr + ph) * Math.sin(t * 3.1 + ph * 3);
          py += q * Math.sin(t * fr * 1.27 + ph * 2) * Math.cos(t * 2.3 + ph);
          // Marker swap: a point jumps away for a few frames, as bad tracking does.
          const h = Math.sin((i + 1) * 12.9898 + swapWindow * 78.233) * 43758.5453;
          if (h - Math.floor(h) < 0.012 * A) {
            px += (ph - 3.14) * amp * 1.3;
            py += (fr - 28) * amp * 0.1;
          }
        }
        (A > 0.12 ? noisy : clean).rect(px, py, 1.7, 1.7);
      }
      ctx.fillStyle = INK;
      ctx.globalAlpha = 0.62 * alpha;
      ctx.fill(noisy);
      ctx.globalAlpha = 0.96 * alpha;
      ctx.fill(clean);

      // Skeleton solve
      const project = (k: number): [number, number] => {
        const wx = pose[k]!;
        const wz = pose[k + 2]!;
        const X = wx * cy + wz * sy;
        const Z = -wx * sy + wz * cy;
        const p = 1 / (1 - Z * 0.16);
        return [x + X * S * p, floor - pose[k + 1]! * S * p + Z * S * 0.09];
      };
      ctx.lineWidth = Math.min(1.5, S / 80);
      ctx.strokeStyle = SPIKE;
      for (const b of BONES) {
        if (!b.line) continue;
        const pa = project(b.a);
        const pb = project(b.b);
        const dist = Math.hypot((pa[0] + pb[0]) / 2 - lx, (pa[1] + pb[1]) / 2 - ly);
        const al = Math.max(skel * 0.9, 1 - ss(R * 0.4, R * 0.95, dist));
        if (al < 0.02) continue;
        ctx.globalAlpha = al * alpha;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.stroke();
      }
      ctx.font = `400 8.5px ${DATA_FONT}`;
      ctx.textBaseline = 'middle';
      for (let j = 0; j < J; j++) {
        const k = j * 3;
        const q = project(k);
        const near = 1 - ss(R * 0.4, R * 0.95, Math.hypot(q[0] - lx, q[1] - ly));
        const al = Math.max(skel * 0.95, near);
        if (al < 0.02) continue;
        ctx.globalAlpha = al * alpha;
        ctx.fillStyle = SPIKE;
        ctx.fillRect(q[0] - mark, q[1] - mark, mark * 2, mark * 2);
        const name = JOINT_NAMES[j]!;
        if (near > 0.3 && W > 720 && !UNLABELLED.test(name)) {
          ctx.globalAlpha = near * alpha;
          ctx.fillStyle = INK;
          ctx.fillText(`${name} ${pose[k]!.toFixed(2)} ${pose[k + 1]!.toFixed(2)}`, q[0] + 8, q[1]);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (now - lastHud > 90) {
      lastHud = now;
      const fr = Math.floor(t * 24);
      onHud({
        timecode: `${pad(Math.floor(fr / 86400))}:${pad(Math.floor(fr / 1440) % 60)}:${pad(Math.floor(fr / 24) % 60)}:${pad(fr % 24)}`,
        jitter: (jitter * S * 0.06).toFixed(1).padStart(4, '0'),
      });
    }
  }

  /** Thin the crowd rather than drop frames: phones vary far more than desktops. */
  function adapt(dt: number) {
    frameEma += (dt * 1000 - frameEma) * 0.05;
    slowFrames = frameEma > 24 ? slowFrames + 1 : 0;
    if (slowFrames > 50 && bodyCount > 700) {
      bodyCount = Math.round(bodyCount * 0.75);
      dustCount = Math.round(dustCount * 0.7);
      if (dprCap > 1) {
        dprCap = Math.max(1, dprCap - 0.5);
        resize();
      }
      slowFrames = 0;
    }
  }

  function tick(now: number) {
    raf = 0;
    if (!running || document.hidden) return;
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.05) : 0;
    lastNow = now;
    t += dt;
    phase += dt * TAKE_FPS;
    if (blend < 1) blend = Math.min(1, blend + dt / 0.5);
    if (dt) adapt(dt);
    draw(now);
    raf = requestAnimationFrame(tick);
  }

  function requestDraw() {
    if (!raf) {
      raf = requestAnimationFrame((now) => {
        raf = 0;
        draw(now);
      });
    }
  }

  const start = () => {
    running = true;
    if (reduce) {
      requestDraw();
    } else if (!raf) {
      lastNow = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (running) {
      start();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(() => {
    resize();
    if (reduce) requestDraw();
  });
  ro.observe(canvas);

  resize();
  seedDust();
  samplePose();

  return {
    start,
    stop,
    setScene(scene: Scene) {
      jitterTo = reduce ? scene.jitter * 0.3 : scene.jitter;
      skelTo = scene.skeleton;
      if (reduce) {
        jitter = jitterTo;
        skel = skelTo;
        requestDraw();
      }
    },
    setFraming(framing: Framing) {
      Object.assign(target, framing);
      if (!framed || reduce) {
        x = target.x;
        floor = target.floor;
        S = target.scale;
        alpha = target.visible ? 1 : 0;
        lens.x = x;
        lens.y = floor - S * 1.5;
        framed = true;
        requestDraw();
      }
    },
    setLens(px: number, py: number, gravity: number) {
      lens.tx = px;
      lens.ty = py;
      lens.last = performance.now();
      pull = gravity;
      if (reduce) {
        lens.x = px;
        lens.y = py;
        requestDraw();
      }
    },
    setTake(index: number) {
      const next = takes[index];
      if (!next || next === take) return;
      from.set(pose);
      phase = (phase / take.frames) * next.frames;
      take = next;
      blend = reduce ? 1 : 0;
      jitter = Math.max(jitter, 0.55);
      if (reduce) {
        samplePose();
        requestDraw();
      }
    },
    destroy() {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

export type StageApi = NonNullable<ReturnType<typeof createStage>>;
