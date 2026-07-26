import { useState } from 'react';
import { Icon } from '../Icon';
import { profile } from '../../data/profile';

function singaporeTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function HeroTile() {
  const [localTime] = useState(() => singaporeTime(new Date()));

  return (
    <section id="top" className="hero-tile" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <div className="hero-status">
          <span className="status-dot" aria-hidden="true" />
          <span>
            {profile.role} · {profile.company}
          </span>
          <span className="hero-location">
            {profile.location} · {localTime} SGT
          </span>
        </div>

        <p className="hero-overline">Backend · data platforms · operator tools</p>
        <h1 id="hero-heading">
          Systems that hold up <em>when the real world doesn’t.</em>
        </h1>
        <div className="hero-body">
          <div>
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
          </div>

          <p className="hero-note">
            Most of what I build sits where software meets something unforgiving: a market
            open, a dropped LTE link, an operator working fast in the field. I care about
            what the system does on the bad day.
          </p>
        </div>
      </div>
    </section>
  );
}
