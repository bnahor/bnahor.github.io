import { useState } from 'react';
import { m } from 'framer-motion';
import { experience } from '../../data/experience';
import { ScrollReveal } from '../../utils/motion';

export function ExperienceTile() {
  const [showAll, setShowAll] = useState(false);
  const entries = showAll ? experience : experience.slice(0, 3);

  return (
    <section aria-labelledby="experience-heading">
      <p className="section-kicker">Experience</p>
      <h2 id="experience-heading" className="section-title">
        Engineering impact
      </h2>
      <p className="mt-2 text-sm text-text-muted max-w-lg">
        Incident-first thinking, clear ownership boundaries, and measurable reliability outcomes.
      </p>

      <div className="mt-8 relative">
        <m.div
          className="absolute left-[7px] top-2 bottom-2 w-px origin-top bg-line"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        <div className="space-y-8">
          {entries.map((item, index) => (
            <ScrollReveal key={`${item.company}-${item.role}`} delay={index * 0.08}>
              <div className="relative pl-8">
                <div className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center border border-brand/50 bg-bg">
                  <div className="h-1.5 w-1.5 bg-brand" />
                </div>

                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{item.role}</h3>
                      <p className="text-sm text-brand/85">{item.company}</p>
                    </div>
                    <p className="font-mono text-xs text-text-muted">
                      {item.start} — {item.end}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-md border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] text-brand/85"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {showAll && (
                    <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-text-muted">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1 w-3 flex-none bg-text-muted/40" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(showAll ? item.tech : item.tech.slice(0, 5)).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-line bg-white/[0.02] px-2 py-0.5 text-[11px] text-text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {experience.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-6 rounded-md border border-line px-3 py-2 text-sm text-text-muted transition hover:border-brand/30 hover:text-brand"
        >
          {showAll ? 'Show highlights' : `Show full details for ${experience.length} roles`}
        </button>
      )}
    </section>
  );
}
