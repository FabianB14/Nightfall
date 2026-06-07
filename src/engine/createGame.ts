// Build the initial GameState for a run, and set up each district encounter.
// PURE: deterministic given (seed, RunConfig). All randomness via the seeded RNG (§5).
import type {
  EnemyState,
  GameState,
  HunterState,
  LordState,
  RunConfig,
  Zone,
} from './types';
import { Rng } from './rng';
import { buildThreatDeck } from '@data/threatDeck';
import { charactersById } from '@data/characters';
import { archetypes } from '@data/archetypes';
import { cardsById } from '@data/cards';
import { enemiesById } from '@data/enemies';
import { lordsById } from '@data/lords';
import { mutationsById } from '@data/mutations';
import { districtsById } from '@data/districts';

const archetypesById = Object.fromEntries(archetypes.map((a) => [a.id, a]));

/** Build a hunter's ~10-card deck: archetype spine + inherent + personals + ultimate. */
export function buildDeck(characterId: string): string[] {
  const ch = charactersById[characterId];
  if (!ch) throw new Error(`Unknown character: ${characterId}`);
  const archetype = archetypesById[ch.archetype];
  return [...archetype.spine, ch.inherent, ...ch.personal, ch.ultimate];
}

function makeHunter(rng: Rng, characterId: string, startZone: string): HunterState {
  const ch = charactersById[characterId];
  const deck = rng.shuffle(buildDeck(characterId));
  const hunter: HunterState = {
    id: characterId,
    characterId,
    name: ch.name,
    archetype: ch.archetype,
    passiveHooks: ch.passiveHooks ?? [],
    buffs: [],
    zone: startZone,
    hp: ch.hp,
    maxHp: ch.hp,
    hand: [],
    deck,
    discard: [],
    resourceType: ch.resourceType,
    resource: ch.resourceType === 'round' ? 3 : 0, // Marksmen start loaded
    charge: 0,
    surge: 0,
    shield: 0,
    damageReduction: 0,
    conditions: [],
    marks: 0,
    ignoreNextHit: false,
    blessingDie: false,
    rerollMisses: false,
    actionsLeft: 0,
    quickUsed: false,
    downed: false,
  };
  // Opening hand of 4 (§0). Pull without reshuffle noise.
  hunter.hand = hunter.deck.splice(0, 4);
  return hunter;
}

let enemyCounter = 0;
export function makeEnemy(defId: 'thrall' | 'stalker' | 'brute' | 'cultist', zone: string): EnemyState {
  const def = enemiesById[defId];
  return {
    uid: `enemy_${enemyCounter++}`,
    defId,
    name: def.name,
    zone,
    hp: def.hp,
    maxHp: def.hp,
    staggerThreshold: def.staggerThreshold,
    light: 0,
    staggered: false,
    isVampire: def.isVampire,
    conditions: [],
    mark: null,
    diceDebuff: 0,
  };
}

function makeLord(lordId: string, mutationId: string | undefined, zone: string): LordState {
  const def = lordsById[lordId];
  let hp = def.hp;
  let st = def.staggerThreshold;
  // Apply mutation effects that change baseline stats (others are handled at runtime).
  if (mutationId) {
    const mut = mutationsById[mutationId];
    if (mut?.effectId === 'hp_plus_50') hp = Math.round(hp * 1.5);
    if (mut?.effectId === 'stagger_plus_1') st += 1;
  }
  return {
    defId: lordId,
    name: def.name,
    zone,
    hp,
    maxHp: hp,
    staggerThreshold: st,
    light: 0,
    staggered: false,
    enraged: false,
    enrageAt: def.enrageAt,
    gimmickId: def.gimmickId,
    attackDamage: def.attackDamage,
    mutationId,
    mark: null,
  };
}

function makeZones(districtId: string): Zone[] {
  const district = districtsById[districtId];
  return district.zones.map((z) => ({
    id: z.id,
    name: z.name,
    terrain: z.terrain,
    adjacent: [...z.adjacent],
    effects: [],
  }));
}

/** The lit "entrance" zone hunters start in (first lit zone, else the first zone). */
function entranceZone(districtId: string): string {
  const district = districtsById[districtId];
  return (district.zones.find((z) => z.terrain === 'lit') ?? district.zones[0]).id;
}

/**
 * Create a fresh GameState at the first district of the run, with the crew, the first
 * Lord placed in a spawn zone, an opening enemy wave, and a shuffled Threat Deck.
 */
export function createGame(seed: string, run: RunConfig): GameState {
  const rng = new Rng(seed, 1_000_000); // offset cursor so run-roll and game-roll streams differ
  const districtId = run.districts[0];
  const start = entranceZone(districtId);
  const hunters = run.crew.map((id) => makeHunter(rng, id, start));

  const state: GameState = {
    seed,
    rngCursor: rng.cursor,
    round: 1,
    phase: 'crew',
    turnOrder: hunters.map((h) => h.id),
    activeHunter: hunters[0]?.id ?? null,
    bloodmoon: 0,
    bloodmoonMax: 12,
    zones: makeZones(districtId),
    hunters,
    enemies: [],
    summons: [],
    gadgets: [],
    activeLord: null,
    threatDeck: [],
    threatDiscard: [],
    run,
    districtIndex: 0,
    objectiveId: run.objectives[run.lordSequence[0]] ?? null,
    pendingDice: [],
    log: [],
  };

  setupDistrict(state, 0, rng);
  state.rngCursor = rng.cursor;
  return state;
}

/**
 * Load the board for district index `i`: zones, the Lord (with mutation), an opening wave,
 * and a freshly shuffled Threat Deck. Hunters are repositioned to the entrance.
 */
export function setupDistrict(state: GameState, i: number, rng: Rng): void {
  const districtId = state.run.districts[i];
  const lordId = state.run.lordSequence[i];
  const start = entranceZone(districtId);

  state.districtIndex = i;
  state.objectiveId = state.run.objectives[lordId] ?? null;
  state.zones = makeZones(districtId);
  state.enemies = [];
  state.summons = [];
  state.gadgets = [];

  for (const h of state.hunters) {
    h.zone = start;
  }

  // Place the Lord at a spawn zone (the darkest, deepest one).
  const district = districtsById[districtId];
  const lordZone = district.spawnZones[district.spawnZones.length - 1];
  state.activeLord = makeLord(lordId, state.run.mutations[lordId], lordZone);

  // Opening wave: a Stalker and a Brute at the spawn zones (§10 vertical-slice target).
  state.enemies.push(makeEnemy('stalker', district.spawnZones[0]));
  state.enemies.push(makeEnemy('brute', lordZone));

  state.threatDeck = rng.shuffle(buildThreatDeck());
  state.threatDiscard = [];
  state.phase = 'crew';
  state.activeHunter = state.turnOrder[0] ?? null;

  // Reset per-district transient hunter state.
  for (const h of state.hunters) {
    h.surge = 0;
    h.conditions = [];
    h.buffs = [];
  }
  state.log.push(`Entered ${district.name}. ${state.activeLord.name} stirs in the dark.`);
}

// keep cardsById import meaningful (deck contents are validated indirectly)
void cardsById;
