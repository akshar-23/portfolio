import { useEffect, useRef } from 'react';
import { SHIELDS, game, live, useGame } from '../game/state.js';
import { journey } from '../journey.js';
import { profile } from '../content/site.js';
import { ScrambleText } from './ScrambleText.jsx';

const digits = (n, size = 6) => String(Math.floor(n)).padStart(size, '0');

// score and speed change every frame: written straight into the DOM
function useLive(ref, read) {
  useEffect(() => {
    let frame;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (ref.current) ref.current.textContent = read();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ref, read]);
}

const readScore = () => digits(live.score);
const readSpeed = () => live.speed.toFixed(1).padStart(5, '0');
const readDistance = () => `${digits(live.distance, 5)} u`;

function Shields({ count }) {
  return (
    <span className="game-shields" aria-label={`${count} of ${SHIELDS} shields`}>
      {Array.from({ length: SHIELDS }, (_, i) => (
        <i key={i} data-on={i < count} aria-hidden="true" />
      ))}
    </span>
  );
}

function Countdown({ value }) {
  return (
    <div className="game-center" aria-live="polite">
      <span className="game-countdown" key={value}>{value}</span>
      <p className="game-hint">dodge the rocks · fly through the rings</p>
      <p className="label">mouse · drag · wasd / arrows to steer — esc to quit</p>
    </div>
  );
}

function Over({ state }) {
  const leave = (section) => {
    game.quit();
    if (section) journey.goTo(section);
  };
  return (
    <div className="game-center game-over" role="dialog" aria-label="Game over">
      <span className="label game-over__tag">// transmission ended</span>
      <ScrambleText as="h2" className="game-over__title" text="Signal lost" delay={200} />
      <p className="game-over__score">{digits(state.final)}</p>
      <p className="label game-over__best">
        {state.newBest ? <b>new best</b> : <>best · {digits(state.best)}</>}
      </p>
      <dl className="game-over__stats">
        <div><dt>rings</dt><dd>{state.rings}</dd></div>
        <div><dt>loops</dt><dd>{state.loops}</dd></div>
        <div><dt>distance</dt><dd>{Math.floor(live.distance)} u</dd></div>
      </dl>
      <div className="game-over__actions">
        <button className="button button--accent" onClick={() => game.start()} autoFocus>retry</button>
        <button className="button" onClick={() => leave()}>back to portfolio</button>
      </div>
      <p className="game-over__links">
        <a href={profile.resume} target="_blank" rel="noreferrer">resume ↗</a>
        <button onClick={() => leave('contact')}>get in touch →</button>
      </p>
    </div>
  );
}

export function GameHud() {
  const state = useGame();
  const score = useRef(null);
  const speed = useRef(null);
  const distance = useRef(null);
  useLive(score, readScore);
  useLive(speed, readSpeed);
  useLive(distance, readDistance);

  return (
    <div className="hud hud--game" data-status={state.status}>
      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />

      <header className="hud__top">
        <span className="hud__brand">ascii<span>/</span>run</span>
        <span className="game-score"><span className="label">score</span><b ref={score}>000000</b></span>
        <button className="button" onClick={() => game.quit()}>esc · quit</button>
      </header>

      <div className="telemetry game-telemetry">
        <div className="telemetry__row">
          <span>shields</span>
          <Shields count={state.shields} />
          <span>rings <b>{String(state.rings).padStart(2, '0')}</b></span>
        </div>
        <div className="telemetry__row telemetry__row--extra">
          <span>vel <b ref={speed}>000.0</b></span>
          <span>dist <b ref={distance}>00000 u</b></span>
          <span>loop <b>{String(state.loops + 1).padStart(2, '0')}</b></span>
        </div>
      </div>

      <span className="hud__next game-best">best · {digits(state.best)}</span>

      {state.status === 'countdown' && <Countdown value={state.countdown} />}
      {state.status === 'over' && <Over state={state} />}
    </div>
  );
}
