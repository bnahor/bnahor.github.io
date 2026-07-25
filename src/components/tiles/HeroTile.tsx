import { Suspense, lazy, useMemo, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { profile } from '../../data/profile';
import { useContact } from '../contactContext';
import { smooth } from '../../utils/motionPresets';
import { Icon } from '../Icon';

const HeroScene = lazy(() => import('../3d/HeroScene'));

function useResumeHref() {
  return useMemo(() => {
    if (profile.links.resume.startsWith('http')) return profile.links.resume;
    const base = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL;
    return `${base}${profile.links.resume.replace(/^\//, '')}`;
  }, []);
}

export function HeroTile() {
  const [copied, setCopied] = useState(false);
  const { openContact } = useContact();
  const resumeHref = useResumeHref();
  const prefersReduced = useReducedMotion();

  async function handleCopyEmail() {
    try {
      if (!navigator.clipboard?.writeText) {
        window.location.href = `mailto:${profile.email}`;
        return;
      }
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1700);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  return (
    <section
      id="hero"
      className="relative min-h-[88svh] overflow-hidden border-b border-line"
      aria-labelledby="hero-heading"
    >
      <div className="absolute inset-y-0 right-0 hidden w-[48%] opacity-55 lg:block">
        <Suspense fallback={<div className="h-full w-full bg-brand/5" />}>
          <HeroScene />
        </Suspense>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[88svh] w-[min(1120px,calc(100%-1.5rem))] items-center gap-10 py-24 md:w-[min(1120px,calc(100%-3rem))] lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.72fr)]">
        <m.div
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <p className="section-kicker">{profile.role}</p>
            <m.h1
              id="hero-heading"
              initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...smooth, delay: 0.1 }}
              className="mt-4 font-display text-[clamp(3rem,8vw,7.5rem)] font-bold leading-[0.9] tracking-[-0.03em] text-text-primary"
            >
              {profile.name}
            </m.h1>

            <m.p
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-text-primary/85 md:text-xl"
            >
              {profile.valueProp}
            </m.p>

            <div className="mt-6 grid gap-2 border-l border-line pl-4">
              {profile.operatingPrinciples.map((principle) => (
                <p key={principle} className="text-sm leading-relaxed text-text-muted">
                  {principle}
                </p>
              ))}
            </div>

            <m.div
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href={resumeHref}
                download="rohan_bahl_resume.pdf"
                className="inline-flex items-center gap-2 rounded-md border border-brand/40 bg-brand/10 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/20 focus:outline-none focus:ring-2 focus:ring-brand/35"
              >
                Resume
                <Icon name="arrowRight" size={14} />
              </a>

              <button
                type="button"
                onClick={openContact}
                className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-brand/35 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              >
                Say hi
              </button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-sm text-text-muted transition hover:border-brand/35 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              >
                {copied ? 'Copied!' : 'Copy email'}
              </button>
            </m.div>

            <m.div
              initial={prefersReduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-4 font-mono text-xs text-text-muted"
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-brand" aria-hidden="true" />
                {profile.location}
              </span>
              <span className="text-white/20">/</span>
              <span>{profile.timezone}</span>
              <span className="text-white/20">/</span>
              <span className="text-brand/85">{profile.availability}</span>
            </m.div>
        </m.div>

        <m.aside
          initial={prefersReduced ? {} : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...smooth, delay: 0.25 }}
          className="panel overflow-hidden"
          aria-label="Engineering proof points"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Evidence / recent shipped work</p>
          </div>
          <div className="divide-y divide-line">
            {profile.proofPoints.map((point) => (
              <div key={point.value} className="grid gap-2 p-4 sm:grid-cols-[88px_1fr]">
                <p className="font-display text-3xl font-semibold leading-none text-brand">{point.value}</p>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{point.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{point.context}</p>
                </div>
              </div>
            ))}
          </div>
        </m.aside>
      </div>
    </section>
  );
}
