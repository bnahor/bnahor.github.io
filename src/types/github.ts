export type GitHubContributionLevel = 0 | 1 | 2 | 3 | 4;

export type GitHubContributionDay = {
  date: string;
  count: number;
  level: GitHubContributionLevel;
};

export type GitHubContributionWeek = {
  firstDay: string;
  days: GitHubContributionDay[];
};

export type GitHubRecentRepo = {
  name: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  languageColor: string;
  pushedAt: string;
};

export type GitHubContributionPayload = {
  username: string;
  generatedAt: string;
  range: {
    from: string;
    to: string;
  };
  weeks: GitHubContributionWeek[];
  totalContributions: number;
  recentRepos: GitHubRecentRepo[];
  source: 'graphql' | 'fallback';
};
