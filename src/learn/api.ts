/**
 * Lazy data access for the compiled learn log in public/learnlog/.
 * The manifest is fetched once per page load; per-entry bodies are fetched
 * only when a row is expanded. Rejections are cached so a missing file
 * doesn't trigger request loops.
 */
import type { LearnEntry, LearnManifest, LibraryManifest } from './types';

const cache = new Map<string, Promise<unknown>>();

function fetchJson<T>(name: string): Promise<T> {
  const cached = cache.get(name);
  if (cached) return cached as Promise<T>;

  const pending = fetch(`${import.meta.env.BASE_URL}learnlog/${name}`).then((res) => {
    if (!res.ok) throw new Error(`learnlog: ${name} → HTTP ${res.status}`);
    return res.json() as Promise<T>;
  });
  cache.set(name, pending);
  return pending;
}

export function fetchManifest(): Promise<LearnManifest> {
  return fetchJson<LearnManifest>('index.json');
}

export function fetchEntry(id: string): Promise<LearnEntry> {
  return fetchJson<LearnEntry>(`${id}.json`);
}

export function fetchLibrary(): Promise<LibraryManifest> {
  return fetchJson<LibraryManifest>('library.json');
}
