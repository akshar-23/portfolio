import { Screen, SectionHead } from '../components/Section.jsx';
import { skills } from '../content/site.js';

// A slowly scrolling column of skills, grouped under headers. The list is doubled so
// it loops without a jump.
function Feed({ groups, side }) {
  const rows = groups.flatMap((group) => [
    { key: `${group.group}-head`, head: true, text: group.group.replace('-', ' & '), count: group.items.length },
    ...group.items.map((item) => ({ key: `${group.group}-${item}`, text: item })),
  ]);
  return (
    <div className={`skill-feed skill-feed--${side} reveal`} style={{ '--i': side === 'left' ? 1 : 2 }} data-block data-scroll data-mask="box">
      <ul className="skill-feed__track">
        {[...rows, ...rows].map((row, i) => (
          <li key={`${row.key}-${i}`} className={row.head ? 'skill-feed__head' : 'skill-feed__item'} aria-hidden={i >= rows.length || undefined}>
            {row.text}
            {row.head && <span>{String(row.count).padStart(2, '0')}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Skills() {
  const half = Math.ceil(skills.length / 2);
  return (
    <Screen id="skills" className="skills">
      <div className="skills__head" data-block>
        <SectionHead id="skills" title="Skills" />
        <p className="skills__note reveal" style={{ '--i': 1 }}>
          {skills.reduce((sum, group) => sum + group.items.length, 0)} tools across {skills.length} groups. Hover a column to stop it.
        </p>
      </div>
      <Feed groups={skills.slice(0, half)} side="left" />
      <Feed groups={skills.slice(half)} side="right" />
    </Screen>
  );
}
