import { useState } from 'react';
import { Icon } from './Icon';
import { profile } from '../data/profile';

export function ContactTile() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" className="fin" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="reel-title">Next production</h2>
      <p className="fin-copy">
        I’m looking for my next role in backend, data platforms or robotics infrastructure, based
        in Singapore. I’m just as happy to talk through a hard engineering problem.
      </p>
      <a className="fin-address" href={`mailto:${profile.email}`}>
        {profile.email}
      </a>
      <div className="fin-links">
        <button className="text-link" type="button" onClick={copyEmail} aria-live="polite">
          {copied ? 'Copied' : 'Copy email'}
          {copied && <Icon name="check" size={14} />}
        </button>
        <a className="text-link" href={profile.links.resume} target="_blank" rel="noreferrer">
          Résumé
        </a>
        <a className="text-link" href={profile.links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a className="text-link" href={profile.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a className="text-link" href={profile.links.x} target="_blank" rel="noreferrer">
          X
        </a>
        <a className="text-link" href={profile.links.instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
      </div>
    </section>
  );
}
