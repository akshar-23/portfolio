// Where the page's content is on screen, so the scene can work around it: the glyphs
// dim under it, and the ship flies to the biggest empty spot.

const MAX_BLOCKS = 8;

export const layout = {
  // css px, { left, top, right, bottom }
  blocks: [],
  // the emptiest point on screen, css px
  free: { x: window.innerWidth * 0.62, y: window.innerHeight * 0.62 },
};

function hudInsets() {
  const read = (name, fallback) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`;
    document.body.appendChild(probe);
    const value = probe.getBoundingClientRect().width || fallback;
    probe.remove();
    return value;
  };
  return {
    x: read('--hud-x', 40) + 70,
    top: read('--hud-top', 80) + 30,
    bottom: read('--hud-bottom', 90) + 20,
  };
}

// distance from a point to a box, 0 inside it
function distance(x, y, box) {
  const dx = Math.max(box.left - x, 0, x - box.right);
  const dy = Math.max(box.top - y, 0, y - box.bottom);
  return Math.hypot(dx, dy);
}

function findFree(blocks, insets) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const left = insets.x;
  const right = w - insets.x;
  // the ship stays in the lower part of the screen, below the horizon of a chase camera;
  // the upper part is where each section's planet sits
  const top = Math.max(insets.top, h * 0.5);
  const bottom = h - insets.bottom;
  let best = { x: (left + right) / 2, y: (top + bottom) / 2, score: -Infinity };
  const COLS = 28;
  const ROWS = 18;
  for (let i = 0; i <= COLS; i++) {
    for (let j = 0; j <= ROWS; j++) {
      const x = left + ((right - left) * i) / COLS;
      const y = top + ((bottom - top) * j) / ROWS;
      const edge = Math.min(x - left, right - x) * 1.2 + Math.min(y - top, bottom - y) * 0.6 + 40;
      const clear = blocks.reduce((min, box) => Math.min(min, distance(x, y, box)), Infinity);
      const score = Math.min(clear, edge);
      if (score > best.score) best = { x, y, score };
    }
  }
  return best;
}

export function measureLayout() {
  const elements = document.querySelectorAll('.section[data-active="true"] [data-block]');
  const blocks = [];
  for (const el of elements) {
    const box = el.getBoundingClientRect();
    if (box.width < 4 || box.height < 4) continue;
    blocks.push({ left: box.left, top: box.top, right: box.right, bottom: box.bottom });
    if (blocks.length === MAX_BLOCKS) break;
  }
  layout.blocks = blocks;
  layout.free = findFree(blocks, hudInsets());
  return layout;
}

export { MAX_BLOCKS };
