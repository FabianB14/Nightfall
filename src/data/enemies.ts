// Common enemies — the Threat Deck pool (§7 of cards-and-enemies.md).
import type { EnemyDef } from '@engine/types';

export const enemies: EnemyDef[] = [
  {
    id: 'thrall',
    name: 'Thrall',
    staggerThreshold: null, // no stagger needed
    hp: 2,
    move: 1,
    isVampire: false,
    attack: { damage: 1, reach: 'melee' },
    notes: 'Turned townsfolk. Swarms. Takes Stake/HP damage anytime.',
  },
  {
    id: 'stalker',
    name: 'Stalker',
    staggerThreshold: 2,
    hp: 3,
    move: 2,
    isVampire: true,
    attack: { damage: 2, reach: 'melee', moveBefore: 2 },
    notes: 'Fast vampire (moves 2). Pounce up to 2 zones.',
  },
  {
    id: 'brute',
    name: 'Brute',
    staggerThreshold: 4,
    hp: 5,
    move: 1,
    isVampire: true,
    attack: { damage: 3, reach: 'melee', knockback: 1 },
    notes: 'Slow (moves 1). High threshold — needs setup to stagger.',
  },
  {
    id: 'cultist',
    name: 'Cultist',
    staggerThreshold: null, // human
    hp: 3,
    move: 1,
    isVampire: false,
    attack: { damage: 1, reach: 'melee' },
    notes: 'Darkens: removes 2 Light from a vampire in its zone, or gives an adjacent vampire +1 attack die. Hangs back.',
  },
];

export const enemiesById: Record<string, EnemyDef> = Object.fromEntries(
  enemies.map((e) => [e.id, e]),
);
