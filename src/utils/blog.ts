import blogIndex from '../generated/blog-index.json';
import { parseFrontmatter } from './frontmatter';
import { estimateReadingTime, markdownToHtml } from './markdown';
import type { BlogPostMeta, GeneratedBlogIndex } from '../types/content';

const typedBlogIndex = blogIndex as GeneratedBlogIndex;

const postFiles = import.meta.glob('/content/blog/*.mdx', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export function getBlogIndex(): GeneratedBlogIndex {
  return typedBlogIndex;
}

export function getVisiblePosts(): BlogPostMeta[] {
  const includeDrafts = import.meta.env.DEV;
  return typedBlogIndex.posts.filter((post) => (includeDrafts ? true : !post.draft));
}

export function getLatestPosts(limit = 3): BlogPostMeta[] {
  return getVisiblePosts().slice(0, limit);
}

export async function loadPostBySlug(slug: string): Promise<{
  post: BlogPostMeta;
  html: string;
  content: string;
} | null> {
  const post = typedBlogIndex.posts.find((candidate) => candidate.slug === slug);
  if (!post) return null;

  const loader = postFiles[`/content/blog/${slug}.mdx`];
  if (!loader) return null;

  const raw = await loader();
  const { body } = parseFrontmatter(raw);
  const html = markdownToHtml(body);

  return {
    post: {
      ...post,
      readingTimeMinutes: post.readingTimeMinutes || estimateReadingTime(body),
    },
    html,
    content: body,
  };
}
