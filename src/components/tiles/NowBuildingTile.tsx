import { changelog } from '../../data/changelog';
import { ScrollReveal } from '../../utils/motion';

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function NowBuildingTile() {
  return (
    <section id="changelog" aria-labelledby="changelog-heading">
      <p className="section-kicker">Now Building</p>
      <h2 id="changelog-heading" className="mt-1 flex items-center gap-2 font-display text-2xl text-text-primary">
        Shipping Log
        <span className="h-2.5 w-2.5 bg-brand" aria-hidden="true" />
      </h2>

      <div className="mt-6 space-y-0">
        {changelog.map((entry, index) => (
          <ScrollReveal key={`${entry.date}-${entry.title}`} delay={index * 0.06}>
            <div className={`py-3 ${index > 0 ? 'border-t border-line' : ''}`}>
              <p className="font-mono text-[11px] text-text-muted">{toDateLabel(entry.date)}</p>
              <h3 className="mt-1 text-sm font-semibold text-text-primary">{entry.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{entry.note}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
