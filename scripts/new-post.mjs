import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');

function getArg(name) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  const title = getArg('title');
  if (!title) {
    console.error('Usage: bun run new:post -- --title "Your post title"');
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const slug = `${date}-${slugify(title)}`;
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  await fs.mkdir(BLOG_DIR, { recursive: true });

  try {
    await fs.access(filePath);
    console.error(`Post already exists: ${filePath}`);
    process.exit(1);
  } catch {
    // expected when file does not exist
  }

  const template = `---
title: "${title.replaceAll('"', '\\"')}"
date: "${date}"
summary: "Add a one-sentence summary."
tags: ["Engineering"]
draft: true
---

Write your post here.
`;

  await fs.writeFile(filePath, template, 'utf8');
  console.log(`Created ${path.relative(ROOT, filePath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
