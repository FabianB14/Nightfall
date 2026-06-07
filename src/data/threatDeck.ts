// The Threat Deck — how enemies "play themselves" (§9 of cards-and-enemies.md).
// A ~14-card deck; flip the top card each Threat Phase; shuffle when exhausted.
import type { ThreatCardDef } from '@engine/types';

export const threatCards: ThreatCardDef[] = [
  {
    id: 'advance',
    name: 'Advance',
    count: 3,
    text: 'All enemies move toward the nearest hunter; adjacent ones attack.',
    effectId: 'advance',
  },
  {
    id: 'hunt',
    name: 'Hunt',
    count: 2,
    text: 'Stalkers move twice, then attack.',
    effectId: 'hunt',
  },
  {
    id: 'swarm',
    name: 'Swarm',
    count: 2,
    text: 'Spawn 2 Thralls at the nearest spawn point; Thralls attack. (3 past Bloodmoon thresholds.)',
    effectId: 'swarm',
  },
  {
    id: 'dark_deepens',
    name: 'The Dark Deepens',
    count: 2,
    text: 'Remove 1 Light from each vampire; all Cultists act.',
    effectId: 'dark_deepens',
  },
  {
    id: 'ambush',
    name: 'Ambush',
    count: 1,
    text: 'Spawn 1 Stalker behind the hunters; it attacks.',
    effectId: 'ambush',
  },
  {
    id: 'bloodmoon_rises',
    name: 'Bloodmoon Rises',
    count: 2,
    text: 'Advance the Bloodmoon Track 1; Brutes act. (Also spawns a Brute past thresholds.)',
    effectId: 'bloodmoon_rises',
  },
  {
    id: 'lords_will',
    name: "Lord's Will",
    count: 1,
    text: 'The active Lord acts an extra time (no Lord present → treat as Advance).',
    effectId: 'lords_will',
  },
  {
    id: 'lull',
    name: 'Lull',
    count: 1,
    text: 'Enemies only move; nothing spawns. (A breather.)',
    effectId: 'lull',
  },
];

export const threatCardsById: Record<string, ThreatCardDef> = Object.fromEntries(
  threatCards.map((t) => [t.id, t]),
);

/** Expand the deck into a flat list of card ids (count copies each) for shuffling. */
export function buildThreatDeck(): string[] {
  const out: string[] = [];
  for (const c of threatCards) {
    for (let i = 0; i < c.count; i++) out.push(c.id);
  }
  return out;
}
