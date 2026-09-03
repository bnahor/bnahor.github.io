#!/usr/bin/env node
/**
 * Scaffolds a new shelf note in the vault, stamped with today's date.
 *
 *   npm run new "Modern Robotics — Lecture 3" -- --type lecture --source https://…
 *   bun run new "Modern Robotics — Lecture 3" --type lecture --source https://…
 *
 * Flags: --type (lecture|book|paper|course|video|article)
 *        --source URL       --status (queued|active|done|shelved)
 *        --tags a,b         --open (open in Obsidian after creating)
 *        --library ID       link to a library item: the note then inherits
 *                           its page count and publisher PDF, and the
 *                           library row stops offering "start notes".
 *
 * The Library page hands you this command, pre-filled, for any row.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VAULT = (process.env.LEARNLOG_VAULT ?? path.join(process.env.HOME ?? '', 'Documents', 'Obsidian Vault'));
const SOURCE_DIR = path.join(VAULT, 'Learning Log');

const KINDS = new Set(['lecture', 'book', 'paper', 'course', 'video', 'article']);
const STATUSES = new Set(['queued', 'active', 'done', 'shelved']);

function fail(message) {
  console.error(`[new] ${message}`);
  process.exit(1);
}

// ---- parse args -----------------------------------------------------------

const args = process.argv.slice(2);
const flags = {};
const positional = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--open') {
    flags.open = true;
  } else if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith('--')) fail(`missing value for --${key}`);
    flags[key] = next;
    i++;
  } else {
    positional.push(arg);
  }
}

const title = positional.join(' ').trim();
if (!title) {
  fail(
    'usage: npm run new "Note title" -- [--type lecture] [--source URL] [--status active] [--tags a,b] [--library ID] [--open]',
  );
}

const kind = KINDS.has(flags.type) ? flags.type : 'article';
const status = STATUSES.has(flags.status) ? flags.status : 'queued';
const tags = (flags.tags ?? '')
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean);

// ---- write note -----------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);
const slug =
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'note';

const file = path.join(SOURCE_DIR, `${today}-${slug}.md`);
if (fs.existsSync(file)) fail(`already exists: ${file}`);

const yamlTitle = `"${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const yamlTags = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';

const body = [
  '---',
  `title: ${yamlTitle}`,
  `type: ${kind}`,
  `source: ${flags.source ?? ''}`,
  `status: ${status}`,
  ...(flags.library ? [`library: ${flags.library}`] : []),
  ...(status === 'queued' ? [] : [`started: ${today}`]),
  'tags: ' + yamlTags,
  '---',
  '',
  '',
  '',
].join('\n');

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.writeFileSync(file, body);

console.log(`[new] ${file}`);

// ---- optional: open in Obsidian ------------------------------------------

if (flags.open) {
  const uri = `obsidian://open?path=${encodeURIComponent(file)}`;
  try {
    execFileSync('open', [uri], { stdio: 'ignore' });
  } catch {
    console.error('[new] could not open Obsidian — open the file manually');
  }
}

console.log('[new] next: add markers like `00:14:32 — point` (video) or `p. 42 — point` (book)');
