// The six Vampire Lords + the Eclipse Heart finale (§8 of cards-and-enemies.md).
// enrageAt is the HP at/below which the Lord Enrages (half HP).
import type { LordDef } from '@engine/types';

export const lords: LordDef[] = [
  {
    id: 'harbor_lord',
    name: 'The Harbor Lord',
    staggerThreshold: 3,
    hp: 14,
    enrageAt: 7,
    attackDamage: 3,
    gimmick: 'Heals 2 each enemy turn while in an unlit (shadow) zone. Light its zone to shut off the healing. Enrage: heals 3.',
    gimmickId: 'heal_in_shadow',
  },
  {
    id: 'bell_tower_lord',
    name: 'The Bell-Tower Lord',
    staggerThreshold: 3,
    hp: 14,
    enrageAt: 7,
    attackDamage: 3,
    gimmick: 'Rings the bell at the start of each enemy turn → spawn 1 Stalker. Enrage: spawns 2.',
    gimmickId: 'spawn_stalkers',
  },
  {
    id: 'garden_lord',
    name: 'The Garden Lord',
    staggerThreshold: 4,
    hp: 15,
    enrageAt: 8,
    attackDamage: 2,
    gimmick: 'Roots one hunter (vines) each enemy turn. Thorn-lash hits everyone in a zone. Enrage: roots two hunters.',
    gimmickId: 'root_hunters',
  },
  {
    id: 'foundry_lord',
    name: 'The Foundry Lord',
    staggerThreshold: 3,
    hp: 16,
    enrageAt: 8,
    attackDamage: 3,
    gimmick: 'Immune to Stake/HP damage until both Heat Vents are destroyed; until then it can only be staggered. Enrage: rebuilds one vent.',
    gimmickId: 'heat_vents',
  },
  {
    id: 'cathedral_lord',
    name: 'The Cathedral Lord',
    staggerThreshold: 2,
    hp: 14,
    enrageAt: 7,
    attackDamage: 3,
    gimmick: 'Sheds all Light at the start of each enemy turn — you must burst-stagger it in one crew turn. Blood-prayer heals 2. Enrage: heals 3.',
    gimmickId: 'shed_light',
  },
  {
    id: 'drowned_lord',
    name: 'The Drowned Lord',
    staggerThreshold: 3,
    hp: 15,
    enrageAt: 8,
    attackDamage: 2,
    gimmick: 'Floods one zone each enemy turn (flooded: hunters take 1 dmg, movement costs +1). Tide-pull drags a hunter. Enrage: floods two zones.',
    gimmickId: 'flood_zones',
  },
];

// The finale. Modeled as a Lord with a special gimmick; no stagger track (handled by hooks).
export const eclipseHeart: LordDef = {
  id: 'eclipse_heart',
  name: 'The Eclipse Heart',
  staggerThreshold: 0,
  hp: 24,
  enrageAt: 8,
  attackDamage: 3,
  gimmick:
    'Stationary. 3 rotating Wards — only the Exposed Ward can be damaged; lighting the arena rotates which is exposed. Remixes the gimmicks of the Lords you faced. Three phases.',
  gimmickId: 'rotating_wards',
};

export const lordsById: Record<string, LordDef> = Object.fromEntries(
  [...lords, eclipseHeart].map((l) => [l.id, l]),
);
