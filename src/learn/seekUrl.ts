/**
 * Turns a note marker (video timestamp or book page) into a URL that seeks
 * the source: YouTube-style `?t=`, or media/PDF fragments for everything else.
 */
export type SeekTarget = { seconds?: number; page?: number };

/**
 * Where a page marker should point, in preference order:
 *
 *   1. the local file, when the dev server is serving the library — your own
 *      copy, opened at the page, which is the only thing that works for the
 *      books that aren't published free;
 *   2. the publisher's PDF, which honours `#page=N`;
 *   3. the landing page, without a fragment — `#page=` on an HTML page is
 *      not a broken link, but it is a lie, so it is left off.
 */
export interface PageSources {
  sourcePdf?: string;
  source?: string;
  libraryPath?: string;
}

/** True when the dev server is exposing the local library at /library/. */
export const LOCAL_LIBRARY: boolean = __LEARNLOG_LOCAL__;

export function libraryHref(libraryPath: string, page?: number): string {
  const url = `${import.meta.env.BASE_URL}library/${libraryPath.split('/').map(encodeURIComponent).join('/')}`;
  return typeof page === 'number' ? `${url}#page=${page}` : url;
}

/** Resolves a page marker to the best available target — '' when there is none. */
export function pageHref(sources: PageSources, page: number): string {
  if (LOCAL_LIBRARY && sources.libraryPath) return libraryHref(sources.libraryPath, page);
  if (sources.sourcePdf) return buildSeekUrl(sources.sourcePdf, { page });
  return sources.source ? buildSeekUrl(sources.source, {}) : '';
}

export function buildSeekUrl(source: string, target: SeekTarget): string {
  if (!/^https?:\/\//i.test(source)) return '#';

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return source;
  }

  if (typeof target.seconds === 'number') {
    const seconds = Math.max(0, Math.floor(target.seconds));

    // YouTube: watch links and share links both take a `t` query param.
    if (
      (/(^|\.)youtube\.com$/i.test(url.hostname) && url.pathname === '/watch') ||
      /(^|\.)youtu\.be$/i.test(url.hostname)
    ) {
      url.searchParams.set('t', `${seconds}s`);
      return url.toString();
    }

    // Everyone else: HTML5 media fragment. Harmless on plain pages, works on
    // direct video links and players that honour the fragment.
    url.hash = `t=${seconds}s`;
    return url.toString();
  }

  if (typeof target.page === 'number') {
    url.hash = `page=${target.page}`;
    return url.toString();
  }

  return url.toString();
}

/** 873 → "14:33"; 4021 → "1:07:01". */
export function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 15734150 → "15.0 MB". */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 2 ** 30).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 2 ** 20).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
