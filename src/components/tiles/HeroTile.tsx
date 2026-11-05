import { useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { Icon } from '../Icon';
import { EASE_OUT } from '../motion/ease';
import { SignalScope } from '../motion/SignalScope';
import { profile } from '../../data/profile';

function singaporeTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** One headline line rising out of a clipping mask. */
function MaskLine({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span className="mask-line">
      <m.span
        className="mask-line-inner"
        initial={{ y: '105%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 1, ease: EASE_OUT, delay }}
      >
        {children}
      </m.span>
    </span>
  );
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE_OUT, delay },
});

export function HeroTile() {
  const [localTime] = useState(() => singaporeTime(new Date()));

  return (
    <section id="top" className="hero-tile" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <m.div className="hero-status" {...rise(0.05)}>
          <span className="status-dot" aria-hidden="true" />
          <span>{profile.status}</span>
          <span className="hero-previously">Prev. {profile.previously}</span>
          <span className="hero-location">
            {profile.location} · {localTime} SGT
          </span>
        </m.div>

        <m.p className="hero-overline" {...rise(0.15)}>
          Backend · data platforms · operator tools
        </m.p>
        <h1 id="hero-heading">
          <MaskLine delay={0.2}>Systems that hold up</MaskLine>{' '}
          <em>
            <MaskLine delay={0.36}>when the real world doesn’t.</MaskLine>
          </em>
        </h1>
        <div className="hero-body">
          <m.div {...rise(0.55)}>
            <p className="hero-intro">{profile.valueProp}</p>

            <div className="hero-actions">
              <a className="primary-action" href={`mailto:${profile.email}`}>
                Email me
                <Icon name="arrowRight" size={16} />
              </a>
              <a
                className="secondary-action"
                href={profile.links.resume}
                target="_blank"
                rel="noreferrer"
              >
                View résumé
                <Icon name="arrowRight" size={15} />
              </a>
            </div>
          </m.div>

          <m.p className="hero-note" {...rise(0.7)}>
            Most of what I build sits where software meets something unforgiving: a market
            open, a dropped LTE link, an operator working fast in the field. I care about
            what the system does on the bad day.
          </m.p>
        </div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
        >
          <SignalScope />
        </m.div>
      </div>
    </section>
  );
}
