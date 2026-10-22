// Content never scrolls or gets cut off: a [data-fit] box that's taller than the room
// it has is drawn smaller (css zoom) until it fits. Its css caps its height (max-height,
// or a flex share), so at zoom 1 clientHeight is the room and scrollHeight is the need.
// Below MIN it would stop being readable; it scrolls instead, which should only happen
// on phones held sideways.

const MIN = 0.62;

function fitBox(box) {
  box.style.zoom = '';
  box.dataset.fitScroll = 'false';
  const room = box.clientHeight;
  const need = box.scrollHeight;
  if (need <= room + 1) return;
  const zoom = Math.floor((room / need) * 100) / 100;
  box.style.zoom = String(Math.max(zoom, MIN));
  if (zoom < MIN) box.dataset.fitScroll = 'true';
}

export function fitContent(root = document) {
  root.querySelectorAll('.section[data-active="true"] [data-fit]').forEach(fitBox);
}
