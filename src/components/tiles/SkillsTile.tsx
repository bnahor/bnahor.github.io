import { skills } from '../../data/skills';

export function SkillsTile() {
  return (
    <section id="skills" className="reel-section" aria-labelledby="skills-heading">
      <h2 id="skills-heading" className="reel-title">Skills</h2>
      <ul className="roll roll--tight">
        {skills.map((skill) => (
          <li key={skill.group} className="credit credit--static">
            <div className="credit-name">
              {skill.group}
              <span className="credit-line">{skill.items.join(', ')}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
