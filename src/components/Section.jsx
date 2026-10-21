import { useJourney } from '../journey.js';
import { sections } from '../content/site.js';
import { ScrambleText } from './ScrambleText.jsx';

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

export function Section({ id, title, align = 'left', wide = false, children }) {
  const index = sections.findIndex((s) => s.id === id);
  const { active } = useActive(id);
  return (
    <Screen id={id} className={`section--${align}${wide ? ' section--wide' : ''}`}>
      <div className="section__inner">
        <div className="section__content">
          <header className="section-head reveal">
            <span className="section-head__index">// {String(index).padStart(2, '0')}</span>
            <ScrambleText as="h2" className="section-head__title" text={title} play={active} />
            <span className="section-head__rule" aria-hidden="true" />
          </header>
          {children}
        </div>
      </div>
    </Screen>
  );
}
