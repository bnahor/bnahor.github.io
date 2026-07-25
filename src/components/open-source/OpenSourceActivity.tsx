import { useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import type { GitHubContributionPayload } from '../../types/github';
import { GitHubContributionsHeatmap } from './GitHubContributionsHeatmap';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { ScrollReveal, StaggerGroup } from '../../utils/motion';
import { tapScale } from '../../utils/motionPresets';

function fallbackPayload(): GitHubContributionPayload {
  const today = new Date();
  const weeks = [];

  for (let w = 0; w < 53; w += 1) {
    const weekStart = new Date(today);
    weekStart.setUTCDate(today.getUTCDate() - (52 - w) * 7);
    const days = [];

    for (let d = 0; d < 7; d += 1) {
      const day = new Date(weekStart);
      day.setUTCDate(weekStart.getUTCDate() + d);
      days.push({
        date: day.toISOString().slice(0, 10),
        count: 0,
        level: 0 as const,
      });
    }

    weeks.push({
      firstDay: weekStart.toISOString().slice(0, 10),
      days,
    });
  }

  return {
    username: 'RB9823',
    generatedAt: new Date().toISOString(),
    range: {
      from: weeks[0]?.firstDay ?? new Date().toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
    },
    totalContributions: 0,
    weeks,
    recentRepos: [],
    source: 'fallback',
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function OpenSourceActivity() {
  const [payload, setPayload] = useState<GitHubContributionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContributions() {
      try {
        const base = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL;
        const response = await fetch(`${base}data/github-contributions.json`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Unable to load contribution data (${response.status})`);
        }

        const data = (await response.json()) as GitHubContributionPayload;
        if (!cancelled) {
          setPayload(data);
        }
      } catch {
        if (!cancelled) {
          setPayload(fallbackPayload());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadContributions();

    return () => {
      cancelled = true;
    };
  }, []);

  const safePayload = useMemo(() => payload ?? fallbackPayload(), [payload]);

  return (
    <ScrollReveal>
      <section id="open-source" aria-labelledby="open-source-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Open Source</p>
            <h2 id="open-source-heading" className="section-title">
              Activity that backs up the build claims
            </h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-text-primary">
              <AnimatedCounter value={safePayload.totalContributions} />
            </p>
            <p className="text-xs text-text-muted">
              {loading ? 'Loading...' : `contributions · Updated ${formatDate(safePayload.generatedAt)}`}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <GitHubContributionsHeatmap payload={safePayload} />

          <section className="space-y-4" aria-label="Recent repositories">
            <h3 className="font-display text-lg text-text-primary">Recent Repos</h3>
            <StaggerGroup className="grid gap-3">
              {safePayload.recentRepos.length > 0 ? (
                safePayload.recentRepos.map((repo, index) => (
                  <ScrollReveal key={repo.url} delay={index * 0.08}>
                    <m.a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -2 }}
                      whileTap={tapScale}
                      className="panel group block p-3 transition-colors hover:border-brand/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-text-primary group-hover:text-brand">{repo.name}</h4>
                        <span className="rounded-md border border-brand/20 px-2 py-0.5 text-[10px] text-brand/70">
                          ★ {repo.stars}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">{repo.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: repo.languageColor }}
                            aria-hidden="true"
                          />
                          {repo.language}
                        </span>
                        <span>{formatDate(repo.pushedAt)}</span>
                      </div>
                    </m.a>
                  </ScrollReveal>
                ))
              ) : (
                <div className="panel p-4 text-sm text-text-muted">
                  Recent repository activity is temporarily unavailable.
                </div>
              )}
            </StaggerGroup>
          </section>
        </div>
      </section>
    </ScrollReveal>
  );
}
