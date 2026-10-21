import { game } from '../game/state.js';

const COLORS = ['var(--rust)', 'var(--ember)', 'var(--gold)', 'var(--teal)', 'var(--ice)', 'var(--lilac)', 'var(--rose)'];

// Lighting a letter also sends a ripple through the ASCII background.
function pulse(input) {
  const box = input.parentElement.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('ascii:pulse', {
    detail: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
  }));
}

// The name as a row of toggles: click a letter to light it up. Lighting every letter
// starts the mini-game.
function onToggle(event) {
  const input = event.target;
  if (!input.checked) return;
  pulse(input);
  const all = [...input.closest('.name').querySelectorAll('input')];
  if (all.every((letter) => letter.checked)) setTimeout(() => game.start(), 450);
}

export function NameTiles({ words }) {
  let index = 0;
  return (
    <h1 className="name" aria-label={words.join(' ')}>
      {words.map((word) => (
        <span className="name__row" key={word}>
          {[...word].map((char) => {
            const i = index++;
            return (
              <label className="name__letter" key={i} style={{ '--c': COLORS[i % COLORS.length] }}>
                <input
                  type="checkbox"
                  aria-label={`Light up ${char}`}
                  onChange={onToggle}
                />
                <span aria-hidden="true">{char}</span>
              </label>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
