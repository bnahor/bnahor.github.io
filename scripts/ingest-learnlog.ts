/**
 * Compiles the Obsidian vault's "Learning Log" folder into public/learnlog/.
 *
 * Usage:
 *   bun scripts/ingest-learnlog.ts           one-shot ingest (diff-based)
 *   bun scripts/ingest-learnlog.ts --watch   re-ingest on vault changes
 *
 * Behaviour:
 *   - Only files whose compiled JSON differs from what is already emitted are
 *     rewritten, so git diffs stay minimal.
 *   - Files with `public: false` or `draft: true` are never emitted.
 *   - If the vault folder is missing (e.g. CI), this exits 0 without touching
 *     anything — the committed public/learnlog/ is the deploy source there.
 *
 * Override the vault location with LEARNLOG_VAULT=/path/to/vault.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EntryKind,
  EntryStatus,
  LearnBlock,
  LearnEntry,
  LearnManifest,
  LibraryItem,
  LibraryManifest,
  ManifestEntry,
} from '../src/learn/types';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEFAULT_VAULT = path.join(process.env.HOME ?? '', 'Documents', 'Obsidian Vault');
const VAULT = expandTilde(process.env.LEARNLOG_VAULT ?? DEFAULT_VAULT);
const SOURCE_DIR = path.join(VAULT, 'Learning Log');
const OUT_DIR = path.join(ROOT, 'public', 'learnlog');

const KINDS = new Set(['lecture', 'book', 'paper', 'course', 'video', 'article']);
/**
 * Files in OUT_DIR that are not compiled notes. The orphan sweep below deletes
 * everything it doesn't recognise, so anything else written to this directory
 * — library.json in particular — has to be named here or it gets removed on
 * the next ingest.
 */
const RESERVED = new Set(['index.json', 'library.json']);
const STATUSES = new Set(['queued', 'active', 'done', 'shelved']);

type Scalar = string | number | boolean;
type Frontmatter = Record<string, Scalar | Scalar[]>;

/* ------------------------------------------------------------------ parse */

function expandTilde(p: string): string {
  return p.startsWith('~') ? path.join(process.env.HOME ?? '', p.slice(1)) : p;
}

/** Subset frontmatter parser: scalars, inline arrays, block arrays. */
function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return { data: {}, body: normalized };

  const end = normalized.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: normalized };

  const fmText = normalized.slice(4, end);
  const body = normalized.slice(end + 4).replace(/^\n+/, '');

  const data: Frontmatter = {};
  const lines = fmText.split('\n');
  let pendingKey: string | null = null;
  let list: Scalar[] = [];

  const commitList = () => {
    if (pendingKey !== null) {
      data[pendingKey] = list;
      pendingKey = null;
    }
    list = [];
  };

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem && pendingKey !== null) {
      list.push(coerce(listItem[1] ?? ''));
      continue;
    }

    const kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    commitList();

    const key = kv[1] ?? '';
    // YAML-style trailing comments: `# ...` counts as a comment only when
    // preceded by whitespace, so URL fragments (`https://x/#page=3`) survive.
    const value = (kv[2] ?? '').replace(/\s+#.*$/, '').trim();
    if (value === '') {
      // Could open a block array; wait for the `- item` lines.
      pendingKey = key;
      list = [];
      continue;
    }

    const inline = /^\[(.*)\]$/.exec(value);
    if (inline) {
      const items = (inline[1] ?? '')
        .split(',')
        .map((s) => coerce(s.trim()))
        .filter((s) => s !== '');
      data[key] = items.length > 0 ? items : [];
    } else {
      data[key] = coerce(value);
    }
  }
  commitList();

  return { data, body };
}

function coerce(raw: string): Scalar {
  const v = raw.trim().replace(/^["']|["']$/g, '');
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/* ----------------------------------------------------------------- blocks */

const TIME_MARKER =
  /^\s*(?:[-*+]\s+)?((?:\d{1,3}:)?\d{1,4}:[0-5]\d)\s*(?:—|–|-|:)\s*(.*)$/;
const PAGE_MARKER = /^\s*(?:[-*+]\s+)?pp?\.\s*(\d{1,4})(?:-\d{1,4})?\s*(?:—|–|-|:)\s*(.*)$/i;

function toSeconds(token: string): number {
  const parts = token.split(':').map((p) => Number.parseInt(p, 10));
  let seconds = 0;
  for (const p of parts) seconds = seconds * 60 + (p || 0);
  return seconds;
}

/** `1:23:45` / `23:45` / bare number of minutes → seconds. */
function parseDuration(value: Scalar | Scalar[] | undefined): number {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  if (typeof value === 'number') return Math.round(value * 60);
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value) * 60);
  if (/^(?:\d{1,3}:)?\d{1,4}:[0-5]\d$/.test(value)) return toSeconds(value);
  return 0;
}

/** Strip Obsidian-specific syntax so the emitted notes stay portable. */
function cleanLine(line: string): string {
  return line
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/==([^=]+)==/g, '$1')
    .trimEnd();
}

