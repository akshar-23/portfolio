import { journey, useJourney } from '../journey.js';
import { sections } from '../content/site.js';
import { ScrambleText } from './ScrambleText.jsx';

export const pad = (n) => String(n).padStart(2, '0');

// One screen of the page and a waypoint on the ship's route. Only the active one is
// shown; the rest are inert so keyboard focus can't wander into them.
export function Screen({ id, className = '', children }) {
  const { index } = useJourney();
  const me = sections.findIndex((s) => s.id === id);
  const active = me === index;
  return (
    <section
      id={id}
      className={`section ${className}`}
      data-active={active}
      inert={!active}
      aria-hidden={!active}
      style={{ '--accent': sections[me].accent }}
    >
      {children}
    </section>
  );
}

export function useActive(id) {
  const { index, step } = useJourney();
  const active = sections[index].id === id;
  return { active, step: active ? step : 0 };
}

// WPT 02 / 06 over a scrambling title
export function SectionHead({ id, title, className = '' }) {
  const index = sections.findIndex((s) => s.id === id);
  const { active } = useActive(id);
  return (
    <header className={`head reveal ${className}`}>
      <span className="head__index">wpt {pad(index)} / {pad(sections.length - 1)}</span>
      <ScrambleText as="h2" className="head__title" text={title} play={active} />
    </header>
  );
}

// a numbered list of the steps in a section; the current one is lit
export function StepLog({ id, items, step }) {
  return (
    <ol className="log reveal" style={{ '--i': 1 }}>
      {items.map((item, i) => (
        <li key={item.key}>
          <button className="log__item" aria-current={i === step ? 'step' : undefined} onClick={() => journey.goTo(id, i)}>
            <span className="log__index">{pad(i + 1)}</span>
            <span className="log__name">{item.name}</span>
            <span className="log__meta">{item.meta}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
