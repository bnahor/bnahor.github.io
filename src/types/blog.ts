export type BlogFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft: boolean;
  cover?: string;
};