function parseBlocks(body: string): { blocks: LearnBlock[]; lastSeconds: number; lastPage: number } {
  const blocks: LearnBlock[] = [];
  let lastSeconds = 0;
  let lastPage = 0;

  const lines = body.split('\n').map(cleanLine);
  let current: LearnBlock | null = null;

  const push = (block: LearnBlock) => {
    if (block.kind === 'marker') lastSeconds = Math.max(lastSeconds, block.seconds);
    if (block.kind === 'page') lastPage = Math.max(lastPage, block.page);
    if (block.lines.some((l) => l.trim() !== '')) blocks.push(block);
  };

  for (const line of lines) {
    if (line.trim() === '') {
      if (current) push(current);
      current = null;
      continue;
    }

    const time = TIME_MARKER.exec(line);
    if (time?.[1] && time[2] !== undefined && time[2] !== '') {
      if (current) push(current);
      current = { kind: 'marker', seconds: toSeconds(time[1]), lines: [time[2]] };
      continue;
    }

    const page = PAGE_MARKER.exec(line);
    if (page?.[1] && page[2] !== undefined && page[2] !== '') {
      if (current) push(current);
      current = { kind: 'page', page: Number.parseInt(page[1], 10), lines: [page[2]] };
      continue;
    }

    if (current) {
      current.lines.push(line.trim());
    } else {
      current = { kind: 'note', lines: [line.trim()] };
    }
  }
  if (current) push(current);

  return { blocks, lastSeconds, lastPage };
}

/* ----------------------------------------------------------------- entry  */

function slugify(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function str(data: Frontmatter, key: string): string {
  const v = data[key];
  return typeof v === 'string' ? v : v === undefined ? '' : String(v);
}

function listOf(data: Frontmatter, key: string): string[] {
  const v = data[key];
  if (Array.isArray(v)) return v.map(String).filter((s) => s !== '');
  if (typeof v === 'string' && v !== '') return [v];
  return [];
}

function dateOnly(value: Scalar | Scalar[] | undefined): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, 10);
}

function compileEntry(file: string, id: string, library: Map<string, LibraryItem>): LearnEntry | null {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);

  if (data.draft === true || data.public === false) return null;

  const title = str(data, 'title') || id.replace(/-/g, ' ');
  const kindRaw = str(data, 'type').toLowerCase();
  const statusRaw = str(data, 'status').toLowerCase();

  // A `library:` id ties the note to a file on the shelf. Everything the
  // library already knows — page count, the publisher's PDF, where the file
  // lives — is inherited, so a book note needs no bookkeeping beyond the id.
  const libraryId = str(data, 'library');
  const item = libraryId ? library.get(libraryId) : undefined;

  const { blocks, lastSeconds, lastPage } = parseBlocks(body);
  const durationSeconds = parseDuration(data.duration);
  const pages = typeof data.pages === 'number' ? data.pages : (item?.pages ?? 0);
  const explicit = typeof data.progress === 'number' ? data.progress : NaN;
  const status: EntryStatus = STATUSES.has(statusRaw) ? (statusRaw as EntryStatus) : 'queued';

  let progress: number;
  if (!Number.isNaN(explicit)) {
    progress = Math.max(0, Math.min(100, Math.round(explicit)));
  } else if (status === 'done') {
    progress = 100;
  } else if (durationSeconds > 0 && lastSeconds > 0) {
    progress = Math.min(99, Math.round((lastSeconds / durationSeconds) * 100));
  } else if (pages > 0 && lastPage > 0) {
    progress = Math.min(99, Math.round((lastPage / pages) * 100));
  } else {
    progress = 0;
  }

  const markerCount = blocks.filter((b) => b.kind !== 'note').length;

  const firstText =
    blocks.find((b) => b.kind === 'note')?.lines.find((l) => l.trim() !== '') ??
    blocks[0]?.lines.find((l) => l.trim() !== '') ??
    '';
  const blurb = firstText.length > 160 ? firstText.slice(0, 157).trimEnd() + '…' : firstText;

  const stat = fs.statSync(file);

  return {
    id,
    title,
    kind: (KINDS.has(kindRaw) ? kindRaw : 'article') as EntryKind,
    status,
    source: str(data, 'source') || item?.link || '',
    // Only a direct PDF can honour `#page=N`. An explicit `sourcePdf:` wins;
    // otherwise a linked library item supplies one, but only its `pdf` — its
    // `link` is usually a landing page, where the fragment would do nothing.
    sourcePdf: str(data, 'sourcePdf') || item?.pdf || '',
    library: item?.id ?? '',
    libraryPath: item?.path ?? '',
    progress,
    tags: listOf(data, 'tags'),
    started: dateOnly(data.started),
    finished: dateOnly(data.finished),
    updated: dateOnly(str(data, 'updated')) || stat.mtime.toISOString().slice(0, 10),
    markerCount,
    noteCount: blocks.length,
    blurb,
    durationSeconds,
    blocks,
  };
}

