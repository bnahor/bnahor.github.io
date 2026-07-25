import type { GitHubContributionPayload } from '../../types/github';

const LEVEL_CLASSES: Record<number, string> = {
  0: 'bg-white/[0.025] border-line',
  1: 'bg-brand/20 border-brand/30',
  2: 'bg-brand/40 border-brand/50',
  3: 'bg-brand/60 border-brand/70',
  4: 'bg-brand/80 border-brand/90',
};

function monthShort(date: string): string {
  return new Date(date).toLocaleString('en-US', { month: 'short' });
}

function buildMonthMarkers(weeks: GitHubContributionPayload['weeks']) {
  const markers: Array<{ index: number; label: string }> = [];
  let previousMonth = '';

  weeks.forEach((week, index) => {
    const month = monthShort(week.firstDay);
    if (month !== previousMonth) {
      markers.push({ index, label: month });
      previousMonth = month;
    }
  });

  return markers;
}

export function GitHubContributionsHeatmap({ payload }: { payload: GitHubContributionPayload }) {
  const markers = buildMonthMarkers(payload.weeks);

  return (
    <section aria-label="GitHub contribution heatmap" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg text-text-primary">Contribution Graph</h3>
        <p className="text-xs text-text-muted">
          {payload.totalContributions.toLocaleString()} in the last 12 months
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white/[0.02] p-3">
        <div className="min-w-[760px] space-y-2">
          <div className="relative h-4 text-[11px] text-text-muted">
            {markers.map((marker) => (
              <span
                key={`${marker.label}-${marker.index}`}
                className="absolute"
                style={{ left: `${marker.index * 15}px` }}
              >
                {marker.label}
              </span>
            ))}
          </div>

          <div className="flex gap-[2px] pt-1">
            {payload.weeks.map((week) => (
              <div key={week.firstDay} className="grid grid-rows-7 gap-[2px]">
                {week.days.map((day) => (
                  <div
                    key={day.date}
                    className={`h-[14px] w-[14px] border ${LEVEL_CLASSES[day.level]}`}
                    title={`${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-[11px] text-text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`h-[14px] w-[14px] border ${LEVEL_CLASSES[level]}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
