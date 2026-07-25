import { education } from '../../data/education';
import { ScrollReveal } from '../../utils/motion';

export function EducationTile() {
  return (
    <section aria-labelledby="education-heading">
      <p className="section-kicker">Education</p>
      <h2 id="education-heading" className="section-title">
        Academic Track
      </h2>

      <div className="mt-8 space-y-0">
        {education.map((item, index) => (
          <ScrollReveal key={item.school} delay={index * 0.08}>
            <div className={`py-4 ${index > 0 ? 'border-t border-line' : ''}`}>
              <h3 className="text-base font-semibold text-text-primary">{item.school}</h3>
              <p className="mt-1 text-sm text-text-muted">{item.degree}</p>
              <p className="mt-1 font-mono text-xs text-accent/90">
                {item.start} — {item.end}
              </p>
              {item.details && item.details.length > 0 && (
                <p className="mt-2 border-l border-line pl-3 text-xs leading-relaxed text-text-muted">
                  {item.details[0]}
                </p>
              )}
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
