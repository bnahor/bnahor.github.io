import { Icon } from '../Icon';
import { profile } from '../../data/profile';

export function HeroTile() {
  return (
    <section
      id="top"
      className="hero"
      aria-labelledby="hero-heading"
      data-scene
      data-jitter="0.2"
      data-skeleton="0"
    >
      <div className="hero-card" data-stage-text>
        <h1 id="hero-heading" className="hero-title">
          {profile.name}
        </h1>
        <p className="hero-logline">{profile.logline}</p>
        <div className="hero-actions">
          <a className="text-link text-link--strong" href={`mailto:${profile.email}`}>
            Email me
            <Icon name="arrowRight" size={15} />
          </a>
          <a className="text-link" href="#incident">
            The six-week bug
            <Icon name="arrowDown" size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
