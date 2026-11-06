/**
 * Blog posts are plain markdown in content/blog/, one file per post, named
 * YYYY-MM-DD-slug.md with a small frontmatter block:
 *
 *   ---
 *   title: "…"
 *   date: "2026-02-28"
 *   summary: "…"
 *   tags: ["SRE", "Systems"]
 *   draft: false
 *   ---
 *
 * Vite inlines them at build time, so there is no generate step. Drafts show
 * under `vite dev` and are dropped from production builds.
 */

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
  body: string;
};

const files = import.meta.glob('/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function unquote(value: string) {
  const v = value.trim();
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

function parse(path: string, raw: string): Post | null {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r\n/g, '\n'));
  if (!match) {
    console.warn(`blog: ${path} has no frontmatter, skipped`);
    return null;
  }

  const meta: Record<string, string> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv?.[1]) meta[kv[1]] = kv[2] ?? '';
  }

  const body = (match[2] ?? '').trim();
  const tags = (meta.tags ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean);
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    slug: path.split('/').pop()!.replace(/\.md$/, ''),
    title: unquote(meta.title ?? 'Untitled'),
    date: unquote(meta.date ?? ''),
    summary: unquote(meta.summary ?? ''),
    tags,
    draft: unquote(meta.draft ?? 'false') === 'true',
    readingMinutes: Math.max(1, Math.round(words / 220)),
    body,
  };
}

export const posts: Post[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .filter((post): post is Post => post !== null && (import.meta.env.DEV || !post.draft))
  .sort((a, b) => b.date.localeCompare(a.date));

export const postTags: string[] = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) =>
  a.localeCompare(b),
);

export function formatPostDate(iso: string, month: 'short' | 'long' = 'short') {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'UTC',
  });
}
