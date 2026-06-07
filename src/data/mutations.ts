// Lord mutations — one is layered on each drawn Lord (§6.B of design-doc.md).
import type { MutationDef } from '@engine/types';

export const mutations: MutationDef[] = [
  {
    id: 'bloodgorged',
    name: 'Bloodgorged',
    text: '+50% HP.',
    effectId: 'hp_plus_50',
  },
  {
    id: 'shrouded',
    name: 'Shrouded',
    text: 'Higher stagger threshold (harder to stagger).',
    effectId: 'stagger_plus_1',
  },
  {
    id: 'swift',
    name: 'Swift',
    text: 'Acts twice per Threat phase.',
    effectId: 'act_twice',
  },
  {
    id: 'thrallmaster',
    name: 'Thrallmaster',
    text: 'Spawns a Thrall each round.',
    effectId: 'spawn_thrall',
  },
  {
    id: 'veiled_in_shadow',
    name: 'Veiled in Shadow',
    text: 'Heals unless standing in light.',
    effectId: 'heal_unless_lit',
  },
];

export const mutationsById: Record<string, MutationDef> = Object.fromEntries(
  mutations.map((m) => [m.id, m]),
);
