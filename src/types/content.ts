import type { BlogFrontmatter } from './blog';

export type BlogPostMeta = BlogFrontmatter & {
  slug: string;
  readingTimeMinutes: number;
};

export type GeneratedBlogIndex = {
  generatedAt: string;
  tags: string[];
  posts: BlogPostMeta[];
};
