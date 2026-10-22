import { Screen, SectionHead, useActive } from '../components/Section.jsx';
import { about } from '../content/site.js';

// On small screens About is two steps: the story, then education.
export function About() {
  const { step, compact, short } = useActive('about');
  const split = compact || short;
  const story = !split || step === 0;
  const education = !split || step === 1;
  return (
    <Screen id="about" className="about">
      <div className="col col--right" data-fit data-block>
        <SectionHead id="about" title="About" />
        {story && (
          <div className="about__text" key="story">
            {about.paragraphs.map((text, i) => (
              <p className="reveal" style={{ '--i': i + 1 }} key={text}>{text}</p>
            ))}
          </div>
        )}
        {education && (
          <div className={split ? 'detail' : undefined} key="education">
            <ul className="edu reveal" style={{ '--i': 4 }}>
              {about.education.map((entry) => (
                <li key={entry.school}>
                  <span className="edu__degree">{entry.degree}</span>
                  <span className="edu__school">{entry.school} · {entry.detail}</span>
                  <time>{entry.when}</time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Screen>
  );
}
