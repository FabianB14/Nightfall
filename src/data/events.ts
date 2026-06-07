// Between-district events — a boon or a bane (§6.D of design-doc.md).
import type { EventDef } from '@engine/types';

export const events: EventDef[] = [
  {
    id: 'found_relic',
    name: 'A Relic in the Ruins',
    kind: 'boon',
    text: 'Find a relic: each hunter draws an extra card next district.',
    effectId: 'relic_draw',
  },
  {
    id: 'safe_house',
    name: 'A Safe House',
    kind: 'boon',
    text: 'Rest: the whole crew heals 3.',
    effectId: 'heal_crew_3',
  },
  {
    id: 'cache_of_silver',
    name: 'A Cache of Silver',
    kind: 'boon',
    text: 'Resupply: each hunter gains 1 resource of their type.',
    effectId: 'resource_all_1',
  },
  {
    id: 'cultist_ambush',
    name: 'Cultist Ambush',
    kind: 'bane',
    text: 'Ambush: the next district begins with 2 extra Cultists.',
    effectId: 'spawn_cultists_2',
  },
  {
    id: 'the_moon_lurches',
    name: 'The Moon Lurches',
    kind: 'bane',
    text: 'The eclipse deepens: Bloodmoon +2.',
    effectId: 'bloodmoon_2',
  },
  {
    id: 'blood_in_the_water',
    name: 'Blood in the Water',
    kind: 'bane',
    text: 'The next Lord starts with a second Mutation.',
    effectId: 'extra_mutation',
  },
];

export const eventsById: Record<string, EventDef> = Object.fromEntries(
  events.map((e) => [e.id, e]),
);
