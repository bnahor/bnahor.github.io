/**
 * Types shared by the ingest script (scripts/ingest-learnlog.ts) and the site.
 *
 * The vault is the source of truth: markdown + frontmatter under
 * ~/Documents/Obsidian Vault/Learning Log/. The ingest script compiles those
 * files into public/learnlog/*.json, which is everything the site ever sees.
 */

export type EntryKind = 'lecture' | 'book' | 'paper' | 'course' | 'video' | 'article';

export type EntryStatus = 'queued' | 'active' | 'done' | 'shelved';

/** One row of the manifest — enough to render lists without fetching bodies. */
export interface ManifestEntry {
  id: string;
  title: string;
  kind: EntryKind;
  status: EntryStatus;
  /** URL of the video/page the notes are anchored to — the "Source" link. */
  source: string;
  /**
   * Direct URL of the PDF, when `source` is a landing page. Page markers link
   * here (`…#page=42`), because `#page=` only means anything to a PDF viewer.
   * Falls back to `source` when empty.
   */
  sourcePdf: string;
  /** id of the library item this note covers, when the file is held locally. */
  library: string;
  /** Library-relative path of that file — only resolvable in local mode. */
  libraryPath: string;
  /** 0–100. Explicit frontmatter value, or derived from the last marker. */
  progress: number;
  tags: string[];
  /** ISO dates (yyyy-mm-dd). */
  started: string;
  finished: string;
  /** Date of the last edit to the note file. */
  updated: string;
  /** Timestamp / page markers — the deep-linkable note lines. */
  markerCount: number;
  /** Total note blocks including markers. */
  noteCount: number;
  blurb: string;
}

export interface LearnManifest {
  generatedAt: string;
  entries: ManifestEntry[];
}

/**
 * Body blocks. A marker line (e.g. `00:14:32 — note` or `p. 42 — note`)
 * opens a block; following plain lines are attached to it until a blank line
 * or the next marker.
 */
export type LearnBlock =
  | { kind: 'marker'; seconds: number; lines: string[] }
  | { kind: 'page'; page: number; lines: string[] }
  | { kind: 'note'; lines: string[] };

/** Full entry — the per-id JSON files fetched lazily when a row is expanded. */
export interface LearnEntry extends ManifestEntry {
  durationSeconds: number;
  blocks: LearnBlock[];
}

/* ------------------------------------------------------------- library -- */

/**
 * One file in the local resources library. Compiled by
 * scripts/ingest-library.ts from the directory tree — metadata only. The
 * files themselves are never copied into the repo or the deploy: most of the
 * library is commercially published material, and the site is public.
 */
export interface LibraryItem {
  id: string;
  title: string;
  /** Top-level shelf: coursework, prep, reference-library, projects… */
  area: string;
  /** Directory path under the area, e.g. "algorithms / textbooks". */
  subject: string;
  kind: EntryKind;
  /** Path relative to the library root — resolved to /library/<path> in local
   *  mode, and otherwise never used. Never an absolute path: the compiled
   *  JSON is public. */
  path: string;
  bytes: number;
  /** 0 when unknown (non-PDF, or not indexed). */
  pages: number;
  /** Where to get it legitimately, when such a URL exists. */
  link: string;
  /** `free` — the full text is published at `link`. `home` — publisher or
   *  author page, i.e. where you would buy it. */
  linkKind: '' | 'free' | 'home';
  /**
   * Direct URL of the published PDF, when the publisher offers one. Distinct
   * from `link`, which is usually a landing page: only a real PDF can honour
   * the `#page=N` fragment a page marker depends on.
   */
  pdf: string;
  /** id of the shelf note covering this item, when one exists. */
  noteId: string;
}

export interface LibraryManifest {
  generatedAt: string;
  /** Directory count and total bytes, for the header. */
  totalBytes: number;
  items: LibraryItem[];
}
