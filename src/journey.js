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

// Wheel, touch and keyboard input. Each intent to scroll moves one step, and intents
// that come in while a move is still playing are queued (one deep), so fast repeated
// scrolling keeps moving instead of being swallowed. A trackpad's momentum isn't an
// intent: its deltas only shrink. A new push shows up as a pause, a change of
// direction or deltas rising again after they had been falling.
// Content that doesn't fit its screen sits in a [data-scroll] box: it scrolls first,
// and the next gesture past its end moves on.
const SECTION_GAP = 650;
const STEP_GAP = 380;
// a steady stream (a spinning mouse wheel, a finger held on the pad) repeats this often
const REPEAT = 520;

function scroller(target) {
  return target instanceof Element ? target.closest('[data-scroll]') : null;
}

// can this box still scroll that way?
function canScroll(box, down) {
  if (!box || box.scrollHeight <= box.clientHeight + 1) return false;
  if (!/(auto|scroll)/.test(getComputedStyle(box).overflowY)) return false;
  return down ? box.scrollTop + box.clientHeight < box.scrollHeight - 1 : box.scrollTop > 0;
}

export function attachInput(target = window) {
  let lockedUntil = 0;
  let pending = 0;
  let timer = 0;
  let touch = null;
  // the current wheel gesture
  const wheel = { last: 0, dir: 0, prev: 0, peak: 0, decayed: false, sum: 0, fired: 0 };

  const now = () => performance.now();

  function move(forward) {
    const before = state.index;
    const moved = forward ? journey.next() : journey.prev();
    if (moved) lockedUntil = now() + (state.index === before ? STEP_GAP : SECTION_GAP);
  }

  // queued moves: +n forward, -n back (up to 3); changing direction starts over
  function drain() {
    timer = 0;
    if (!pending || locked) {
      pending = 0;
      return;
    }
    const forward = pending > 0;
    pending -= Math.sign(pending);
    move(forward);
    if (pending) timer = setTimeout(drain, Math.max(lockedUntil - now(), 0));
  }

  // move now, or as soon as the moves before it are done
  function request(forward) {
    const dir = forward ? 1 : -1;
    if (Math.sign(pending) !== dir) pending = 0;
    if (!pending && now() >= lockedUntil) {
      move(forward);
      return;
    }
    pending = Math.max(-3, Math.min(3, pending + dir));
    if (!timer) timer = setTimeout(drain, Math.max(lockedUntil - now(), 0));
  }

  const onWheel = (event) => {
    if (locked || event.ctrlKey) return;
    const t = now();
    const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1);
    if (dy === 0) return;
    if (canScroll(scroller(event.target), dy > 0)) {
      // let the box scroll; its momentum shouldn't spill into a move
      wheel.fired = t;
      wheel.sum = 0;
      return;
    }
    event.preventDefault();

    const dir = Math.sign(dy);
    const size = Math.abs(dy);
    const fresh = t - wheel.last > 200
      || dir !== wheel.dir
      || (wheel.decayed && size > wheel.prev * 1.4 + 2);
    if (fresh) {
      Object.assign(wheel, { dir, peak: size, decayed: false, sum: 0, fired: 0 });
    } else {
      wheel.peak = Math.max(wheel.peak, size);
      if (size < wheel.peak * 0.55) wheel.decayed = true;
    }
    wheel.last = t;
    wheel.prev = size;
    wheel.sum += dy;

    const steady = wheel.fired && !wheel.decayed && t - wheel.fired > REPEAT;
    if ((!wheel.fired && Math.abs(wheel.sum) > 20) || steady) {
      wheel.fired = t;
      request(dir > 0);
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
      // held keys repeat on their own; don't let them pile up behind a move
      if (!event.repeat || now() >= lockedUntil) request(forward);
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
    if (!scrolled && Math.abs(dy) > 50) request(dy > 0);
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
