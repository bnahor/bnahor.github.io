import type { PointerEvent } from 'react';
import { m } from 'framer-motion';
import { projects } from '../../data/projects';
import { Icon } from '../Icon';
import { EASE_OUT } from '../motion/ease';
import { Reveal } from '../motion/Reveal';

/** Feeds the pointer position to CSS so the card's spotlight follows it. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

export function ProjectsTile() {
  return (
    <section id="projects" className="projects-section" aria-labelledby="projects-heading">
      <div className="projects-inner">
        <Reveal className="section-heading section-heading--projects">
          <div>
            <p className="section-kicker">Builds outside work</p>
            <h2 id="projects-heading" className="section-title">Projects</h2>
          </div>
          <p className="section-description">
            Four hackathon builds. Three made the finals or won a prize.
          </p>
        </Reveal>

        <div className="project-grid">
          {projects.map((project, index) => (
            <m.article
              key={project.title}
              className={`project-card project-card--${index + 1} ${
                index === 0 ? 'project-card--lead' : ''
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: (index % 2) * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.25 } }}
              onPointerMove={trackPointer}
            >
              <div className="project-topline">
                <span>{project.event}</span>
                <span>{project.date}</span>
              </div>

              <div className="project-heading">
                <h3>{project.title}</h3>
                <span>{project.role}</span>
              </div>

              <p className="project-description">{project.description}</p>
              <p className="project-impact">{project.impact}</p>

              <div className="project-footer">
                <div className="tech-list">
                  {project.tech.map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                </div>

                {(project.href || project.demoHref) && (
                  <div className="project-links">
                    {project.href && (
                      <a href={project.href} target="_blank" rel="noreferrer">
                        Source <Icon name="arrowRight" size={14} />
                      </a>
                    )}
                    {project.demoHref && (
                      <a href={project.demoHref} target="_blank" rel="noreferrer">
                        Live <Icon name="arrowRight" size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
}
