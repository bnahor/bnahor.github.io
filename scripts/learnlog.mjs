#!/usr/bin/env node
/**
 * Runs scripts/ingest-learnlog.ts under whichever TypeScript-capable runtime
 * is available: bun if installed, otherwise node >= 22.6 (native type
 * stripping). Keeps `dev`/`build` working on machines without bun while CI
 * (which installs bun via setup-bun) uses the fast path.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const cwd = fileURLToPath(new URL('..', import.meta.url));

for (const cmd of ['bun', 'node', 'tsx']) {
  const probe = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
  if (probe.error) continue;

  const result = spawnSync(cmd, ['scripts/ingest-learnlog.ts', ...args], {
    stdio: 'inherit',
    cwd,
  });
  process.exit(result.status ?? 1);
}

console.error('[learnlog] no runtime with TypeScript support found (tried bun, node, tsx)');
// Non-fatal on purpose: a missing runtime should never block the site build —
// the committed public/learnlog data remains the deploy source.
process.exit(0);
