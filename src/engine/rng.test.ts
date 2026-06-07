import { describe, it, expect } from 'vitest';
import { Rng, hashSeed } from './rng';

describe('Rng', () => {
  it('is deterministic for the same seed + cursor', () => {
    const a = new Rng('nightfall', 0);
    const b = new Rng('nightfall', 0);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    const a = Array.from({ length: 20 }, (_, i) => new Rng('a', i).next());
    const b = Array.from({ length: 20 }, (_, i) => new Rng('b', i).next());
    expect(a).not.toEqual(b);
  });

  it('rolls only valid Combat Die faces', () => {
    const rng = new Rng('dice', 0);
    const faces = rng.rollDice(600);
    for (const f of faces) expect(['hit', 'crit', 'miss', 'surge']).toContain(f);
  });

  it('produces the documented face distribution (2 hit, 1 crit, 2 miss, 1 surge)', () => {
    const rng = new Rng('distribution', 0);
    const counts = { hit: 0, crit: 0, miss: 0, surge: 0 };
    const N = 60000;
    for (let i = 0; i < N; i++) counts[rng.rollDie()]++;
    // Hit ≈ 2/6, Crit ≈ 1/6, Miss ≈ 2/6, Surge ≈ 1/6.
    expect(counts.hit / N).toBeCloseTo(2 / 6, 1);
    expect(counts.crit / N).toBeCloseTo(1 / 6, 1);
    expect(counts.miss / N).toBeCloseTo(2 / 6, 1);
    expect(counts.surge / N).toBeCloseTo(1 / 6, 1);
  });

  it('shuffle is a permutation and does not mutate the input', () => {
    const rng = new Rng('shuffle', 0);
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(input);
    expect(out.slice().sort()).toEqual(input.slice().sort());
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('hashSeed is stable', () => {
    expect(hashSeed('seed')).toBe(hashSeed('seed'));
  });
});
