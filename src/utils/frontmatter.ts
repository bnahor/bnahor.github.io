import type { BlogFrontmatter } from '../types/blog';

type ParseResult = {
  frontmatter: Partial<BlogFrontmatter>;
  body: string;
};

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineArray(value: string): string[] {
  const inner = value.slice(1, -1).trim();
  if (!inner) return [];

  return inner
    .split(',')
    .map((item) => stripQuotes(item).trim())
    .filter(Boolean);
}

export function parseFrontmatter(raw: string): ParseResult {
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  if (lines[0]?.trim() !== '---') {
    return { frontmatter: {}, body: normalized.trim() };
  }

  const frontmatter: Partial<BlogFrontmatter> = {};
  let cursor = 1;

  while (cursor < lines.length) {
    const line = lines[cursor];
    if (line?.trim() === '---') {
      cursor += 1;
      break;
    }

    if (!line || !line.trim()) {
      cursor += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      cursor += 1;
      continue;
    }

    const key = match[1];
    const rawValue = match[2] ?? '';
    if (!key) {
      cursor += 1;
      continue;
    }

    if (!rawValue) {
      const list: string[] = [];
      cursor += 1;
      while (cursor < lines.length) {
        const nextLine = lines[cursor]?.trim();
        if (!nextLine?.startsWith('- ')) break;
        list.push(stripQuotes(nextLine.slice(2).trim()));
        cursor += 1;
      }

      if (key === 'tags') {
        frontmatter.tags = list;
      }
      continue;
    }

    const value = rawValue.trim();
    if (key === 'draft') {
      frontmatter.draft = value === 'true';
    } else if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
      frontmatter.tags = parseInlineArray(value);
    } else if (key === 'title') {
      frontmatter.title = stripQuotes(value);
    } else if (key === 'date') {
      frontmatter.date = stripQuotes(value);
    } else if (key === 'summary') {
      frontmatter.summary = stripQuotes(value);
    } else if (key === 'cover') {
      frontmatter.cover = stripQuotes(value);
    }

    cursor += 1;
  }

  return {
    frontmatter,
    body: lines.slice(cursor).join('\n').trim(),
  };
}
