import { skills } from '../../data/skills';

export function SkillsTile() {
  return (
    <section id="skills" className="reel-section" aria-labelledby="skills-heading">
      <h2 id="skills-heading" className="reel-title">Equipment</h2>
      <ul className="roll roll--tight">
        {skills.map((skill) => (
          <li key={skill.group} className="credit credit--static">
            <span className="credit-job">{skill.group}</span>
            <span className="credit-plain">{skill.items.join(', ')}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
