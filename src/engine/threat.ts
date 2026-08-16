// The Threat Deck and enemy behavior — enemies "play themselves" (§9 of cards-and-enemies.md).
// Also: Surge resolution, Lord gimmicks, the Bloodmoon track, and damage to hunters.
// PURE: mutates the draft GameState; randomness via the passed Rng (§5).
import type { EnemyState, GameState, HunterState, LordState } from './types';
import { Rng } from './rng';
import { threatCardsById } from '@data/threatDeck';
import { mutationsById } from '@data/mutations';
import { makeEnemy } from './createGame';

// ----------------------------------------------------------------------------
// Map graph helpers
// ----------------------------------------------------------------------------

/** BFS shortest-path distance between two zones (Infinity if unreachable). */
export function zoneDistance(state: GameState, from: string, to: string): number {
  if (from === to) return 0;
  const adj = new Map(state.zones.map((z) => [z.id, z.adjacent]));
  const seen = new Set<string>([from]);
  let frontier = [from];
  let dist = 0;
  while (frontier.length) {
    dist += 1;
    const next: string[] = [];
    for (const id of frontier) {
      for (const a of adj.get(id) ?? []) {
        if (a === to) return dist;
        if (!seen.has(a)) {
          seen.add(a);
          next.push(a);
        }
      }
    }
    frontier = next;
  }
  return Infinity;
}

