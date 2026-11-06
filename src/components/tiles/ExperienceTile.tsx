import { experience } from '../../data/experience';

export function ExperienceTile() {
  return (
    <section id="experience" className="reel-section reel-section--opening" aria-labelledby="experience-heading">
      <h2 id="experience-heading" className="reel-title reel-title--credits">Credits</h2>
      <p className="reel-lede">Experience, 2023 to 2026. Open any line for the detail.</p>

      <ul className="roll">
        {experience.map((item, index) => (
          <li key={`${item.company}-${item.role}`}>
            <details className="credit" open={index === 0}>
              <summary>
                <span className="credit-job">{item.role}</span>
                <span className="credit-name">
                  {item.company}
                  <span className="credit-line">{item.summary}</span>
                  <span className="credit-meta">
                    {item.start} to {item.end}, {item.location}
                  </span>
                </span>
              </summary>

              <div className="credit-body">
                {item.story && <p className="credit-story">{item.story}</p>}
                <ul className="credit-metrics" aria-label="Role highlights">
                  {item.metrics.map((metric) => (
                    <li key={metric}>{metric}</li>
                  ))}
                </ul>
                <ul className="credit-bullets">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <p className="credit-tech">{item.tech.join(', ')}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
