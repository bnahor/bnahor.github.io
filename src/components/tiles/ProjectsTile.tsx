import { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { projects } from '../../data/projects';
import { StaggerGroup, ScrollReveal } from '../../utils/motion';
import { Icon } from '../Icon';

export function ProjectsTile() {
  const [showAll, setShowAll] = useState(false);

  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);
  const displayProjects = showAll ? projects : featured;

  return (
    <div aria-labelledby="projects-heading">
      <div className="mb-8">
        <p className="section-kicker">Selected Work</p>
        <h2 id="projects-heading" className="section-title">
          Systems work, not just demos
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          A short list of builds where the interesting part was the boundary: what had to fail predictably,
          what had to be explainable, and what shipped within the constraint.
        </p>
      </div>

      <StaggerGroup className="grid gap-4 md:grid-cols-2">
        {displayProjects.map((project, index) => {
          const isFirst = index === 0 && !showAll;
          return (
            <ScrollReveal
              key={project.slug}
              delay={index * 0.06}
              className={isFirst ? 'md:col-span-2' : ''}
            >
              <m.article
                whileHover={{ y: -2 }}
                className={`panel group relative p-5 transition-colors hover:border-brand/30 ${
                  isFirst ? 'md:p-6' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{project.role}</p>
                    <h3 className={`mt-1 font-display text-text-primary ${isFirst ? 'text-2xl' : 'text-xl'}`}>
                    {project.title}
                    </h3>
                  </div>
                  {project.metrics[0] && (
                    <span className="rounded-md border border-brand/25 bg-brand/10 px-2.5 py-1 font-mono text-xs text-brand">
                      {project.metrics[0]}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-text-primary/80">{project.description}</p>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">{project.scope}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">Constraint</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-text-muted">
                      {project.constraints.slice(0, isFirst ? 3 : 2).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1 w-3 flex-none bg-accent/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">Architecture</p>
                    <ul className="mt-2 space-y-1.5 text-sm text-text-muted">
                      {project.architecture.slice(0, isFirst ? 3 : 2).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1 w-3 flex-none bg-brand/70" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand/80">Outcome</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-primary/90">{project.measurableOutcome}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-md border border-line bg-white/[0.025] px-2 py-0.5 text-[11px] text-text-muted"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  {project.href && (
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand/85 transition hover:text-brand"
                    >
                      Repository <Icon name="arrowRight" size={13} />
                    </a>
                  )}
                  {project.caseStudy && (
                    <Link
                      to={`/case-studies/${project.slug}`}
                      className="inline-flex items-center gap-1 text-text-muted transition hover:text-text-primary"
                    >
                      Case study <Icon name="arrowRight" size={13} />
                    </Link>
                  )}
                </div>
              </m.article>
            </ScrollReveal>
          );
        })}
      </StaggerGroup>

      {rest.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="rounded-md border border-line px-3 py-2 text-sm text-text-muted transition hover:border-brand/30 hover:text-brand"
          >
            {showAll ? 'Show selected work' : 'See all projects'}
          </button>
        </div>
      )}
    </div>
  );
}
