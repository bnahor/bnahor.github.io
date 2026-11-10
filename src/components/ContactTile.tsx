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
      <h2 id="contact-heading" className="reel-title">Contact</h2>
      <p className="fin-copy">
        I’m a generalist looking for my next role, in San Francisco, New York or Singapore. I’d
        consider elsewhere for the right company.
      </p>
      <a className="fin-address" href={`mailto:${profile.email}`}>
        {profile.email}
      </a>
      <div className="fin-links">
        <button className="text-link" type="button" onClick={copyEmail} aria-live="polite">
          <span key={String(copied)} className="swap">
            {copied ? 'Copied' : 'Copy email'}
            {copied && <Icon name="check" size={14} />}
          </span>
        </button>
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
