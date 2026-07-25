export type ChangelogEntry = {
  date: string;
  title: string;
  note: string;
};

export const changelog: ChangelogEntry[] = [
  {
    date: "2026-03-01",
    title: "Portfolio architecture refresh",
    note: "Refactored the site toward reusable routes, richer storytelling, and content publishing workflow.",
  },
  {
    date: "2026-02-20",
    title: "Case study depth",
    note: "Expanded project documentation with challenge, architecture, tradeoff, and outcome framing.",
  },
  {
    date: "2026-02-05",
    title: "Observability writing habit",
    note: "Started documenting production reliability lessons in short-form blog notes.",
  },
];
