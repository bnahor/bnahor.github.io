import { useRef } from 'react';
import { m, useScroll, useSpring } from 'framer-motion';
import { experience } from '../../data/experience';
import { Icon } from '../Icon';
import { EASE_OUT } from '../motion/ease';
import { Reveal } from '../motion/Reveal';

// The trace and the nodes share one trigger line, 65% down the viewport, so
// each node lights exactly as the trace reaches it.
const TRIGGER = '65%';
const DIM = 'rgba(239, 239, 232, 0.45)';
const LIT = '#f8f8ff';
// Bottom edge at the trigger line; the top edge is pushed far up so a node
// still lights when an anchor jump lands past it without scrolling through.
const NODE_MARGIN = `100000px 0px -${100 - parseInt(TRIGGER)}% 0px`;

export function ExperienceTile() {
  const consoleRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: consoleRef,
    offset: [`start ${TRIGGER}`, `end ${TRIGGER}`],
  });
  const traceScale = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <section id="experience" className="experience-section" aria-labelledby="experience-heading">
      <Reveal className="section-heading">
        <div>
          <p className="section-kicker">Work log · 2023–2026</p>
          <h2 id="experience-heading" className="section-title">Experience</h2>
        </div>
        <p className="section-description">
          The systems I shipped, what broke, and the measurable result.
        </p>
      </Reveal>

      <div ref={consoleRef} className="experience-console">
        <m.span className="experience-trace" aria-hidden="true" style={{ scaleY: traceScale }} />

        {experience.map((item) => {
          const remainingBullets = item.bullets.slice(item.featuredBulletCount);

          return (
            <m.article
              key={`${item.company}-${item.role}`}
              className={`log-entry ${item.current ? 'log-entry--current' : ''}`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
            >
              <div className="log-time">
                <m.span
                  className="log-node"
                  aria-hidden="true"
                  initial={{ backgroundColor: DIM, boxShadow: `0 0 0 1px ${DIM}, 0 0 0px rgba(248, 248, 255, 0)` }}
                  whileInView={{ backgroundColor: LIT, boxShadow: `0 0 0 1px ${LIT}, 0 0 14px rgba(248, 248, 255, 1)` }}
                  viewport={{ once: true, margin: NODE_MARGIN }}
                  transition={{ duration: 0.35 }}
                />
                <time>{item.start}</time>
                <span>{item.end}</span>
              </div>

              <div className="log-identity">
                <p className="experience-company">
                  {item.company}
                  {item.current && <span className="current-pill">Current</span>}
                </p>
                <h3>{item.role}</h3>
                <div className="experience-location">
                  <Icon name="location" size={13} />
                  {item.location}
                </div>
              </div>

              <div className="log-notes">
                <p className="experience-summary">{item.summary}</p>

                {item.story && (
                  <blockquote className="incident-story">
                    <span>INCIDENT / RECOVERY</span>
                    {item.story}
                  </blockquote>
                )}

                <div className="metric-row" aria-label="Role highlights">
                  {item.metrics.map((metric) => (
                    <span key={metric}>{metric}</span>
                  ))}
                </div>

                <ul className="impact-list">
                  {item.bullets.slice(0, item.featuredBulletCount).map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                {remainingBullets.length > 0 && (
                  <details className="experience-more">
                    <summary>
                      Show {remainingBullets.length} more
                      <Icon name="arrowDown" size={14} />
                    </summary>
                    <ul className="impact-list impact-list--additional">
                      {remainingBullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="tech-list tech-list--dark" aria-label="Technologies used">
                  {item.tech.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>
              </div>
            </m.article>
          );
        })}
      </div>
    </section>
  );
}
