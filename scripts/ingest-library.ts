/**
 * Compiles the local resources library into public/learnlog/library.json.
 *
 *   bun scripts/ingest-library.ts            one-shot (diff-based)
 *
 * METADATA ONLY. The library is ~2.5 GB of mostly commercially published
 * books; this repo is a public GitHub Pages site. Nothing here ever copies a
 * file into public/ or emits an absolute path — the site publishes the
 * catalogue and, where one legitimately exists, a link to the real thing.
 * The bytes stay on the machine and are reachable only in local mode
 * (see the library-local plugin in vite.config.ts).
 *
 * Override the library location with LEARNLOG_LIBRARY=/path/to/resources.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { EntryKind, LibraryItem, LibraryManifest } from '../src/learn/types';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEFAULT_LIBRARY = path.join(process.env.HOME ?? '', 'Desktop', 'resources');
const LIBRARY = expandTilde(process.env.LEARNLOG_LIBRARY ?? DEFAULT_LIBRARY);
const DEFAULT_VAULT = path.join(process.env.HOME ?? '', 'Documents', 'Obsidian Vault');
const VAULT = expandTilde(process.env.LEARNLOG_VAULT ?? DEFAULT_VAULT);
const OUT_FILE = path.join(ROOT, 'public', 'learnlog', 'library.json');

/** Documents and media only — scripts, archives and sidecars aren't shelf items. */
const KIND_BY_EXT: Record<string, EntryKind> = {
  '.pdf': 'book',
  '.mp4': 'video',
  '.mov': 'video',
  '.m4v': 'video',
  '.md': 'article',
  '.rtf': 'article',
  '.epub': 'book',
};

const SKIP_DIRS = new Set(['node_modules', '.git', '.obsidian', '.trash']);

function expandTilde(p: string): string {
  return p.startsWith('~') ? path.join(process.env.HOME ?? '', p.slice(1)) : p;
}

/* ------------------------------------------------------------- links ---- */

/**
 * Where a given item can legitimately be got. `free` means the full text is
 * published at that URL by the author or publisher; `home` is the book's own
 * page — i.e. where you would buy it. Matched on a path substring, so one
 * entry covers the same book filed in two places.
 *
 * Anything not listed gets no link at all. That is the correct default: an
 * unlinked row says "this is on my shelf", which is a fact about me, not a
 * distribution of someone's book.
 */
