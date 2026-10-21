// How much bigger the interface (text, HUD, glyph cells) gets on big screens. The design
// is drawn for about 1600 x 1000; smaller screens stay at 1, bigger ones grow with the
// shorter side, in steps of 0.05.
export function uiScale(width = window.innerWidth, height = window.innerHeight) {
  const fit = Math.min(width / 1600, height / 1000);
  return Math.round(Math.min(Math.max(fit, 1), 1.45) * 20) / 20;
}
