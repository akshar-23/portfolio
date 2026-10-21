import { useMemo } from 'react';

const RAMP = ' .:-=+*#%@';

function seeded(text) {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// A little ASCII planet, different for every seed, for projects without a cover image.
function drawPlanet(seed, cols = 60, rows = 26) {
  const rand = seeded(seed);
  const light = [rand() * 1.6 - 0.8, rand() * 0.8 + 0.2, 0.8];
  const length = Math.hypot(...light);
  light.forEach((v, i) => { light[i] = v / length; });
  const ringed = rand() > 0.4;
  const tilt = rand() * 0.6 - 0.3;
  const bands = 4 + rand() * 8;
  const phase = rand() * 10;
  const radius = 0.7;

  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      // a Martian Mono cell is about 0.75 as wide as it is tall
      const u = ((x - cols / 2 + 0.5) / (rows / 2)) * 0.75;
      const v = (rows / 2 - y - 0.5) / (rows / 2);
      const d2 = u * u + v * v;

      // ring: a thin tilted ellipse, hidden where the planet is in front of it
      const ru = u * Math.cos(tilt) - v * Math.sin(tilt);
      const rv = u * Math.sin(tilt) + v * Math.cos(tilt);
      const ring = ringed && Math.abs(rv) < 0.07 + Math.abs(ru) * 0.05 && Math.abs(ru) > radius * 1.12 && Math.abs(ru) < radius * 1.7;

      if (d2 < radius * radius && !(ring && rv < 0)) {
        const z = Math.sqrt(radius * radius - d2);
        const n = [u / radius, v / radius, z / radius];
        const diffuse = Math.max(n[0] * light[0] + n[1] * light[1] + n[2] * light[2], 0);
        const band = 0.12 * Math.sin(v * bands + phase + Math.sin(u * 6) * 0.6);
        const lum = Math.min(Math.max(diffuse * 0.9 + 0.08 + band, 0), 0.999);
        line += RAMP[Math.floor(lum * RAMP.length)];
      } else if (ring) {
        line += rand() > 0.3 ? '-' : '=';
      } else {
        const r = rand();
        line += r < 0.012 ? '+' : r < 0.03 ? '.' : ' ';
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function AsciiCover({ seed }) {
  const art = useMemo(() => drawPlanet(seed), [seed]);
  return <pre className="ascii-cover" aria-hidden="true">{art}</pre>;
}
