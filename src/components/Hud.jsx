import { useEffect, useRef } from 'react';
import { journey, useJourney } from '../journey.js';
import { profile, sections, transmissions } from '../content/site.js';
import { telemetry } from '../scene/telemetry.js';

const pad = (n, size = 2) => String(n).padStart(size, '0');
const signed = (n) => `${n < 0 ? '−' : '+'}${pad(Math.abs(Math.round(n)), 3)}`;

// Speed, heading and position, rewritten straight into the DOM a few times a second.
function Telemetry({ index }) {
  const speed = useRef(null);
  const heading = useRef(null);
  const position = useRef(null);
  const status = useRef(null);

  useEffect(() => {
    let frame;
    let last = 0;
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 90) return;
      last = now;
      speed.current.textContent = telemetry.speed.toFixed(1).padStart(5, '0');
      heading.current.textContent = `${pad(Math.round((telemetry.heading + 360) % 360), 3)}°`;
      position.current.textContent = `${signed(telemetry.x)} ${signed(telemetry.y)} ${signed(telemetry.z)}`;
      status.current.textContent = telemetry.warp > 0.15 ? 'en route' : 'holding';
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="telemetry" aria-hidden="true">
      <div className="telemetry__row telemetry__row--extra">
        <span>vel <b ref={speed}>000.0</b></span>
        <span>hdg <b ref={heading}>000°</b></span>
        <span>pos <b ref={position}>+000 +000 +000</b></span>
      </div>
      <div className="telemetry__row">
        <span className="telemetry__waypoint">
          wpt <i>{pad(index)}</i>/{pad(sections.length - 1)} · {sections[index].label}
        </span>
        <span ref={status}>holding</span>
      </div>
    </div>
  );
}

export function Hud() {
  const { index, step } = useJourney();
  const section = sections[index];
  const steps = section.steps ?? 1;
  const next = sections[index + 1];

  return (
    <div className="hud" style={{ '--accent': section.accent }}>
      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />

      <header className="hud__top">
        <button className="hud__brand" onClick={() => journey.goTo(0)}>
          {profile.firstName}<span>/</span>{profile.lastName}
        </button>
        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[...transmissions, ...transmissions].map((line, i) => <span key={i}>{line}</span>)}
          </div>
        </div>
        <a className="button" href={profile.resume} target="_blank" rel="noreferrer">resume ↗</a>
      </header>

      <nav aria-label="Sections">
        <ol className="rail">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                className="rail__item"
                aria-current={i === index ? 'step' : undefined}
                onClick={() => journey.goTo(i)}
              >
                <span className="rail__label">{pad(i)} {s.label}</span>
                <span className="rail__mark" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <Telemetry index={index} />

      <button className="hud__next" onClick={() => (next || steps > 1 ? journey.next() : journey.goTo(0))}>
        {steps > 1 && (
          <span className="steps">
            {pad(step + 1)} / {pad(steps)}
            <span className="steps__bar" style={{ '--progress': `${((step + 1) / steps) * 100}%` }} />
          </span>
        )}
        <span>{step < steps - 1 ? 'next' : next ? `next · ${next.label}` : 'back to start'}</span>
        <svg width="9" height="12" viewBox="0 0 9 12" aria-hidden="true">
          <path d={next || step < steps - 1 ? 'M4.5 0v10M1 7l3.5 3.5L8 7' : 'M4.5 12V2M1 5l3.5-3.5L8 5'} stroke="currentColor" fill="none" />
        </svg>
      </button>
    </div>
  );
}
