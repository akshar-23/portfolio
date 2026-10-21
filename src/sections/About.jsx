import { Section } from '../components/Section.jsx';
import { about } from '../content/site.js';

export function About() {
  return (
    <Section id="about" title="About" align="right">
      <div className="panel reveal">
        <div className="about__text">
          {about.paragraphs.map((text) => <p key={text}>{text}</p>)}
        </div>

        <dl className="facts">
          {about.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="label">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="education">
          {about.education.map((entry) => (
            <li key={entry.school}>
              <strong>{entry.degree}</strong>
              <time>{entry.when}</time>
              <span>{entry.school} · {entry.where}</span>
              <span className="label">{entry.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
