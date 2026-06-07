// The six founding archetypes (§5 of design-doc.md, §1–6 of cards-and-enemies.md).
// Each lists its shared spine (card ids defined in cards.ts).
import type { ArchetypeDef } from '@engine/types';

export const archetypes: ArchetypeDef[] = [
  {
    id: 'revenant',
    name: 'The Revenant',
    role: 'blood-touched predator · burst DPS',
    resourceType: 'bloodlust',
    resourceMax: 3,
    keyword: 'Bloodlust (0–3): gained by staking vampires; spent on extra dice/dashes. At 3, risk Frenzy.',
    spine: ['predator_strike', 'lunge', 'drain', 'blood_sense', 'feint', 'recover'],
  },
  {
    id: 'devout',
    name: 'The Devout',
    role: 'faith and light · support / anti-vampire',
    resourceType: 'faith',
    keyword: 'Faith: built by helping allies and surviving; spent on blessings.',
    spine: ['holy_light', 'mend', 'ward', 'censer', 'prayer', 'rebuke'],
  },
  {
    id: 'cursed',
    name: 'The Cursed',
    role: 'cursed bruiser / tank',
    resourceType: 'frenzy',
    resourceMax: 3,
    keyword: 'The Curse + Frenzy risk: lean on the curse for power; push too far and Frenzy takes over.',
    spine: ['maul', 'brace', 'charge', 'endure', 'shake_off', 'thick_hide'],
  },
  {
    id: 'conjurer',
    name: 'The Conjurer',
    role: 'charms, curses, spirits · control / debuff',
    resourceType: 'charm',
    keyword: 'Gris-gris charms: craft 1 at setup and 1 per district; one-use powerful effects.',
    spine: ['hex_bolt', 'warding_circle', 'bind', 'candle', 'cleanse', 'omen'],
  },
  {
    id: 'marksman',
    name: 'The Marksman',
    role: 'ranged precision + traps · DPS',
    resourceType: 'round',
    resourceMax: 3,
    keyword: 'Silver rounds: limited ammo; reloading is an action.',
    spine: ['aimed_shot', 'snap_shot', 'reload', 'flare', 'cover', 'mark'],
  },
  {
    id: 'maker',
    name: 'The Maker',
    role: 'gadgets · the crew’s stagger engine · zone control',
    resourceType: 'scrap',
    keyword: 'Scrap: gathered from board/objectives; spent to build.',
    spine: ['quick_gadget', 'salvage', 'barricade', 'repair', 'deploy_turret', 'hand_off'],
  },
];
