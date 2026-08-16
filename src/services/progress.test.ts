import { describe, it, expect, beforeEach } from 'vitest';
import {
  emptyProgress,
  isUnlocked,
  unlockedCharacterIds,
  personalPool,
  validateDeck,
  loadProgress,
  saveProgress,
  loadDecks,
  saveDecks,
  PERSONAL_SLOTS,
} from './progress';

describe('unlocks (§9)', () => {
  it('starter content is always unlocked; progression gates on lord kills', () => {
    expect(isUnlocked(undefined, emptyProgress)).toBe(true);
    expect(isUnlocked({ kind: 'starter' }, emptyProgress)).toBe(true);
    expect(isUnlocked({ kind: 'progression', afterLordKills: 2 }, emptyProgress)).toBe(false);
    expect(isUnlocked({ kind: 'progression', afterLordKills: 2 }, { ...emptyProgress, lordKills: 2 })).toBe(true);
  });

  it('fresh players see the six founding hunters but not Colette or Augustin', () => {
    const ids = unlockedCharacterIds(emptyProgress);
    expect(ids.has('trapper')).toBe(true);
    expect(ids.has('sister_colette')).toBe(false);
    expect(ids.has('augustin')).toBe(false);
    const veteran = unlockedCharacterIds({ ...emptyProgress, lordKills: 2 });
    expect(veteran.has('sister_colette')).toBe(true);
    expect(veteran.has('augustin')).toBe(true);
  });
});

describe('deck building (§9)', () => {
  it("a fresh Ezra pool is only his own cards; Colette's unlock adds her variants", () => {
    const fresh = personalPool('pere_ezra', emptyProgress).map((c) => c.id);
    expect(fresh).toEqual(expect.arrayContaining(['greater_heal', 'blessing', 'consecrate_ground']));
    expect(fresh).not.toContain('pyre');

    const veteran = personalPool('pere_ezra', { ...emptyProgress, lordKills: 1 }).map((c) => c.id);
    expect(veteran).toContain('pyre'); // Colette's card, now a legal variant
  });

  it('validates slot count, pool membership and duplicates', () => {
    const ok = {
      id: 'd1',
      name: 'Test',
      characterId: 'pere_ezra',
      cardIds: ['greater_heal', 'blessing', 'consecrate_ground'],
    };
    expect(validateDeck(ok, emptyProgress)).toEqual([]);
    expect(ok.cardIds).toHaveLength(PERSONAL_SLOTS);

    expect(validateDeck({ ...ok, cardIds: ['greater_heal'] }, emptyProgress)).not.toEqual([]);
    expect(validateDeck({ ...ok, cardIds: ['greater_heal', 'greater_heal', 'blessing'] }, emptyProgress)).not.toEqual([]);
    // Colette's pyre is not in Ezra's pool until she's unlocked.
    expect(validateDeck({ ...ok, cardIds: ['pyre', 'blessing', 'consecrate_ground'] }, emptyProgress)).not.toEqual([]);
    expect(
      validateDeck({ ...ok, cardIds: ['pyre', 'blessing', 'consecrate_ground'] }, { ...emptyProgress, lordKills: 1 }),
    ).toEqual([]);
  });
});

describe('persistence round-trips through localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('progress', () => {
    expect(loadProgress()).toEqual(emptyProgress);
    saveProgress({ ...emptyProgress, lordKills: 5, wins: 1 });
    expect(loadProgress().lordKills).toBe(5);
    expect(loadProgress().wins).toBe(1);
  });

  it('decks', () => {
    expect(loadDecks()).toEqual([]);
    const deck = { id: 'd1', name: 'Bayou Ranger', characterId: 'trapper', cardIds: ['bear_trap', 'called_shot', 'steady_aim'] };
    saveDecks([deck]);
    expect(loadDecks()).toEqual([deck]);
  });
});
