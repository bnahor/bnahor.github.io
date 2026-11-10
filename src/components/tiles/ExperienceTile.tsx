import type { MouseEvent } from 'react';
import { experience } from '../../data/experience';
import { collapse, expand } from '../../lib/motion';

const LEADING_NUMBER = /^(\d+(?:\.\d+)?)([\s\S]*)$/;

/** "40% more reliable data": the number counts up when the card opens. */
function Metric({ text }: { text: string }) {
  const [, value, rest] = LEADING_NUMBER.exec(text) ?? [];
  if (value === undefined) return <>{text}</>;
  return (
    <>
      {/* The final number holds the width, so the count doesn't shuffle the line. */}
      <span className="count">
        <span aria-hidden="true">{value}</span>
        <span data-count={value}>{value}</span>
      </span>
      {rest}
    </>
  );
}

/** Opens and closes the card with motion, while keeping the native details element. */
function toggle(event: MouseEvent<HTMLElement>) {
  const details = event.currentTarget.parentElement;
  const body = details?.querySelector<HTMLElement>(':scope > .credit-body');
  if (!(details instanceof HTMLDetailsElement) || !body) return;
  event.preventDefault();

  if (details.open && !details.classList.contains('is-closing')) {
    details.classList.add('is-closing');
    collapse(body, () => {
      details.open = false;
      details.classList.remove('is-closing');
    });
  } else {
    details.classList.remove('is-closing');
    details.open = true;
    expand(body);
  }
}

export function ExperienceTile() {
  return (
    <section id="experience" className="reel-section" aria-labelledby="experience-heading">
      <h2 id="experience-heading" className="reel-title">Experience</h2>

      <ul className="roll">
        {experience.map((item, index) => (
          <li key={`${item.company}-${item.role}`}>
            <details className="credit" open={index === 0}>
              <summary onClick={toggle}>
                <span className="credit-job">{item.role}</span>
                <span className="credit-name">
                  {item.company}
                  <span className="credit-line">{item.summary}</span>
                  <span className="credit-meta">
                    {item.start} to {item.end}, {item.location}
                  </span>
                </span>
                <span className="toggle" aria-hidden="true" />
              </summary>

              <div className="credit-body">
                <div className="credit-body-inner">
                  {item.story && <p className="credit-story">{item.story}</p>}
                  <ul className="credit-metrics" aria-label="Role highlights">
                    {item.metrics.map((metric) => (
                      <li key={metric}>
                        <Metric text={metric} />
                      </li>
                    ))}
                  </ul>
                  <ul className="credit-bullets">
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="credit-tech">{item.tech.join(', ')}</p>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
