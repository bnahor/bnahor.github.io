import { KineticTitle } from '../KineticTitle';
import { Icon } from '../Icon';
import { profile } from '../../data/profile';

export function HeroTile() {
  return (
    <section
      id="top"
      className="hero"
      aria-labelledby="hero-heading"
      data-scene
      data-jitter="0.62"
      data-skeleton="0"
      data-state="RAW"
    >
      <div className="hero-card" data-stage-text>
        <KineticTitle id="hero-heading" lines={['Rohan', 'Bahl']} className="hero-title" />
        <p className="hero-logline">{profile.logline}</p>
        <div className="hero-actions">
          <a className="text-link text-link--strong" href={`mailto:${profile.email}`}>
            Email me
            <Icon name="arrowRight" size={15} />
          </a>
          <a className="text-link" href={profile.links.resume} target="_blank" rel="noreferrer">
            Résumé
            <Icon name="arrowRight" size={15} />
          </a>
          <a className="text-link hero-story-link" href="#incident">
            The six-week bug
            <Icon name="arrowDown" size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
