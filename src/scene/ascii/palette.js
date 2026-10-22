// Every color and glyph choice of the ASCII background lives in this file.

// Size of one character cell in CSS pixels.
export const CELL = {
  desktop: { w: 7, h: 12 },
  mobile: { w: 6, h: 10 },
};

export const FONT = {
  weight: 600,
  scale: 1.0,
};

export const BACKGROUND = '#080a14';
export const RAIN_HEAD = '#dce8ff';
export const DUST = '#262d48';

// How strong the matrix rain is in empty space (0 - 1).
export const RAIN_STRENGTH = 0.55;

// How strong the sun rays are (0 - 1).
export const RAY_STRENGTH = 0.75;

// Every object in the scene renders with one of these sets. The order here is the
// order of GLYPH_SETS below, and it doubles as priority: when two objects share a
// cell, the higher id wins.
export const SET = {
  VOID: 0,
  NEBULA: 1,
  GALAXY: 2,
  STREAK: 3,
  STAR: 4,
  RAY: 5,
  RUST: 6,
  TEAL: 7,
  MOON: 8,
  LILAC: 9,
  ICE: 10,
  EMBER: 11,
  PLASMA: 12,
  FLOWER: 13,
  GLASS: 14,
  SUN: 15,
  SHIP: 16,
};

// Sets from here up are solid: they block sunlight and cast shadow lanes in the rays.
export const FIRST_SOLID = SET.RUST;

export const BANDS = 8;
export const SLOTS = 8;

const RAIN_GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>=+*:;|/\\[]{}#$%&@?!^~0110';

function chunk(str, size) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

// Oriented sets (streak, ray) use bands 0-3 for direction: - / | \
// and bands 4-7 for their bright / faint variants.
//
// bands: dark -> bright. A cell's brightness picks the band, then a random glyph from that band.
// jitter:   how far a cell may wander from its band (organic look)
// scramble: how often a cell re-rolls its glyph, per second
// gamma:    < 1 brightens the midtones
// grain:    random per-cell brightness variation
export const GLYPH_SETS = [
  {
    name: 'void',
    bands: chunk(RAIN_GLYPHS, SLOTS),
    dark: '#141d36', bright: '#6f86b8',
    jitter: 0, scramble: 0, gamma: 1, grain: 0.3,
  },
  {
    name: 'nebula',
    bands: [' ', ' ', '.', '.,', ',:', ':;', ';~', '~*'],
    dark: '#2a0f28', bright: '#e08ab5',
    jitter: 1.2, scramble: 0.05, gamma: 1, grain: 0.4,
  },
  {
    name: 'galaxy',
    bands: [' ', '.', '.', '.:', ':+', '+*', '*#', '@#'],
    dark: '#2a1c4a', bright: '#efdcff',
    jitter: 0.8, scramble: 0.02, gamma: 0.8, grain: 0.3,
  },
  {
    name: 'streak',
    bands: ['-', '/', '|', '\\', '-=', '/', '|!', '\\'],
    dark: '#56689c', bright: '#f6f9ff',
    jitter: 0, scramble: 0, gamma: 1, grain: 0.15,
  },
  {
    name: 'star',
    bands: [' ', '.', '.', '+', '+', '*', '*', '*'],
    dark: '#7a84a8', bright: '#fff6e2',
    jitter: 0, scramble: 0, gamma: 0.8, grain: 0.15,
  },
  {
    name: 'ray',
    bands: ['-', '/', '|', '\\', '.', '.', "'`", '.:'],
    dark: '#3d2a0e', bright: '#ffd889',
    jitter: 0, scramble: 0.3, gamma: 1, grain: 0.3,
  },
  {
    name: 'rust',
    bands: [' ', ' .', '.,:', 'irtcl', 'acenorsuvxz', 'abdeghkpqy', 'AEHKMNRSXZ', '&%#@QB'],
    dark: '#4a1710', bright: '#f06a45',
    jitter: 1.3, scramble: 0.12, gamma: 0.8, grain: 0.35,
  },
  {
    name: 'teal',
    bands: [' ', ' .', ".,'`", "'/\\", '/\\|', '/\\|/\\l', '|/\\lI!', '/\\|lI'],
    dark: '#123832', bright: '#72cfa6',
    jitter: 1.5, scramble: 0.25, gamma: 0.8, grain: 0.35,
  },
  {
    name: 'moon',
    bands: [' ', '.', '.:', ':-~', '=+', '*o+', '#%&', '@$&'],
    dark: '#2b3146', bright: '#f2eee5',
    jitter: 0.7, scramble: 0.04, gamma: 0.85, grain: 0.2,
  },
  {
    name: 'lilac',
    bands: [' ', '.', '.-', '-~', '~=-', '=+~', '#=%', '@#'],
    dark: '#1f2650', bright: '#bcc8ff',
    jitter: 0.8, scramble: 0.03, gamma: 0.85, grain: 0.25,
  },
  {
    name: 'ice',
    bands: [' ', '.', '.:', ':-', '-=+', '*+', '*#', '#@'],
    dark: '#12364a', bright: '#c9f2ff',
    jitter: 0.8, scramble: 0.05, gamma: 0.85, grain: 0.25,
  },
  {
    name: 'ember',
    bands: [' ', '.', '.o', 'oe', 'e69o', '86@e', '@&8', '@'],
    dark: '#5a2008', bright: '#ffa14a',
    jitter: 1.0, scramble: 0.6, gamma: 0.7, grain: 0.25,
  },
  {
    // the ship's thrusters and their exhaust: deep electric blue, brightest at the nozzles
    // (the ASCII pass also gives these a wide glow)
    name: 'plasma',
    bands: [' ', '.', '.:', ':+', '+*', '*#', '#@', '@#'],
    dark: '#1f4bff', bright: '#74b9ff',
    jitter: 0.8, scramble: 1.2, gamma: 0.6, grain: 0.2,
  },
  {
    name: 'flower',
    bands: [' ', '.', 'o', 'o', 'o.', 'o', 'oo0', 'o'],
    dark: '#8f97ad', bright: '#ffffff',
    jitter: 0, scramble: 0, gamma: 1, grain: 0.2,
  },
  {
    name: 'glass',
    bands: [' ', '.', '-', '=', '~=', '=*', '*', '#'],
    dark: '#0d4a52', bright: '#8ff4ff',
    jitter: 0.5, scramble: 0.2, gamma: 0.8, grain: 0.2,
  },
  {
    name: 'sun',
    bands: [' ', '.', ':', '+*', '*#', '#%@', '@#', '@'],
    dark: '#8a3c0a', bright: '#fff3c4',
    jitter: 0.8, scramble: 1.5, gamma: 0.7, grain: 0.2,
  },
  {
    name: 'ship',
    bands: [' ', '.', ':', '-=', '+*', '#%', '%&#', '@'],
    dark: '#56627e', bright: '#ffffff',
    jitter: 0.5, scramble: 0, gamma: 0.75, grain: 0.15,
  },
];
