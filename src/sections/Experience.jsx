import { Section } from '../components/Section.jsx';
import { experience } from '../content/site.js';

export function Experience() {
  return (
    <Section id="experience" title="Experience" align="left">
      <div className="panel reveal">
        <ol className="timeline">
          {experience.map((job) => (
            <li className="timeline__item" key={`${job.company}-${job.role}`}>
              <span className="label timeline__when">{job.when}</span>
              <h3 className="timeline__role">{job.role}</h3>
              <p className="timeline__company">{job.company} · {job.where}</p>
              <ul className="points">
                {job.points.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <ul className="chips">
                {job.tags.map((tag) => <li className="chip" key={tag}>{tag}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
