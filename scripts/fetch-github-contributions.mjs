import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'public', 'data', 'github-contributions.json');
const USERNAME = process.env.GITHUB_USERNAME || 'RB9823';
const TOKEN = process.env.GITHUB_TOKEN || '';

const QUERY = `
  query PortfolioContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
      repositories(
        first: 8
        orderBy: { field: PUSHED_AT, direction: DESC }
        ownerAffiliations: OWNER
        privacy: PUBLIC
        isFork: false
      ) {
        nodes {
          name
          url
          description
          stargazerCount
          pushedAt
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
`;

function clampLevel(count, maxCount) {
  if (count <= 0) return 0;
  if (maxCount <= 0) return 1;
  const ratio = count / maxCount;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.8) return 3;
  return 4;
}

function isoDate(daysDelta = 0) {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + daysDelta);
  return now.toISOString().slice(0, 10);
}

function createEmptyWeeks(from, weekCount = 53) {
  const start = new Date(from);
  const weeks = [];

  for (let w = 0; w < weekCount; w += 1) {
    const weekStart = new Date(start);
    weekStart.setUTCDate(start.getUTCDate() + w * 7);
    const firstDay = weekStart.toISOString().slice(0, 10);
    const days = [];

    for (let d = 0; d < 7; d += 1) {
      const day = new Date(weekStart);
      day.setUTCDate(weekStart.getUTCDate() + d);
      days.push({
        date: day.toISOString().slice(0, 10),
        count: 0,
        level: 0,
      });
    }

    weeks.push({ firstDay, days });
  }

  return weeks;
}

function createFallbackPayload(reason) {
  const to = isoDate(0);
  const from = isoDate(-371);

  return {
    username: USERNAME,
    generatedAt: new Date().toISOString(),
    range: { from, to },
    totalContributions: 0,
    weeks: createEmptyWeeks(from, 53),
    recentRepos: [
      {
        name: 'techjam-2025-final',
        url: 'https://github.com/RB9823/techjam-2025-final',
        description: 'Automated UI inconsistency detection prototype.',
        stars: 0,
        language: 'Python',
        languageColor: '#3572A5',
        pushedAt: new Date().toISOString(),
      },
      {
        name: 'GenAI',
        url: 'https://github.com/RB9823/GenAI',
        description: 'Sentiment analysis app across text and voice.',
        stars: 0,
        language: 'TypeScript',
        languageColor: '#3178c6',
        pushedAt: new Date().toISOString(),
      },
    ],
    source: 'fallback',
    note: reason,
  };
}

function normalizeWeeks(weeks, from) {
  if (weeks.length >= 53) {
    return weeks.slice(-53);
  }

  const missing = 53 - weeks.length;
  const padding = createEmptyWeeks(from, missing);
  return [...padding, ...weeks];
}

async function fetchContributions() {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - 371);

  const body = JSON.stringify({
    query: QUERY,
    variables: {
      login: USERNAME,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
  });

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL returned errors: ${payload.errors[0].message}`);
  }

  const user = payload.data?.user;
  if (!user?.contributionsCollection?.contributionCalendar) {
    throw new Error('GitHub GraphQL response missing contribution calendar');
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const rawWeeks = calendar.weeks ?? [];
  const allCounts = rawWeeks.flatMap((week) =>
    (week.contributionDays ?? []).map((day) => day.contributionCount ?? 0),
  );
  const maxCount = Math.max(0, ...allCounts);
  const normalizedWeeks = normalizeWeeks(
    rawWeeks.map((week) => ({
      firstDay: week.firstDay,
      days: (week.contributionDays ?? []).map((day) => ({
        date: day.date,
        count: day.contributionCount ?? 0,
        level: clampLevel(day.contributionCount ?? 0, maxCount),
      })),
    })),
    fromDate.toISOString().slice(0, 10),
  );

  const recentRepos = (user.repositories?.nodes ?? []).slice(0, 6).map((repo) => ({
    name: repo.name,
    url: repo.url,
    description: repo.description || 'No description provided.',
    stars: repo.stargazerCount || 0,
    language: repo.primaryLanguage?.name || 'Unknown',
    languageColor: repo.primaryLanguage?.color || '#94a3b8',
    pushedAt: repo.pushedAt,
  }));

  return {
    username: USERNAME,
    generatedAt: new Date().toISOString(),
    range: {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    },
    totalContributions: calendar.totalContributions ?? 0,
    weeks: normalizedWeeks,
    recentRepos,
    source: 'graphql',
  };
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });

  let payload;
  if (!TOKEN) {
    payload = createFallbackPayload('No GITHUB_TOKEN provided. Wrote fallback contribution data.');
  } else {
    try {
      payload = await fetchContributions();
    } catch (error) {
      payload = createFallbackPayload(
        error instanceof Error ? error.message : 'Unknown GitHub fetch error. Wrote fallback data.',
      );
    }
  }

  await fs.writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote GitHub contribution payload (${payload.source}) to public/data/github-contributions.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
