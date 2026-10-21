import { useSyncExternalStore } from 'react';
import { sections } from './content/site.js';

// Where we are: one section (waypoint) at a time, and inside sections with steps,
// one step at a time. The page doesn't scroll; the wheel, swipes, keys and the
// waypoint rail move this, and both the content and the ship follow it.

let state = { index: 0, step: 0, direction: 1 };
let locked = false;
const listeners = new Set();

const stepsOf = (index) => sections[index].steps ?? 1;

function set(index, step) {
  index = Math.max(0, Math.min(sections.length - 1, index));
  step = Math.max(0, Math.min(stepsOf(index) - 1, step));
  if (index === state.index && step === state.step) return false;
  const direction = index > state.index || (index === state.index && step > state.step) ? 1 : -1;
  state = { index, step, direction };
  listeners.forEach((listener) => listener());
  return true;
}

export const journey = {
  get: () => state,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  goTo(id, step = 0) {
    const index = typeof id === 'number' ? id : sections.findIndex((s) => s.id === id);
    return index >= 0 && set(index, step);
  },
  next() {
    const { index, step } = state;
    return step < stepsOf(index) - 1 ? set(index, step + 1) : set(index + 1, 0);
  },
  prev() {
    const { index, step } = state;
    return step > 0 ? set(index, step - 1) : set(index - 1, stepsOf(index - 1) - 1);
  },
  // while a project is open, the wheel and keys belong to it
  lock(value) {
    locked = value;
  },
  get locked() {
    return locked;
  },
  // 0 at the first waypoint, 1 at the last; steps move a little way toward the next one
  progress() {
    const steps = stepsOf(state.index);
    const along = steps > 1 ? (state.step / (steps - 1)) * 0.35 : 0;
    return (state.index + along) / (sections.length - 1);
  },
};

export function useJourney() {
  return useSyncExternalStore(journey.subscribe, journey.get);
}

// Wheel, touch and keyboard input. One gesture moves one step: after a move, input is
// ignored until the transition is done and the trackpad's momentum has died down.
// Content that doesn't fit its screen sits in a [data-scroll] box: it scrolls first,
// and the next gesture past its end moves on.
const SECTION_GAP = 900;
const STEP_GAP = 450;

function scroller(target) {
  return target instanceof Element ? target.closest('[data-scroll]') : null;
}

// can this box still scroll that way?
function canScroll(box, down) {
  if (!box || box.scrollHeight <= box.clientHeight + 1) return false;
  return down ? box.scrollTop + box.clientHeight < box.scrollHeight - 1 : box.scrollTop > 0;
}

export function attachInput(target = window) {
  let lockedUntil = 0;
  let lastWheel = 0;
  let wheelSum = 0;
  let touch = null;

  const move = (forward) => {
    const before = state.index;
    const moved = forward ? journey.next() : journey.prev();
    if (moved) lockedUntil = performance.now() + (state.index === before ? STEP_GAP : SECTION_GAP);
  };

  const onWheel = (event) => {
    if (locked || event.ctrlKey) return;
    const now = performance.now();
    const streaming = now - lastWheel < 150;
    lastWheel = now;
    if (canScroll(scroller(event.target), event.deltaY > 0)) {
      // let the box scroll, and don't let its momentum spill into a move
      lockedUntil = Math.max(lockedUntil, now + 250);
      wheelSum = 0;
      return;
    }
    event.preventDefault();
    if (now < lockedUntil) {
      // momentum keeps sending events after the fingers stop: wait for a pause
      if (streaming) lockedUntil = Math.max(lockedUntil, now + 150);
      wheelSum = 0;
      return;
    }
    wheelSum += event.deltaY;
    if (Math.abs(wheelSum) > 24) {
      move(wheelSum > 0);
      wheelSum = 0;
    }
  };

  const onKey = (event) => {
    if (locked || event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const forward = ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.shiftKey;
    const back = ['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey);
    if (event.key === 'Home') journey.goTo(0);
    else if (event.key === 'End') journey.goTo(sections.length - 1);
    else if (forward || back) {
      event.preventDefault();
      if (performance.now() >= lockedUntil) move(forward);
    }
  };

  const onTouchStart = (event) => {
    const box = scroller(event.target);
    touch = { y: event.touches[0].clientY, box, top: box?.scrollTop ?? 0 };
  };
  const onTouchMove = (event) => {
    if (locked || !touch) return;
    const down = touch.y > event.touches[0].clientY;
    if (!canScroll(touch.box, down)) event.preventDefault();
  };
  const onTouchEnd = (event) => {
    if (locked || !touch) return;
    const dy = touch.y - event.changedTouches[0].clientY;
    const scrolled = touch.box && touch.box.scrollTop !== touch.top;
    touch = null;
    if (!scrolled && Math.abs(dy) > 50 && performance.now() >= lockedUntil) move(dy > 0);
  };

  target.addEventListener('wheel', onWheel, { passive: false });
  target.addEventListener('keydown', onKey);
  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchmove', onTouchMove, { passive: false });
  target.addEventListener('touchend', onTouchEnd);
  return () => {
    target.removeEventListener('wheel', onWheel);
    target.removeEventListener('keydown', onKey);
    target.removeEventListener('touchstart', onTouchStart);
    target.removeEventListener('touchmove', onTouchMove);
    target.removeEventListener('touchend', onTouchEnd);
  };
}
