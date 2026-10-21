// Little dot-matrix icons, drawn from 7x7 patterns (# = dot).
const PATTERNS = {
  grid: ['#.#.#.#', '.......', '#.###.#', '..#.#..', '#.###.#', '.......', '#.#.#.#'],
  blend: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  solve: ['#######', '#.....#', '#.#.#.#', '#..#..#', '#.#.#.#', '#.....#', '#######'],
  lab: ['...#...', '..###..', '...#...', '.#####.', '#.....#', '#.###.#', '.#####.'],
  signal: ['#......', '.#.....', '..#.#..', '...#.#.', '..#.#..', '.#.....', '#......'],
};

export function PixelIcon({ name }) {
  const rows = PATTERNS[name] ?? PATTERNS.grid;
  return (
    <svg className="pixel" viewBox="0 0 14 14" aria-hidden="true">
      {rows.flatMap((row, y) => [...row].map((cell, x) => (
        cell === '#' ? <rect key={`${x}-${y}`} x={x * 2 + 0.3} y={y * 2 + 0.3} width="1.4" height="1.4" /> : null
      )))}
    </svg>
  );
}
