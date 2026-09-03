#!/usr/bin/env node
/**
 * Publishes the compiled shelf: ingest → commit public/learnlog → push.
 *
 *   npm run learn:publish          one-shot: publish and push (main only)
 *   npm run learn:live             watch the vault; publish ~4s after saves
 *   node scripts/publish-shelf.mjs --dry-run   show what would happen
 *
 * Only ever touches public/learnlog — never stages unrelated work. On a
 * non-main branch it ingests but leaves git alone, so feature branches stay
 * clean and deploys stay on main.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VAULT = process.env.LEARNLOG_VAULT ?? path.join(process.env.HOME ?? '', 'Documents', 'Obsidian Vault');
const SOURCE_DIR = path.join(VAULT, 'Learning Log');
const DATA_DIR = 'public/learnlog';

const dryRun = process.argv.includes('--dry-run');
const watchMode = process.argv.includes('--watch');

const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).trim();
const gitOk = (...args) => {
  const res = spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
  return res.status === 0;
};

function ingest() {
  const res = spawnSync('node', ['scripts/learnlog.mjs'], { cwd: ROOT, stdio: 'inherit' });
  return res.status === 0;
}

function changedFiles() {
  return git('status', '--porcelain', '-uall', '--', DATA_DIR)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function publish() {
  if (!ingest()) {
    console.error('[publish] ingest failed — leaving git alone');
    return;
  }

  const changes = changedFiles();
  if (changes.length === 0) {
    console.log('[publish] shelf is fresh, nothing to commit');
    return;
  }

  let branch = '';
  try {
    branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  } catch {
    branch = '';
  }
  if (branch !== 'main') {
    console.log(`[publish] on branch "${branch || '?'}" — ingested, but commits land on main only`);
    return;
  }

  const message = `shelf: compile ${changes.length} file${changes.length === 1 ? '' : 's'}`;

  if (dryRun) {
    console.log(`[publish] dry run — would commit ${changes.length} file(s):`);
    for (const c of changes) console.log(`         ${c}`);
    return;
  }

  git('add', '--', DATA_DIR);
  if (!gitOk('commit', '-m', message)) {
    console.error('[publish] commit failed — check git state');
    return;
  }
  console.log(`[publish] committed ${changes.length} file(s)`);

  if (gitOk('push')) {
    console.log('[publish] pushed → deploy on its way');
  } else {
    console.error('[publish] push failed (offline? auth?) — push manually when ready');
  }
}

if (watchMode) {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`[publish] no vault at ${SOURCE_DIR}`);
    process.exit(1);
  }
  publish();
  console.log(`[publish] watching ${SOURCE_DIR} — save a note, it ships`);
  let timer;
  fs.watch(SOURCE_DIR, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(publish, 4000);
  });
} else {
  publish();
}
