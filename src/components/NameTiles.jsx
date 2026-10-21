const COLORS = ['var(--rust)', 'var(--ember)', 'var(--gold)', 'var(--teal)', 'var(--ice)', 'var(--lilac)', 'var(--rose)'];

// Lighting a letter also sends a ripple through the ASCII background.
function pulse(input) {
  const box = input.parentElement.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent('ascii:pulse', {
    detail: { x: box.left + box.width / 2, y: box.top + box.height / 2 },
  }));
}

// The name as a row of toggles: click a letter to light it up.
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
                  onChange={(event) => event.target.checked && pulse(event.target)}
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
