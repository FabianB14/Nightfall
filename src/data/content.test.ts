import { describe, it, expect } from 'vitest';
import { validateContent, cards, characters, archetypes, lords } from './index';
import { buildDeck } from '@engine/createGame';

describe('content', () => {
  it('validates against the schemas and referential checks', () => {
    expect(() => validateContent()).not.toThrow();
  });

  it('has the six founding archetypes', () => {
    expect(archetypes.map((a) => a.id).sort()).toEqual(
      ['conjurer', 'cursed', 'devout', 'maker', 'marksman', 'revenant'].sort(),
    );
  });

  it('has the eight characters', () => {
    expect(characters).toHaveLength(8);
  });

  it('has the six Vampire Lords', () => {
    expect(lords).toHaveLength(6);
  });

  it('builds ~10-card decks (spine 6 + inherent + personals + ultimate)', () => {
    for (const ch of characters) {
      const deck = buildDeck(ch.id);
      expect(deck.length).toBeGreaterThanOrEqual(10);
      expect(deck.length).toBeLessThanOrEqual(11);
      // Every card id in the deck exists.
      for (const id of deck) expect(cards.some((c) => c.id === id)).toBe(true);
    }
  });
});
