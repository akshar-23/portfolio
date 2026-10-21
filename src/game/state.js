import { useSyncExternalStore } from 'react';

// The mini-game, as the page and the scene both see it.
//   off       the portfolio is showing
//   countdown 3, 2, 1: flying, nothing to hit yet
//   playing   rocks and rings
//   over      the ship is gone; score, best, retry
// The scene does the flying and the scoring; this only holds the state.

const BEST_KEY = 'ascii-run-best';

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // private windows and blocked storage: the best just won't be kept
  }
}

export const SHIELDS = 3;

let snapshot = {
  status: 'off',
  countdown: 0,
  shields: SHIELDS,
  rings: 0,
  loops: 0,
  final: 0,
  best: readBest(),
  newBest: false,
};
const listeners = new Set();

// numbers that change every frame; the HUD reads them in its own animation frame
export const live = { score: 0, distance: 0, speed: 0 };

function set(patch) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

export const game = {
  get: () => snapshot,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  // for the scene: shields, rings, loops and the countdown
  update: set,
  get active() {
    return snapshot.status !== 'off';
  },
  start() {
    if (snapshot.status !== 'off' && snapshot.status !== 'over') return;
    live.score = 0;
    live.distance = 0;
    set({ status: 'countdown', countdown: 3, shields: SHIELDS, rings: 0, loops: 0, newBest: false });
  },
  play() {
    if (snapshot.status === 'countdown') set({ status: 'playing', countdown: 0 });
  },
  finish() {
    if (snapshot.status !== 'playing') return;
    const final = Math.floor(live.score);
    const newBest = final > snapshot.best;
    if (newBest) saveBest(final);
    set({ status: 'over', final, newBest, best: Math.max(final, snapshot.best) });
  },
  quit() {
    if (snapshot.status !== 'off') set({ status: 'off' });
  },
};

export function useGame() {
  return useSyncExternalStore(game.subscribe, game.get);
}
