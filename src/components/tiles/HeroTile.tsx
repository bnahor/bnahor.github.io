import { useState } from 'react';
import { Icon } from '../Icon';
import { profile } from '../../data/profile';
import { commitCadence, contributionTotal, contributionsAsOf } from '../../data/contributions';

function singaporeTime(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function monthLabel(entry: { month: string; year: number } | undefined) {
  if (!entry) return '';
  return `${entry.month} ${String(entry.year).slice(2)}`;
}

function asOfLabel(iso: string) {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function CommitCadence() {
  const width = 600;
  const height = 76;
  const commits = commitCadence.map((item) => item.commits);
  const max = Math.max(1, ...commits);
  const first = monthLabel(commitCadence[0]);
  const last = monthLabel(commitCadence[commitCadence.length - 1]);
  const asOf = asOfLabel(contributionsAsOf);

  const coords = commits.map((value, index) => {
    const x = commits.length > 1 ? (index / (commits.length - 1)) * width : 0;
    const y = height - 8 - (value / max) * (height - 16);
    return { x, y };
  });
  const points = coords.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <aside
      className="cadence"
      aria-label={`GitHub commit cadence: ${contributionTotal.toLocaleString(
        'en-US',
      )} contributions from ${first} to ${last}, as of ${asOf}.`}
    >
      <div className="cadence-head">
        <span>Commit cadence</span>
        <span className="cadence-source">GitHub · as of {asOf}</span>
      </div>

      <div className="cadence-figure">
        <strong>{contributionTotal.toLocaleString('en-US')}</strong>
        <small>
          contributions · {first}–{last}
        </small>
      </div>

      <div className="cadence-plot" aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path className="cadence-grid" d="M0 19H600M0 38H600M0 57H600" />
          <polyline className="cadence-trace" points={points} />
          {coords.map((point, index) => (
            <circle key={commitCadence[index]?.month} cx={point.x} cy={point.y} r="2.5" />
          ))}
        </svg>
        <div className="cadence-months">
          <span>{first}</span>
          <span>{last}</span>
        </div>
      </div>
    </aside>
  );
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

        <p className="hero-overline">Capture systems · operator tools</p>
        <h1 id="hero-heading">
          Keeping cameras, trackers, and operators <em>on the same clock.</em>
        </h1>
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

      <div className="hero-instrument">
        <CommitCadence />
        <p className="instrument-note">
          I care about the seam between software and the physical world: clocks,
          dropped connections, operators in a hurry, and the recovery path when any
          of them fail.
        </p>
      </div>
    </section>
  );
}
