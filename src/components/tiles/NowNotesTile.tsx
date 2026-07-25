import { profile } from '../../data/profile';
import { ScrollReveal } from '../../utils/motion';

export function NowNotesTile() {
  const items = [
    { label: 'FOCUS', value: profile.now.focus },
    { label: 'LEARNING', value: profile.now.learning },
    { label: 'BEYOND CODE', value: profile.now.beyondCode },
  ];

  return (
    <section id="now-notes" aria-labelledby="now-notes-heading">
      <p className="section-kicker">Now / Status</p>
      <h2 id="now-notes-heading" className="mt-1 font-display text-2xl leading-tight text-text-primary">
        Current operating notes
      </h2>

      <div className="mt-6 space-y-0">
        {items.map((item, index) => (
          <ScrollReveal key={item.label} delay={index * 0.08}>
            <div className={`border-l border-brand/40 py-3 pl-4 ${index > 0 ? 'mt-3' : ''}`}>
              <dt className="font-mono text-[11px] tracking-[0.14em] text-brand/60">{item.label}:</dt>
              <dd className="mt-1 text-sm leading-relaxed text-text-primary">{item.value}</dd>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
