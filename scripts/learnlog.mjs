#!/usr/bin/env node
/**
 * Runs the ingest scripts under whichever TypeScript-capable runtime is
 * available: bun if installed, otherwise node >= 22.6 (native type
 * stripping), otherwise tsx. Keeps `dev`/`build` working on machines without
 * bun while CI (which installs bun via setup-bun) uses the fast path.
 *
 * The library is compiled first: the shelf ingester reads library.json to
 * inherit page counts and PDF links for notes that name a `library:` item.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const cwd = fileURLToPath(new URL('..', import.meta.url));

// `--watch` belongs to the shelf ingester only — the library is a directory
// scan, run once per invocation.
const watching = args.includes('--watch');
const SCRIPTS = [
  { file: 'scripts/ingest-library.ts', args: [] },
  { file: 'scripts/ingest-learnlog.ts', args },
];

function runtime() {
  for (const cmd of ['bun', 'node', 'tsx']) {
    // stdout has to be piped, not ignored — the version string is the point.
    const probe = spawnSync(cmd, ['--version'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
    if (probe.error || probe.status !== 0) continue;

    // node only strips types from 22.6 on; below that it exits non-zero on
    // the first `import type`, so check the version rather than finding out
    // by failing a real run.
    if (cmd === 'node') {
      const [major = 0, minor = 0] = (probe.stdout ?? '')
        .replace(/^v/, '')
        .split('.')
        .map((n) => Number.parseInt(n, 10) || 0);
      if (major < 22 || (major === 22 && minor < 6)) continue;
    }

    return cmd;
  }
  return null;
}

const cmd = runtime();

if (!cmd) {
  console.error('[learnlog] no runtime with TypeScript support found (tried bun, node >= 22.6, tsx)');
  // Non-fatal on purpose: a missing runtime should never block the site build
  // — the committed public/learnlog data remains the deploy source.
  process.exit(0);
}

for (const script of SCRIPTS) {
  // In watch mode the shelf ingester never returns, so it has to run last.
  const result = spawnSync(cmd, [script.file, ...script.args], { stdio: 'inherit', cwd });
  if (result.status !== 0 && !watching) process.exit(result.status ?? 1);
}
