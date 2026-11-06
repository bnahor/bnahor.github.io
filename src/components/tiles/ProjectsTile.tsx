import { projects } from '../../data/projects';
import { Icon } from '../Icon';

export function ProjectsTile() {
  return (
    <section id="projects" className="reel-section" aria-labelledby="projects-heading">
      <h2 id="projects-heading" className="reel-title">Projects</h2>

      <ul className="roll">
        {projects.map((project) => (
          <li key={project.title} className="credit credit--static">
            <span className="credit-job">{project.role.replace(' · ', ', ')}</span>
            <div className="credit-name">
              {project.title}
              <span className="credit-line">{project.description}</span>
              <span className="credit-meta">
                {project.event}. {project.impact}.
              </span>
              <span className="credit-tech">{project.tech.join(', ')}</span>
              {(project.href || project.demoHref) && (
                <span className="credit-links">
                  {project.href && (
                    <a className="text-link" href={project.href} target="_blank" rel="noreferrer">
                      Source
                      <Icon name="arrowRight" size={14} />
                    </a>
                  )}
                  {project.demoHref && (
                    <a className="text-link" href={project.demoHref} target="_blank" rel="noreferrer">
                      Live
                      <Icon name="arrowRight" size={14} />
                    </a>
                  )}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