const LINKS: ReadonlyArray<{ match: string; url: string; kind: 'free' | 'home'; pdf?: string }> = [
  { match: 'ostep.pdf', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', kind: 'free' },
  { match: 'Operating Systems - Three Easy Pieces', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', kind: 'free' },
  { match: 'modern_robotics.pdf', url: 'https://hades.mech.northwestern.edu/index.php/Modern_Robotics', kind: 'free', pdf: 'https://hades.mech.northwestern.edu/images/7/7f/MR.pdf' },
  { match: 'deep_learning_book.pdf', url: 'https://www.deeplearningbook.org/', kind: 'free' },
  { match: 'esl.pdf', url: 'https://hastie.su.domains/ElemStatLearn/', kind: 'free', pdf: 'https://hastie.su.domains/ElemStatLearn/printings/ESLII_print12_toc.pdf' },
  { match: 'isl.pdf', url: 'https://www.statlearning.com/', kind: 'free', pdf: 'https://www.statlearning.com/s/ISLRSeventhPrinting.pdf' },
  { match: 'cs229_notes.pdf', url: 'https://cs229.stanford.edu/', kind: 'free' },
  { match: 'BartoSutton.pdf', url: 'http://incompleteideas.net/book/the-book.html', kind: 'free', pdf: 'http://incompleteideas.net/book/RLbook2020.pdf' },
  { match: 'reinforcement-learning-an-introduction', url: 'http://incompleteideas.net/book/the-book.html', kind: 'free', pdf: 'http://incompleteideas.net/book/RLbook2020.pdf' },
  { match: 'cp_handbook.pdf', url: 'https://cses.fi/book/book.pdf', kind: 'free', pdf: 'https://cses.fi/book/book.pdf' },
  { match: 'competitive_programming', url: 'https://cpbook.net/', kind: 'home' },
  { match: 'Maths for Computer Science', url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/', kind: 'free' },
  { match: 'bitter_lesson.pdf', url: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html', kind: 'free' },
  { match: 'probabilistic-robotics.pdf', url: 'https://mitpress.mit.edu/9780262201629/probabilistic-robotics/', kind: 'home' },
  { match: 'refactoring_ui.pdf', url: 'https://www.refactoringui.com/', kind: 'home' },
  { match: 'ddia.pdf', url: 'https://dataintensive.net/', kind: 'home' },
  { match: 'Designing Data-Intensive Applications', url: 'https://dataintensive.net/', kind: 'home' },
  { match: 'CLRS.pdf', url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/', kind: 'home' },
  { match: 'Algorithm Design Manual', url: 'https://www.algorist.com/', kind: 'home' },
  { match: 'Cracking the Coding Interview', url: 'https://www.crackingthecodinginterview.com/', kind: 'home' },
  { match: 'System Design Interview', url: 'https://bytebytego.com/', kind: 'home' },
  { match: 'Clean Code', url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238/', kind: 'home' },
  { match: 'The Mythical Man-Month', url: 'https://www.oreilly.com/library/view/mythical-man-month-the/0201835959/', kind: 'home' },
  { match: 'The Linux Programming Interface', url: 'https://man7.org/tlpi/', kind: 'home' },
  { match: 'Computer Networking - A Top-Down Approach', url: 'https://gaia.cs.umass.edu/kurose_ross/', kind: 'home' },
  { match: 'Options, Futures', url: 'https://www.pearson.com/en-us/subject-catalog/p/options-futures-and-other-derivatives/P200000005938', kind: 'home' },
  { match: 'Speech and Language Processing', url: 'https://web.stanford.edu/~jurafsky/slp3/', kind: 'free', pdf: 'https://web.stanford.edu/~jurafsky/slp3/ed3book.pdf' },
  { match: 'Artificial Intelligence - A Modern Approach', url: 'https://aima.cs.berkeley.edu/', kind: 'home' },
  { match: 'dragon_book.pdf', url: 'https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472', kind: 'home' },
  { match: 'DuckDB Internals', url: 'https://duckdb.org/', kind: 'free' },
  { match: 'spark_guide.pdf', url: 'https://spark.apache.org/docs/latest/', kind: 'free' },
  { match: 'hadoop_guide.pdf', url: 'https://hadoop.apache.org/docs/stable/', kind: 'free' },
  { match: 'Practitioners Guide to MLOps', url: 'https://cloud.google.com/resources/mlops-whitepaper', kind: 'free' },
];

function resolveLink(relPath: string): { link: string; linkKind: '' | 'free' | 'home'; pdf: string } {
  for (const entry of LINKS) {
    if (relPath.includes(entry.match)) {
      return { link: entry.url, linkKind: entry.kind, pdf: entry.pdf ?? '' };
    }
  }
  return { link: '', linkKind: '', pdf: '' };
}

/** `#page=N` only means anything to something a PDF viewer will open. */
function isPdfUrl(url: string): boolean {
  return /\.pdf($|[?#])/i.test(url) || /^https?:\/\/arxiv\.org\/pdf\//i.test(url);
}

/**
 * Hosts that publish the work themselves. A URL is only ever labelled "free"
 * if it is one of these: a downloaded-from URL is where *I* got the file, and
 * a course server hosting a scanned MIT Press book is a mirror, not a
 * publication. Mirrors get no link at all.
 */
const OFFICIAL_HOSTS = [
  'arxiv.org',
  'openreview.net',
  'proceedings.neurips.cc',
  'papers.nips.cc',
  'proceedings.mlr.press',
  'jmlr.org',
  'dl.acm.org',
];

function isOfficial(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return OFFICIAL_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/* -------------------------------------------------------- inventories --- */

interface InventoryRecord {
  title?: string;
  path?: string;
  source_url?: string;
  download_url?: string;
}

/**
 * Reading lists downloaded in bulk leave an inventory.json beside the files,
 * carrying the real titles and the canonical (usually arXiv) URLs. That is
 * far better metadata than anything derivable from a filename, so it wins.
 */
function loadInventories(root: string): Map<string, { title: string; url: string }> {
  const byPath = new Map<string, { title: string; url: string }>();

  for (const file of walk(root)) {
    if (path.basename(file) !== 'inventory.json') continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { records?: InventoryRecord[] };
      for (const record of parsed.records ?? []) {
        if (!record.path) continue;
        byPath.set(path.resolve(record.path), {
          title: record.title ?? '',
          // arXiv abs pages redirect fine, but the /pdf/ form is what
          // `#page=N` needs, so prefer the download URL when there is one.
          url: record.download_url ?? record.source_url ?? '',
        });
      }
    } catch {
      // A malformed sidecar shouldn't take the whole scan down.
    }
  }

  return byPath;
}

/* ------------------------------------------------------------- vault ---- */

/** id → note id, for library items a shelf note already covers. */
function loadNoteLinks(): Map<string, string> {
  const dir = path.join(VAULT, 'Learning Log');
  const links = new Map<string, string>();
  if (!fs.existsSync(dir)) return links;

  for (const file of walk(dir)) {
    if (!/\.md$/i.test(file) || path.basename(file).startsWith('_')) continue;
    const head = fs.readFileSync(file, 'utf8').slice(0, 2000);
    const match = /^library:\s*(.+)$/m.exec(head);
    const id = match?.[1]?.trim().replace(/^["']|["']$/g, '');
    if (id) links.set(id, slugify(path.basename(file).replace(/\.md$/i, '')));
  }

  return links;
}

/* ------------------------------------------------------------- pages ---- */

/**
 * Page counts, from the Spotlight index in batches (instant, already
 * computed) with pdfinfo as the fallback for anything unindexed. Counts are
 * carried over from the previous manifest when size and path are unchanged,
 * so a rescan of an untouched library costs nothing.
 */
function pageCounts(files: string[], cached: Map<string, number>): Map<string, number> {
  const pages = new Map<string, number>();
  const todo: string[] = [];

  for (const file of files) {
    const hit = cached.get(file);
    if (hit !== undefined) pages.set(file, hit);
    else todo.push(file);
  }

  for (let i = 0; i < todo.length; i += 80) {
    const batch = todo.slice(i, i + 80);
    const res = spawnSync('mdls', ['-raw', '-nullMarker', '?', '-name', 'kMDItemNumberOfPages', ...batch], {
      encoding: 'utf8',
    });
    if (res.status !== 0 || typeof res.stdout !== 'string') continue;

    const values = res.stdout.split('\0');
    batch.forEach((file, j) => {
      const n = Number.parseInt(values[j] ?? '', 10);
      if (Number.isFinite(n) && n > 0) pages.set(file, n);
    });
  }

  for (const file of todo) {
    if (pages.has(file)) continue;
    const res = spawnSync('pdfinfo', [file], { encoding: 'utf8' });
    const n = Number.parseInt(/^Pages:\s*(\d+)/m.exec(res.stdout ?? '')?.[1] ?? '', 10);
    if (Number.isFinite(n) && n > 0) pages.set(file, n);
  }

  return pages;
}

/* -------------------------------------------------------------- walk ---- */

function* walk(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/* ------------------------------------------------------------ titles ---- */

const ARXIV_FILENAME = /^(\d{4}\.\d{4,5})(v\d+)?\s*-\s*(.+)$/;

function titleFromFilename(stem: string): string {
  const arxiv = ARXIV_FILENAME.exec(stem);
  const core = arxiv?.[3] ?? stem;

  // Slug-cased names ("diffusion-policy-visuomotor-…") become sentences;
  // human-typed names ("Clean Code", "Algorithm Design Manual 3rd Ed") are
  // already titles and are left exactly as they are.
  const slugCased = /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(core);
  if (!slugCased) return core.replace(/_/g, ' ').trim();

  const words = core.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

function kindFor(relPath: string, ext: string): EntryKind {
  const base = KIND_BY_EXT[ext] ?? 'article';
  if (base !== 'book') return base;
  if (/reading-list|\/papers?\//i.test(relPath) || ARXIV_FILENAME.test(path.basename(relPath))) {
    return 'paper';
  }
  if (/\/lectures?(with\w+)?\//i.test(relPath)) return 'lecture';
  if (/tutorial|solution|homework|cheatsheet|revision|midterm|exam/i.test(relPath)) return 'course';
  return 'book';
}

/* ------------------------------------------------------------ ingest ---- */

function writeIfChanged(file: string, content: string): boolean {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return true;
}

/** Previous page counts, keyed by absolute path, valid while size matches. */
function cachedPages(): Map<string, number> {
  const cache = new Map<string, number>();
  if (!fs.existsSync(OUT_FILE)) return cache;

  try {
    const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) as LibraryManifest;
    for (const item of prev.items ?? []) {
      const abs = path.join(LIBRARY, item.path);
      if (item.pages > 0 && fs.existsSync(abs) && fs.statSync(abs).size === item.bytes) {
        cache.set(abs, item.pages);
      }
    }
  } catch {
    // Unreadable manifest just means a cold scan.
  }

  return cache;
}

/** Previous `generatedAt` when the catalogue itself is unchanged, else now. */
function stableTimestamp(items: LibraryItem[]): string {
  try {
    const prev = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) as LibraryManifest;
    if (JSON.stringify(prev.items) === JSON.stringify(items) && prev.generatedAt) {
      return prev.generatedAt;
    }
  } catch {
    // No previous manifest, or an unreadable one: this run is the new truth.
  }
  return new Date().toISOString();
}

function ingest(): void {
  if (!fs.existsSync(LIBRARY)) {
    console.log(`[library] no library at ${LIBRARY} — leaving library.json as-is`);
    return;
  }

  const inventories = loadInventories(LIBRARY);
  const noteLinks = loadNoteLinks();

  const files = [...walk(LIBRARY)].filter((f) => {
    if (!KIND_BY_EXT[path.extname(f).toLowerCase()]) return false;
    // READMEs describe the shelf, they aren't on it. Neither is anything
    // sitting loose at the root: an item's first path segment is its area.
    if (/^readme\.md$/i.test(path.basename(f))) return false;
    return path.relative(LIBRARY, f).includes(path.sep);
  });
  const pdfs = files.filter((f) => path.extname(f).toLowerCase() === '.pdf');
  const pages = pageCounts(pdfs, cachedPages());

  const used = new Set<string>();
  const items: LibraryItem[] = [];

  for (const file of files) {
    const rel = path.relative(LIBRARY, file);
    const segments = rel.split(path.sep);
    const ext = path.extname(file).toLowerCase();
    const stem = path.basename(file, path.extname(file));

    let id = slugify(rel.replace(/\.[^.]+$/, ''));
    // Two files can slugify identically (case or punctuation only); the id is
    // a URL-ish key, so it has to stay unique.
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    used.add(id);

    // Curated links win: they name the publisher's or author's own page. The
    // inventory URL is only a fallback, and only when it is the real
    // publication rather than wherever the file happened to come from.
    const inventory = inventories.get(path.resolve(file));
    const curated = resolveLink(rel);
    const fromInventory = inventory?.url && isOfficial(inventory.url) ? inventory.url : '';
    const link = curated.link || fromInventory;
    const linkKind: '' | 'free' | 'home' = curated.link ? curated.linkKind : fromInventory ? 'free' : '';
    const pdf = curated.pdf || (isPdfUrl(fromInventory) ? fromInventory : '');

    items.push({
      id,
      title: inventory?.title || titleFromFilename(stem),
      area: segments[0] ?? '',
      subject: segments.slice(1, -1).join(' / '),
      kind: kindFor(rel, ext),
      path: segments.join('/'),
      bytes: fs.statSync(file).size,
      pages: pages.get(file) ?? 0,
      link,
      linkKind,
      pdf,
      noteId: noteLinks.get(id) ?? '',
    });
  }

  items.sort(
    (a, b) =>
      a.area.localeCompare(b.area) ||
      a.subject.localeCompare(b.subject) ||
      a.title.localeCompare(b.title),
  );

  const manifest: LibraryManifest = {
    // Held at the previous value when nothing else moved: a timestamp that
    // ticks on every run would rewrite this 100 KB+ file on every commit and
    // bury real changes in noise.
    generatedAt: stableTimestamp(items),
    totalBytes: items.reduce((sum, i) => sum + i.bytes, 0),
    items,
  };

  const changed = writeIfChanged(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `[library] ${items.length} items across ${new Set(items.map((i) => i.area)).size} areas` +
      ` — ${changed ? 'library.json rewritten' : 'unchanged'}`,
  );
}

ingest();
