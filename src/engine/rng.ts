// Seeded RNG (§5 of CLAUDE.md). All randomness in the engine flows through here so
// the same seed + same actions always reproduce the same game (replays, save/resume,
// future server-side anti-cheat). NEVER call Math.random() in engine/ or data/.

import type { DieFace } from './types';

/** mulberry32 — a small, fast, deterministic PRNG. Returns a float in [0, 1). */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert an arbitrary string seed to a 32-bit integer (xfnv1a). */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * A deterministic RNG positioned at a cursor. The cursor advances on every draw and
 * is stored back in GameState, so randomness is fully reproducible. Construct with the
 * run seed and the current cursor; read .cursor afterward to persist progress.
 */
export class Rng {
  private state: number;
  cursor: number;

  constructor(seed: string, cursor = 0) {
    const base = hashSeed(seed);
    // Fast-forward the stream to the cursor position so resuming is exact.
    this.state = (base + cursor) >>> 0;
    this.cursor = cursor;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.cursor += 1;
    const gen = mulberry32((this.state + this.cursor) >>> 0);
    return gen();
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Integer in [min, max] inclusive. */
  range(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  /** Roll one Combat Die: Hit, Hit, Crit, Miss, Miss, Surge (§0). */
  rollDie(): DieFace {
    const faces: DieFace[] = ['hit', 'hit', 'crit', 'miss', 'miss', 'surge'];
    return faces[this.int(6)];
  }

  /** Roll N Combat Dice. */
  rollDice(n: number): DieFace[] {
    const out: DieFace[] = [];
    for (let i = 0; i < n; i++) out.push(this.rollDie());
    return out;
  }

  /** Fisher–Yates shuffle (returns a new array; does not mutate input). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Pick one element. */
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(arr.length)];
  }
}

/**
 * Helper for reducers: run a function with an Rng seeded from state, returning the
 * result alongside the new cursor so callers can write it back into GameState.
 */
export function withRng<T>(
  seed: string,
  cursor: number,
  fn: (rng: Rng) => T,
): { value: T; cursor: number } {
  const rng = new Rng(seed, cursor);
  const value = fn(rng);
  return { value, cursor: rng.cursor };
}