function toManifestRow(entry: LearnEntry): ManifestEntry {
  const { durationSeconds: _d, blocks: _b, ...row } = entry;
  return row;
}

/* ----------------------------------------------------------------- ingest */

const STATUS_ORDER: Record<EntryStatus, number> = {
  active: 0,
  queued: 1,
  done: 2,
  shelved: 3,
};

function writeIfChanged(file: string, content: string): boolean {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  fs.writeFileSync(file, content);
  return true;
}

/**
 * The library manifest, compiled just before this script by
 * scripts/ingest-library.ts. Absent on a machine without the library — notes
 * then simply carry whatever their own frontmatter states.
 */
function loadLibrary(): Map<string, LibraryItem> {
  const file = path.join(OUT_DIR, 'library.json');
  const items = new Map<string, LibraryItem>();
  if (!fs.existsSync(file)) return items;

  try {
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as LibraryManifest;
    for (const item of manifest.items ?? []) items.set(item.id, item);
  } catch (err) {
    console.warn(`[learnlog] unreadable library.json: ${err instanceof Error ? err.message : err}`);
  }

  return items;
}

/** Previous `generatedAt` when the entry rows are unchanged, else now. */
function stableTimestamp(rows: ManifestEntry[]): string {
  try {
    const file = path.join(OUT_DIR, 'index.json');
    const prev = JSON.parse(fs.readFileSync(file, 'utf8')) as LearnManifest;
    if (JSON.stringify(prev.entries) === JSON.stringify(rows) && prev.generatedAt) {
      return prev.generatedAt;
    }
  } catch {
    // No previous manifest, or an unreadable one: this run is the new truth.
  }
  return new Date().toISOString();
}

function ingest(): void {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`[learnlog] no vault at ${SOURCE_DIR} — leaving public/learnlog as-is`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SOURCE_DIR, { recursive: true })
    .filter((f) => typeof f === 'string' && /\.md$/i.test(f))
    .map((f) => path.join(SOURCE_DIR, f as string))
    .filter((f) => fs.statSync(f).isFile());

  const library = loadLibrary();
  const seen = new Set<string>();
  const entries: LearnEntry[] = [];

  for (const file of files) {
    // Leading-underscore files (_template.md etc.) are scaffolding, not notes.
    if (path.basename(file).startsWith('_')) continue;
    const id = slugify(path.basename(file));
    seen.add(id);

    try {
      const entry = compileEntry(file, id, library);
      if (entry) entries.push(entry);
    } catch (err) {
      console.warn(`[learnlog] skipping ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  entries.sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return b.updated.localeCompare(a.updated);
  });

  let changed = 0;
  const emitted = new Set<string>();

  for (const entry of entries) {
    const file = path.join(OUT_DIR, `${entry.id}.json`);
    emitted.add(`${entry.id}.json`);
    if (writeIfChanged(file, JSON.stringify(entry, null, 2) + '\n')) changed++;
  }

  // Remove orphans from deleted/renamed notes.
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.json') && !RESERVED.has(f) && !emitted.has(f)) {
      fs.unlinkSync(path.join(OUT_DIR, f));
      changed++;
    }
  }

  const rows = entries.map(toManifestRow);
  const manifest: LearnManifest = {
    // Same reasoning as the library: a timestamp that moves on every run
    // makes the manifest look changed when no note did.
    generatedAt: stableTimestamp(rows),
    entries: rows,
  };
  const manifestChanged = writeIfChanged(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );

  console.log(
    `[learnlog] ${entries.length} entries — ${changed} file${changed === 1 ? '' : 's'} rewritten` +
      (manifestChanged ? ' + manifest' : '') +
      ` → public/learnlog`,
  );
}

function watch(): void {
  ingest();
  console.log(`[learnlog] watching ${SOURCE_DIR}`);
  let timer: ReturnType<typeof setTimeout> | undefined;
  fs.watch(SOURCE_DIR, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(ingest, 250);
  });
}

/* ------------------------------------------------------------------ main  */

if (process.argv.includes('--watch')) {
  watch();
} else {
  ingest();
}
