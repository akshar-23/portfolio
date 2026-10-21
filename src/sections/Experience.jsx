import { Screen, SectionHead, StepLog, useActive } from '../components/Section.jsx';
import { ScrambleText } from '../components/ScrambleText.jsx';
import { experience } from '../content/site.js';

// One role per step; the log above lists them all.
export function Experience() {
  const { active, step } = useActive('experience');
  const job = experience[step];
  return (
    <Screen id="experience" className="experience">
      <div className="col" data-scroll data-block>
        <SectionHead id="experience" title="Experience" />
        <StepLog
          id="experience"
          step={step}
          items={experience.map((j) => ({ key: j.company + j.role, name: j.company, meta: j.when.split('—')[0].trim() }))}
        />
        <article className="detail reveal" style={{ '--i': 2 }} key={step}>
          <span className="detail__when">{job.when} · {job.where}</span>
          <ScrambleText as="h3" className="detail__title" text={job.role} play={active} delay={active ? 120 : 450} />
          <p className="detail__sub">{job.company}</p>
          <ul className="points">
            {job.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
          <ul className="chips">
            {job.tags.map((tag) => <li className="chip" key={tag}>{tag}</li>)}
          </ul>
        </article>
      </div>
    </Screen>
  );
}
