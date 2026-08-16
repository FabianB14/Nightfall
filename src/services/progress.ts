// Local progression + unlocks + saved decks (§9 of CLAUDE.md, Phase 1: localStorage).
// Side-effectful by design — this module must only be imported from ui/store code,
// never from engine/ or data/. Phase 8 swaps the storage behind these functions
// for Supabase without touching callers.
import type { CardDef, CharacterDef, UnlockReq } from '@engine/types';
import { characters } from '@data/characters';
import { cards } from '@data/cards';

// ----------------------------------------------------------------------------
// Progress (lord kills, wins, achievements)
// ----------------------------------------------------------------------------

export interface PlayerProgress {
  lordKills: number; // every Lord ever destroyed, Eclipse Hearts included
  wins: number; // full runs won (the Heart destroyed)
  runs: number; // runs started
  achievements: string[];
}

const PROGRESS_KEY = 'nightfall.progress';
const DECKS_KEY = 'nightfall.decks';

export const emptyProgress: PlayerProgress = {
  lordKills: 0,
  wins: 0,
  runs: 0,
  achievements: [],
};

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return { ...emptyProgress, ...(JSON.parse(raw) as Partial<PlayerProgress>) };
  } catch {
    /* corrupted/blocked storage → start fresh */
  }
  return { ...emptyProgress };
}

export function saveProgress(p: PlayerProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable — progression just won't persist */
  }
}

// ----------------------------------------------------------------------------
// Unlocks
// ----------------------------------------------------------------------------

/** Is a piece of content available given the player's progress? (no unlock = starter) */
export function isUnlocked(unlock: UnlockReq | undefined, progress: PlayerProgress): boolean {
  if (!unlock || unlock.kind === 'starter') return true;
  switch (unlock.kind) {
    case 'progression':
      return progress.lordKills >= unlock.afterLordKills;
    case 'achievement':
      return progress.achievements.includes(unlock.id);
    case 'currency':
      return false; // no ember economy yet (Phase 8+)
  }
}

/** Human-readable unlock condition, for greyed-out content. */
export function unlockText(unlock: UnlockReq | undefined): string {
  if (!unlock || unlock.kind === 'starter') return '';
  switch (unlock.kind) {
    case 'progression':
      return `Unlocks after ${unlock.afterLordKills} Lord kill${unlock.afterLordKills === 1 ? '' : 's'}`;
    case 'achievement':
      return `Unlocks with achievement: ${unlock.id.replace(/_/g, ' ')}`;
    case 'currency':
      return `Costs ${unlock.cost} embers`;
  }
}

export function unlockedCharacterIds(progress: PlayerProgress): Set<string> {
  return new Set(characters.filter((c) => isUnlocked(c.unlock, progress)).map((c) => c.id));
}

export function unlockedCardIds(progress: PlayerProgress): Set<string> {
  return new Set(cards.filter((c) => isUnlocked(c.unlock, progress)).map((c) => c.id));
}

// ----------------------------------------------------------------------------
// Saved decks (Deck Builder, §9)
// ----------------------------------------------------------------------------

export interface SavedDeck {
  id: string;
  name: string;
  characterId: string;
  cardIds: string[]; // the chosen personal-slot cards (spine/inherent/ultimate are implied)
}

export function loadDecks(): SavedDeck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as SavedDeck[];
    }
  } catch {
    /* fall through */
  }
  return [];
}

export function saveDecks(decks: SavedDeck[]): void {
  try {
    localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
  } catch {
    /* storage unavailable */
  }
}

/** How many personal-slot cards a deck carries (matches every character's default kit). */
export const PERSONAL_SLOTS = 3;

const charactersById = Object.fromEntries(characters.map((c) => [c.id, c]));
const cardsById = Object.fromEntries(cards.map((c) => [c.id, c]));

/**
 * The pool a character may fill personal slots from: their own personal cards, plus
 * the personal cards of other UNLOCKED characters of the same archetype ("unlocked
 * variants", §9).
 */
export function personalPool(characterId: string, progress: PlayerProgress): CardDef[] {
  const ch = charactersById[characterId] as CharacterDef | undefined;
  if (!ch) return [];
  const own = new Set(ch.personal);
  const unlockedChars = unlockedCharacterIds(progress);
  const pool: CardDef[] = [];
  for (const other of characters) {
    if (other.archetype !== ch.archetype) continue;
    const isVariant = other.id !== ch.id;
    if (isVariant && !unlockedChars.has(other.id)) continue;
    for (const id of other.personal) {
      const card = cardsById[id];
      if (card && !pool.some((c) => c.id === id)) pool.push(card);
    }
  }
  // Keep the character's own cards first for a stable, sensible ordering.
  return pool.sort((a, b) => Number(own.has(b.id)) - Number(own.has(a.id)));
}

/** Validate a saved deck against unlocks + archetype rules. Returns problems (empty = valid). */
export function validateDeck(deck: SavedDeck, progress: PlayerProgress): string[] {
  const problems: string[] = [];
  const ch = charactersById[deck.characterId] as CharacterDef | undefined;
  if (!ch) return [`Unknown character: ${deck.characterId}`];
  if (!isUnlocked(ch.unlock, progress)) problems.push(`${ch.name} is not unlocked yet`);
  if (deck.cardIds.length !== PERSONAL_SLOTS) {
    problems.push(`Choose exactly ${PERSONAL_SLOTS} personal cards`);
  }
  const pool = new Set(personalPool(deck.characterId, progress).map((c) => c.id));
  const unlockedCards = unlockedCardIds(progress);
  for (const id of deck.cardIds) {
    if (!pool.has(id)) problems.push(`${cardsById[id]?.name ?? id} is not in ${ch.name}'s pool`);
    else if (!unlockedCards.has(id)) problems.push(`${cardsById[id]?.name ?? id} is locked`);
  }
  if (new Set(deck.cardIds).size !== deck.cardIds.length) problems.push('Duplicate cards in deck');
  return problems;
}
