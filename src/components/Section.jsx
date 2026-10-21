import { sections } from '../content/site.js';
import { ScrambleText } from './ScrambleText.jsx';

// A page section and a station on the ship's route (data-station). align puts the
// content on the side away from that station's planet.
export function Section({ id, title, align = 'left', wide = false, children }) {
  const index = sections.findIndex((s) => s.id === id);
  return (
    <section
      id={id}
      className={`section section--${align}${wide ? ' section--wide' : ''}`}
      data-station
      style={{ '--accent': sections[index].accent }}
    >
      <div className="section__inner">
        <div className="section__content">
          <header className="section-head reveal">
            <span className="section-head__index">// {String(index).padStart(2, '0')}</span>
            <ScrambleText as="h2" className="section-head__title" text={title} />
            <span className="section-head__rule" aria-hidden="true" />
          </header>
          {children}
        </div>
      </div>
    </section>
  );
}
