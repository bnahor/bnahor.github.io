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
  /** URL of the video/page/PDF the notes are anchored to. */
  source: string;
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
