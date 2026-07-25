import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const BLOG_INDEX_OUTPUT = path.join(ROOT, 'src', 'generated', 'blog-index.json');
const RSS_OUTPUT = path.join(ROOT, 'public', 'rss.xml');
const SITE_URL = 'https://rb9823.github.io/website/';

const REQUIRED_FIELDS = ['title', 'date', 'summary', 'tags', 'draft'];

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineArray(value) {
  const inner = value.slice(1, -1).trim();
  if (!inner) return [];
  return inner
    .split(',')
    .map((item) => stripQuotes(item).trim())
    .filter(Boolean);
}

function parseFrontmatter(raw, fileName) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') {
    throw new Error(`${fileName}: missing opening frontmatter delimiter`);
  }

  let cursor = 1;
  const frontmatter = {};

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
      throw new Error(`${fileName}: invalid frontmatter line \"${line}\"`);
    }

    const [, key, rawValue] = match;

    if (!rawValue) {
      const list = [];
      cursor += 1;
      while (cursor < lines.length) {
        const itemLine = lines[cursor]?.trim();
        if (!itemLine?.startsWith('- ')) break;
        list.push(stripQuotes(itemLine.slice(2).trim()));
        cursor += 1;
      }
      frontmatter[key] = list;
      continue;
    }

    const value = rawValue.trim();
    if (value === 'true' || value === 'false') {
      frontmatter[key] = value === 'true';
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = parseInlineArray(value);
    } else {
      frontmatter[key] = stripQuotes(value);
    }

    cursor += 1;
  }

  if (lines[cursor - 1]?.trim() !== '---') {
    throw new Error(`${fileName}: missing closing frontmatter delimiter`);
  }

  const body = lines.slice(cursor).join('\n').trim();
  return { frontmatter, body };
}

function validateFrontmatter(frontmatter, fileName) {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in frontmatter)) {
      throw new Error(`${fileName}: missing required frontmatter field \"${field}\"`);
    }
  }

  if (typeof frontmatter.title !== 'string' || !frontmatter.title.trim()) {
    throw new Error(`${fileName}: \"title\" must be a non-empty string`);
  }

  if (Number.isNaN(Date.parse(frontmatter.date))) {
    throw new Error(`${fileName}: \"date\" must be an ISO-compatible date string`);
  }

  if (typeof frontmatter.summary !== 'string' || !frontmatter.summary.trim()) {
    throw new Error(`${fileName}: \"summary\" must be a non-empty string`);
  }

  if (!Array.isArray(frontmatter.tags) || frontmatter.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
    throw new Error(`${fileName}: \"tags\" must be a non-empty string array`);
  }

  if (typeof frontmatter.draft !== 'boolean') {
    throw new Error(`${fileName}: \"draft\" must be boolean`);
  }

  if ('cover' in frontmatter && typeof frontmatter.cover !== 'string') {
    throw new Error(`${fileName}: \"cover\" must be a string when provided`);
  }
}

function countWords(body) {
  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]+\]\([^\)]+\)/g, ' ')
    .replace(/[#>*_~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return 0;
  return plainText.split(' ').filter(Boolean).length;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function createRss(posts) {
  const items = posts
    .map((post) => {
      const postUrl = `${SITE_URL}blog/${post.slug}`;
      return [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(postUrl)}</link>`,
        `<guid>${escapeXml(postUrl)}</guid>`,
        `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `<description>${escapeXml(post.summary)}</description>`,
        '</item>',
      ].join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    '<title>Rohan Bahl — Blog</title>',
    `<link>${SITE_URL}blog</link>`,
    '<description>Engineering notes on backend, platform reliability, and shipping systems.</description>',
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}

async function main() {
  await fs.mkdir(path.dirname(BLOG_INDEX_OUTPUT), { recursive: true });
  await fs.mkdir(path.dirname(RSS_OUTPUT), { recursive: true });

  const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });
  const mdxFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
    .map((entry) => entry.name)
    .sort();

  const posts = [];

  for (const fileName of mdxFiles) {
    const slug = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(BLOG_DIR, fileName);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(raw, fileName);
    validateFrontmatter(frontmatter, fileName);

    const words = countWords(body);
    const readingTimeMinutes = Math.max(1, Math.round(words / 220));

    posts.push({
      slug,
      title: frontmatter.title.trim(),
      date: new Date(frontmatter.date).toISOString().slice(0, 10),
      summary: frontmatter.summary.trim(),
      tags: frontmatter.tags.map((tag) => tag.trim()),
      draft: frontmatter.draft,
      cover: frontmatter.cover ? frontmatter.cover.trim() : undefined,
      readingTimeMinutes,
    });
  }

  posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  const includeDrafts =
    process.env.BLOG_INCLUDE_DRAFTS === 'true' || process.env.NODE_ENV !== 'production';
  const visiblePosts = includeDrafts ? posts : posts.filter((post) => !post.draft);

  const tags = Array.from(new Set(visiblePosts.flatMap((post) => post.tags))).sort((a, b) =>
    a.localeCompare(b),
  );

  const blogIndex = {
    generatedAt: new Date().toISOString(),
    tags,
    posts: visiblePosts,
  };

  await fs.writeFile(BLOG_INDEX_OUTPUT, `${JSON.stringify(blogIndex, null, 2)}\n`, 'utf8');
  await fs.writeFile(RSS_OUTPUT, createRss(visiblePosts.filter((post) => !post.draft)), 'utf8');

  console.log(`Generated ${visiblePosts.length} blog posts in src/generated/blog-index.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
