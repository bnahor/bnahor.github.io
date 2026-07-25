import { Link, useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { projects } from '../data/projects';
import { ScrollReveal, StaggerGroup } from '../utils/motion';
import { hoverLift, tapScale } from '../utils/motionPresets';

export function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((item) => item.slug === slug);

  if (!project || !project.caseStudy) {
    return (
      <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
        <div className="space-y-4">
          <div className="panel p-6 text-sm text-text-muted">
            Case study not found.
          </div>
          <Link to="/" className="text-sm text-brand/80 transition hover:text-brand">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] md:w-[min(1120px,calc(100%-3rem))] py-8 md:py-12">
      <article className="space-y-6">
        <Link to="/" className="group inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-brand/60 transition hover:text-brand">
          <m.span className="inline-block" whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>&larr;</m.span>
          Back to portfolio
        </Link>

        <ScrollReveal>
          <header>
            <p className="section-kicker">Case Study</p>
            <h1 className="section-title">{project.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-muted md:text-base">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.metrics.map((metric) => (
                <span key={metric} className="rounded-md border border-brand/20 bg-brand/10 px-2.5 py-1 font-mono text-xs text-brand/85">
                  {metric}
                </span>
              ))}
            </div>
          </header>
        </ScrollReveal>

        <StaggerGroup className="grid gap-4 md:grid-cols-2">
          <ScrollReveal delay={0}>
            <m.div
              whileHover={{ y: -3 }}
              whileTap={tapScale}
              className="panel p-4 transition-colors hover:border-brand/25"
            >
              <h2 className="font-display text-xl text-text-primary">Challenge</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{project.caseStudy.challenge}</p>
            </m.div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <m.div
              whileHover={{ y: -3 }}
              whileTap={tapScale}
              className="panel p-4 transition-colors hover:border-brand/25"
            >
              <h2 className="font-display text-xl text-text-primary">Outcome</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                {project.caseStudy.outcome.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </m.div>
          </ScrollReveal>
        </StaggerGroup>

        <StaggerGroup className="grid gap-4 md:grid-cols-2">
          <ScrollReveal delay={0}>
            <m.div
              whileHover={{ y: -3 }}
              whileTap={tapScale}
              className="panel p-4 transition-colors hover:border-brand/25"
            >
              <h2 className="font-display text-xl text-text-primary">Architecture</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                {project.caseStudy.architecture.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </m.div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <m.div
              whileHover={{ y: -3 }}
              whileTap={tapScale}
              className="panel p-4 transition-colors hover:border-brand/25"
            >
              <h2 className="font-display text-xl text-text-primary">Tradeoffs</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                {project.caseStudy.tradeoffs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </m.div>
          </ScrollReveal>
        </StaggerGroup>

        {project.href && (
          <ScrollReveal>
            <div>
              <m.a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={hoverLift}
                whileTap={tapScale}
                className="inline-flex items-center rounded-md border border-brand/40 bg-brand/10 px-4 py-2 text-sm text-brand transition hover:bg-brand/20"
              >
                Open project repository
              </m.a>
            </div>
          </ScrollReveal>
        )}
      </article>
    </div>
  );
}