/** First step along the shortest path from `from` toward `to` (or `from` if none). */
function stepToward(state: GameState, from: string, to: string): string {
  const fromZone = state.zones.find((z) => z.id === from);
  if (!fromZone) return from;
  let best = from;
  let bestDist = Infinity;
  for (const a of fromZone.adjacent) {
    const d = zoneDistance(state, a, to);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

function aliveHunters(state: GameState): HunterState[] {
  return state.hunters.filter((h) => !h.downed);
}

/** Nearest living hunter to a zone (taunting hunters take priority). */
function nearestHunter(state: GameState, fromZone: string): HunterState | null {
  const alive = aliveHunters(state);
  if (alive.length === 0) return null;
  const taunting = alive.filter((h) => state.enemies.length >= 0 && hunterIsTaunting(state, h));
  const pool = taunting.length ? taunting : alive;
  return pool.reduce<HunterState | null>((best, h) => {
    if (!best) return h;
    return zoneDistance(state, fromZone, h.zone) < zoneDistance(state, fromZone, best.zone) ? h : best;
  }, null);
}

function hunterIsTaunting(state: GameState, hunter: HunterState): boolean {
  // A hunter is "taunting" if any enemy carries a taunt condition this round and the hunter
  // played Howl — we model taunt on the enemy list globally for simplicity.
  void state;
  return hunter.buffs.some((b) => b.buff === 'taunt');
}

// ----------------------------------------------------------------------------
// Damage to hunters
// ----------------------------------------------------------------------------

/** Apply damage to a hunter, honoring shields, DR, wards, Ezra's aura, and down rules. */
export function damageHunter(
  state: GameState,
  hunter: HunterState,
  amount: number,
  fromVampire: boolean,
): void {
  if (hunter.downed) return;
  if (hunter.ignoreNextHit) {
    hunter.ignoreNextHit = false;
    state.log.push(`${hunter.name} shrugs off the blow.`);
    return;
  }
  let dmg = amount;

  // Père Ezra: allies adjacent to him take 1 less vampire damage.
  if (fromVampire) {
    const ezraNear = state.hunters.some(
      (h) => h.id !== hunter.id && !h.downed && h.zone === hunter.zone && h.passiveHooks.includes('adjacent_damage_reduction'),
    );
    if (ezraNear) dmg -= 1;
  }

  // Zone wards (Warding Circle / lit) reduce 1.
  const zone = state.zones.find((z) => z.id === hunter.zone);
  if (zone?.effects.some((e) => e.kind === 'lit')) dmg -= 1;

  dmg -= hunter.damageReduction;
  if (hasBuffLocal(hunter, 'unstoppable')) dmg -= 2;
  dmg = Math.max(0, dmg);

  // Shield soaks first.
  if (hunter.shield > 0) {
    const soak = Math.min(hunter.shield, dmg);
    hunter.shield -= soak;
    dmg -= soak;
  }

  hunter.hp = Math.max(0, hunter.hp - dmg);
  if (hunter.hp <= 0) downHunter(state, hunter);
}

function downHunter(state: GameState, hunter: HunterState): void {
  // Deathless / Not Yet: cannot be downed this round.
  if (hasBuffLocal(hunter, 'deathless')) {
    hunter.hp = 1;
    return;
  }
  // Augustin: first time each district, stays up at 1 HP and gains a Curse mark.
  if (hunter.passiveHooks.includes('wont_stay_down') && !hunter.buffs.some((b) => b.buff === '_used_wont_stay_down')) {
    hunter.hp = 1;
    hunter.buffs.push({ buff: '_used_wont_stay_down', duration: 999 });
    if (hunter.resourceType === 'frenzy') hunter.resource += 1;
    state.log.push(`${hunter.name} won't stay down.`);
    return;
  }
  hunter.downed = true;
  hunter.hp = 0;
  state.log.push(`${hunter.name} is down!`);
}

function hasBuffLocal(hunter: HunterState, buff: string): boolean {
  return hunter.buffs.some((b) => b.buff === buff);
}

// ----------------------------------------------------------------------------
// Enemy & Lord actions
// ----------------------------------------------------------------------------

function enemyCanAct(enemy: EnemyState): boolean {
  if (enemy.conditions.some((c) => c.condition === 'stun')) return false;
  return true;
}

function enemyRooted(enemy: EnemyState): boolean {
  return enemy.conditions.some((c) => c.condition === 'root');
}

/** Move an enemy up to `steps` zones toward the nearest hunter, then attack if in range. */
function enemyAdvanceAndAttack(state: GameState, enemy: EnemyState, steps: number): void {
  if (!enemyCanAct(enemy)) return;
  const target = nearestHunter(state, enemy.zone);
  if (!target) return;

  if (!enemyRooted(enemy)) {
    for (let i = 0; i < steps && enemy.zone !== target.zone; i++) {
      enemy.zone = stepToward(state, enemy.zone, target.zone);
    }
  }

  // Feared enemies in the hunter's zone can't attack that hunter.
  const feared = enemy.conditions.some((c) => c.condition === 'fear');
  if (enemy.zone === target.zone && !feared) {
    let dmg = state.enemies.length >= 0 ? enemyAttackDamage(enemy) : 0;
    if (enemy.diceDebuff > 0) dmg = Math.max(0, dmg - enemy.diceDebuff);
    damageHunter(state, target, dmg, enemy.isVampire);
    state.log.push(`${enemy.name} hits ${target.name} for ${dmg}.`);
  }
}

function enemyAttackDamage(enemy: EnemyState): number {
  // base attack damage from the def, looked up lazily to avoid a data import cycle
  switch (enemy.defId) {
    case 'thrall':
      return 1;
    case 'stalker':
      return 2;
    case 'brute':
      return 3;
    case 'cultist':
      return 1;
    default:
      return 1;
  }
}

/** Effect ids of the Lord's mutation(s) — one from the run draw, maybe one from an event. */
export function lordMutationEffects(lord: LordState): string[] {
  return [lord.mutationId, lord.extraMutationId]
    .filter((x): x is string => !!x)
    .map((id) => mutationsById[id]?.effectId ?? id);
}

/** Heal the Lord; on the Eclipse Heart this mends the weakest surviving Ward instead. */
function healLord(lord: LordState, amount: number): void {
  if (lordHexed(lord)) return;
  if (lord.wards) {
    const capacity = Math.ceil(lord.maxHp / lord.wards.hp.length);
    const alive = lord.wards.hp
      .map((hp, i) => ({ hp, i }))
      .filter((w) => w.hp > 0 && w.hp < capacity)
      .sort((a, b) => a.hp - b.hp);
    if (alive.length > 0) lord.wards.hp[alive[0].i] = Math.min(capacity, alive[0].hp + amount);
    lord.hp = lord.wards.hp.reduce((a, b) => a + b, 0);
    return;
  }
  lord.hp = Math.min(lord.maxHp, lord.hp + amount);
}

/** Per-enemy-round mutation upkeep (Thrallmaster, Veiled in Shadow). */
export function lordMutationUpkeep(state: GameState, lord: LordState): void {
  const effects = lordMutationEffects(lord);
  if (effects.includes('spawn_thrall')) {
    state.enemies.push(makeEnemy('thrall', lord.zone));
    state.log.push(`${lord.name}'s thralls crawl from the dark.`);
  }
  if (effects.includes('heal_unless_lit')) {
    const litHere = state.zones.find((z) => z.id === lord.zone)?.terrain === 'lit';
    if (!litHere) healLord(lord, 2);
  }
}

/** Resolve a single Lord activation: gimmick, then attack the nearest hunter. */
export function lordAct(state: GameState, rng: Rng): void {
  const lord = state.activeLord;
  if (!lord) return;
  lordGimmick(state, lord, rng);

  const stationary = lord.gimmickId === 'rotating_wards'; // the Heart never moves
  const target = nearestHunter(state, lord.zone);
  if (target) {
    if (!stationary && lord.zone !== target.zone) lord.zone = stepToward(state, lord.zone, target.zone);
    if (zoneDistance(state, lord.zone, target.zone) <= 1) {
      const dmg = lord.attackDamage + (lord.enraged ? 1 : 0);
      damageHunter(state, target, dmg, true);
      state.log.push(`${lord.name} strikes ${target.name} for ${dmg}.`);
    }
  }
}

function lordGimmick(state: GameState, lord: LordState, rng: Rng): void {
  if (lord.gimmickId === 'rotating_wards') {
    eclipseHeartTurn(state, lord, rng);
    return;
  }
  runGimmick(state, lord, lord.gimmickId, rng);
}

/** One named gimmick, reusable so the Eclipse Heart can remix the Lords you faced. */
function runGimmick(state: GameState, lord: LordState, gimmickId: string, rng: Rng): void {
  const litHere = state.zones.find((z) => z.id === lord.zone)?.terrain === 'lit';
  switch (gimmickId) {
    case 'heal_in_shadow':
      if (!litHere) healLord(lord, lord.enraged ? 3 : 2);
      break;
    case 'spawn_stalkers': {
      const n = lord.enraged ? 2 : 1;
      for (let i = 0; i < n; i++) state.enemies.push(makeEnemy('stalker', lord.zone));
      break;
    }
    case 'root_hunters': {
      const n = lord.enraged ? 2 : 1;
      const victims = rng.shuffle(aliveHunters(state)).slice(0, n);
      for (const v of victims) addHunterCondition(v, 'root', 1);
      break;
    }
    case 'shed_light':
      if (!lord.wards) {
        lord.light = 0;
        lord.staggered = false;
      }
      healLord(lord, lord.enraged ? 3 : 2);
      break;
    case 'flood_zones': {
      const n = lord.enraged ? 2 : 1;
      const candidates = rng.shuffle(state.zones.filter((z) => z.terrain !== 'flooded'));
      for (const z of candidates.slice(0, n)) z.terrain = 'flooded';
      break;
    }
    case 'heat_vents':
      // The vents themselves live on LordState; enrage rebuilds one (see reducer).
      break;
  }
}

/**
 * The Eclipse Heart's enemy turn (§8 finale): run one remixed Lord gimmick per phase
 * (phase = 1 + broken Wards), then close the Exposed Ward — the crew must light the
 * arena again. From phase 2 on, exposure persists ("each phase exposes Wards faster").
 */
function eclipseHeartTurn(state: GameState, lord: LordState, rng: Rng): void {
  const wards = lord.wards;
  if (!wards) return;
  const broken = wards.hp.filter((h) => h <= 0).length;
  const phase = Math.min(3, 1 + broken);
  const remixable = wards.remixed.filter((g) => g !== 'heat_vents' && g !== 'rotating_wards');
  for (const gimmickId of remixable.slice(0, phase)) {
    runGimmick(state, lord, gimmickId, rng);
  }
  if (phase === 1) wards.exposed = null;
  else if (wards.exposed !== null && wards.hp[wards.exposed] <= 0) wards.exposed = null;
}

function lordHexed(lord: LordState): boolean {
  return !!lord.mark?.preventHeal;
}

function addHunterCondition(hunter: HunterState, condition: 'root' | 'stun' | 'fear' | 'taunt', duration: number): void {
  const ex = hunter.conditions.find((c) => c.condition === condition);
  if (ex) ex.duration = Math.max(ex.duration, duration);
  else hunter.conditions.push({ condition, duration });
}

// ----------------------------------------------------------------------------
// Threat Deck resolution
// ----------------------------------------------------------------------------

/** Past which Bloodmoon thresholds the deck escalates (§9 scaling). */
function bloodmoonTier(state: GameState): number {
  if (state.bloodmoon >= 8) return 2;
  if (state.bloodmoon >= 4) return 1;
  return 0;
}

function nearestSpawnZone(state: GameState): string {
  // Spawn at the zone holding the most enemies, else the Lord's zone, else first zone.
  if (state.activeLord) return state.activeLord.zone;
  return state.enemies[0]?.zone ?? state.zones[0].id;
}

/** Draw and resolve one Threat card. Reshuffles the discard when the deck is empty. */
export function drawThreat(state: GameState, rng: Rng): string {
  if (state.threatDeck.length === 0) {
    state.threatDeck = rng.shuffle(state.threatDiscard);
    state.threatDiscard = [];
  }
  const cardId = state.threatDeck.shift();
  if (!cardId) return 'lull';
  state.threatDiscard.push(cardId);
  resolveThreat(state, cardId, rng);
  return cardId;
}

function resolveThreat(state: GameState, cardId: string, rng: Rng): void {
  const card = threatCardsById[cardId];
  const tier = bloodmoonTier(state);
  state.log.push(`Threat: ${card?.name ?? cardId}.`);

  switch (card?.effectId) {
    case 'advance':
      for (const e of state.enemies) enemyAdvanceAndAttack(state, e, enemyMove(e));
      break;
    case 'hunt':
      for (const e of state.enemies.filter((x) => x.defId === 'stalker')) {
        enemyAdvanceAndAttack(state, e, enemyMove(e) * 2);
      }
      break;
    case 'swarm': {
      const n = tier >= 1 ? 3 : 2;
      const z = nearestSpawnZone(state);
      for (let i = 0; i < n; i++) state.enemies.push(makeEnemy('thrall', z));
      for (const e of state.enemies.filter((x) => x.defId === 'thrall')) enemyAdvanceAndAttack(state, e, enemyMove(e));
      break;
    }
    case 'dark_deepens':
      for (const e of state.enemies) if (e.isVampire) e.light = Math.max(0, e.light - 1), refreshStagger(e);
      for (const e of state.enemies.filter((x) => x.defId === 'cultist')) cultistAct(state, e);
      break;
    case 'ambush': {
      const z = state.zones[state.zones.length - 1].id;
      const s = makeEnemy('stalker', z);
      state.enemies.push(s);
      enemyAdvanceAndAttack(state, s, enemyMove(s));
      break;
    }
    case 'bloodmoon_rises':
      advanceBloodmoon(state, 1);
      if (tier >= 1) state.enemies.push(makeEnemy('brute', nearestSpawnZone(state)));
      for (const e of state.enemies.filter((x) => x.defId === 'brute')) enemyAdvanceAndAttack(state, e, enemyMove(e));
      break;
    case 'lords_will':
      if (state.activeLord) lordAct(state, rng);
      else for (const e of state.enemies) enemyAdvanceAndAttack(state, e, enemyMove(e));
      break;
    case 'lull':
      for (const e of state.enemies) {
        if (enemyCanAct(e) && !enemyRooted(e)) {
          const target = nearestHunter(state, e.zone);
          if (target && e.zone !== target.zone) e.zone = stepToward(state, e.zone, target.zone);
        }
      }
      break;
  }
}

function enemyMove(enemy: EnemyState): number {
  switch (enemy.defId) {
    case 'stalker':
      return 2;
    default:
      return 1;
  }
}

function cultistAct(state: GameState, cultist: EnemyState): void {
  // Darkens: remove 2 Light from a vampire in its zone.
  const vamp = state.enemies.find((e) => e.isVampire && e.zone === cultist.zone);
  if (vamp) {
    vamp.light = Math.max(0, vamp.light - 2);
    refreshStagger(vamp);
  }
}

function refreshStagger(enemy: EnemyState): void {
  if (enemy.staggerThreshold !== null && enemy.light < enemy.staggerThreshold) {
    enemy.staggered = false;
  }
}

export function advanceBloodmoon(state: GameState, amount: number): void {
  state.bloodmoon = Math.min(state.bloodmoonMax, state.bloodmoon + amount);
  if (state.bloodmoon >= state.bloodmoonMax) {
    state.phase = 'lost';
    state.log.push('The Bloodmoon fills. The dark wins.');
  }
}

// ----------------------------------------------------------------------------
// Surge resolution (§0): roll 1 CD per Surge token; each Hit/Crit lets an enemy strike.
// ----------------------------------------------------------------------------

export function resolveSurges(state: GameState, rng: Rng): void {
  for (const hunter of state.hunters) {
    if (hunter.surge <= 0) continue;
    const faces = rng.rollDice(hunter.surge);
    const triggers = faces.filter((f) => f === 'hit' || f === 'crit').length;
    state.pendingDice = faces;
    for (let i = 0; i < triggers; i++) {
      // Closest enemy to this hunter attacks or advances.
      const enemy = closestEnemyTo(state, hunter.zone);
      if (enemy) enemyAdvanceAndAttack(state, enemy, enemyMove(enemy));
    }
    if (triggers > 0) state.log.push(`${hunter.name}'s recklessness draws ${triggers} reprisal(s).`);
    hunter.surge = 0;
  }
}

function closestEnemyTo(state: GameState, zoneId: string): EnemyState | null {
  return state.enemies.reduce<EnemyState | null>((best, e) => {
    if (!best) return e;
    return zoneDistance(state, zoneId, e.zone) < zoneDistance(state, zoneId, best.zone) ? e : best;
  }, null);
}
