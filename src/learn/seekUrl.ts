/**
 * Turns a note marker (video timestamp or book page) into a URL that seeks
 * the source: YouTube-style `?t=`, or media/PDF fragments for everything else.
 */
export type SeekTarget = { seconds?: number; page?: number };

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
    // Meaningful for direct PDF links (#page=N is a viewer convention);
    // harmless everywhere else.
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
