import { Section } from '../components/Section.jsx';
import { skills } from '../content/site.js';

export function Skills() {
  return (
    <Section id="skills" title="Skills" align="left">
      <div className="panel terminal reveal">
        <div className="terminal__bar" aria-hidden="true">
          <i /><i /><i /><span>~/akshar/skills</span>
        </div>
        <div className="terminal__body">
          {skills.map((group) => (
            <div key={group.group}>
              <p className="terminal__line"><b>$</b> ls {group.group}/</p>
              <ul className="chips">
                {group.items.map((item) => <li className="chip" key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
