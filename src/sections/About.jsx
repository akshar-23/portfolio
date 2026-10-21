import { Screen, SectionHead } from '../components/Section.jsx';
import { about } from '../content/site.js';

export function About() {
  return (
    <Screen id="about" className="about">
      <div className="col col--right" data-scroll data-block>
        <SectionHead id="about" title="About" />
        <div className="about__text">
          {about.paragraphs.map((text, i) => (
            <p className="reveal" style={{ '--i': i + 1 }} key={text}>{text}</p>
          ))}
        </div>
        <dl className="kv reveal" style={{ '--i': 4 }}>
          {about.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <ul className="edu reveal" style={{ '--i': 5 }}>
          {about.education.map((entry) => (
            <li key={entry.school}>
              <span className="edu__degree">{entry.degree}</span>
              <span className="edu__school">{entry.school} · {entry.detail}</span>
              <time>{entry.when}</time>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}
