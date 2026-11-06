import { education } from '../../data/education';

export function EducationTile() {
  return (
    <section id="about" className="reel-section" aria-labelledby="education-heading">
      <h2 id="education-heading" className="reel-title">Trained at</h2>
      <ul className="roll">
        {education.map((item) => (
          <li key={item.school} className="credit credit--static">
            <span className="credit-job">
              {item.start} to {item.end}
            </span>
            <div className="credit-name">
              {item.school}
              <span className="credit-line">{item.degree.replace(' — ', ', ')}</span>
              {item.details?.map((detail) => (
                <span className="credit-meta" key={detail}>
                  {detail}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
