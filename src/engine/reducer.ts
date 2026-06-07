// applyAction(state, action) -> newState. The pure heart of the engine (§4 of CLAUDE.md).
// Clones the input, mutates the clone, returns it — deterministic given (state, action);
// all randomness flows through the seeded RNG read off state (§5).
import type { Action, GameState, HunterState, TargetRef } from './types';
import { Rng } from './rng';
import { cardsById } from '@data/cards';
import { charactersById } from '@data/characters';
import { applyEffects, drawCards } from './combat';
import {
  resolveSurges,
  drawThreat,
  lordAct,
  damageHunter,
  zoneDistance,
} from './threat';
import { setupDistrict } from './createGame';

const HAND_SIZE = 4;
const ACTIONS_PER_TURN = 2;

function clone(state: GameState): GameState {
  return structuredClone(state);
}

export function applyAction(state: GameState, action: Action): GameState {
  if (state.phase === 'won' || state.phase === 'lost') return state;
  const next = clone(state);
  const rng = new Rng(next.seed, next.rngCursor);

  switch (action.t) {
    case 'playCard':
    case 'reactCard':
      playCard(next, action.hunter, action.card, action.targets, rng);
      break;
    case 'useUltimate': {
      const h = getHunter(next, action.hunter);
      const ult = h ? charactersById[h.characterId]?.ultimate : undefined;
      if (ult) playCard(next, action.hunter, ult, action.targets, rng);
      break;
    }
    case 'move':
      moveHunter(next, action.hunter, action.toZone);
      break;
    case 'useGadget':
      // Gadget activation is folded into card effects in this build.
      break;
    case 'endTurn':
      endTurn(next, action.hunter, rng);
      break;
    case 'advancePhase':
      runEnemyRound(next, rng);
      break;
  }

  next.rngCursor = rng.cursor;
  checkEndStates(next, rng);
  return next;
}

// ----------------------------------------------------------------------------
// Crew actions
// ----------------------------------------------------------------------------

function getHunter(state: GameState, id: string): HunterState | undefined {
  return state.hunters.find((h) => h.id === id);
}

function playCard(
  state: GameState,
  hunterId: string,
  cardId: string,
  targets: TargetRef[],
  rng: Rng,
): void {
  const hunter = getHunter(state, hunterId);
  const card = cardsById[cardId];
  if (!hunter || !card || hunter.downed) return;
  if (state.activeHunter !== hunterId && !card.cost.reaction) return;
  if (!hunter.hand.includes(cardId)) return;

  const isQuick = card.cost.quick === true;
  const isReaction = card.cost.reaction === true;
  const isUltimate = card.type === 'ultimate';

  // Cost checks.
  if (isUltimate && hunter.charge < 5) return;
  if (isQuick && hunter.quickUsed && !isReaction) return;
  if (!isQuick && !isReaction && hunter.actionsLeft < card.cost.action) return;
  if (card.cost.resource) {
    const need = card.cost.resource.amount;
    if (hunter.resource < need && hunter.resourceType === card.cost.resource.type) return;
  }

  // Pay costs.
  if (card.cost.resource && hunter.resourceType === card.cost.resource.type) {
    hunter.resource = Math.max(0, hunter.resource - card.cost.resource.amount);
  }
  if (isUltimate) hunter.charge = 0;
  if (isQuick) hunter.quickUsed = true;
  else if (!isReaction) hunter.actionsLeft -= card.cost.action;

  // Move the card to discard, then resolve effects.
  hunter.hand.splice(hunter.hand.indexOf(cardId), 1);
  hunter.discard.push(cardId);

  applyEffects({ state, hunter, targets, rng }, card.effects);
  state.log.push(`${hunter.name} plays ${card.name}.`);
}

function moveHunter(state: GameState, hunterId: string, toZone: string): void {
  const hunter = getHunter(state, hunterId);
  if (!hunter || hunter.downed) return;
  if (state.activeHunter !== hunterId) return;
  if (hunter.actionsLeft < 1) return;
  if (hunter.conditions.some((c) => c.condition === 'root')) return;

  const cur = state.zones.find((z) => z.id === hunter.zone);
  if (!cur || !cur.adjacent.includes(toZone)) return;

  // Flooded zones cost an extra action to enter (Drowned Lord, terrain).
  const dest = state.zones.find((z) => z.id === toZone);
  const cost = dest?.terrain === 'flooded' ? 2 : 1;
  if (hunter.actionsLeft < cost) return;

  hunter.actionsLeft -= cost;
  hunter.zone = toZone;
  if (dest?.terrain === 'flooded') damageHunter(state, hunter, 1, false);
}

// ----------------------------------------------------------------------------
// Turn & round flow
// ----------------------------------------------------------------------------

export function startHunterTurn(_state: GameState, hunter: HunterState): void {
  hunter.actionsLeft = ACTIONS_PER_TURN;
  hunter.quickUsed = false;

  // Tick down hunter conditions at the start of their turn.
  hunter.conditions = hunter.conditions
    .map((c) => ({ ...c, duration: c.duration - 1 }))
    .filter((c) => c.duration > 0);

  // Rougarou Beast: gain 1 Frenzy at the start of each turn while transformed.
  if (hunter.passiveHooks.includes('beast_stance') && hunter.buffs.some((b) => b.buff === 'beast')) {
    if (hunter.resourceType === 'frenzy') hunter.resource = Math.min(3, hunter.resource + 1);
  }
}

function endTurn(state: GameState, hunterId: string, rng: Rng): void {
  const hunter = getHunter(state, hunterId);
  if (!hunter || state.activeHunter !== hunterId) return;

  // Draw back up to the hand size.
  if (hunter.hand.length < HAND_SIZE) {
    drawCards(state, hunter, HAND_SIZE - hunter.hand.length, rng);
  }

  const order = state.turnOrder.filter((id) => !getHunter(state, id)?.downed);
  const idx = order.indexOf(hunterId);
  const nextId = order[idx + 1];

  if (nextId) {
    state.activeHunter = nextId;
    const nh = getHunter(state, nextId);
    if (nh) startHunterTurn(state, nh);
  } else {
    // Last hunter has acted → resolve the enemy round.
    runEnemyRound(state, rng);
  }
}

/** Surge Phase → Threat Phase → Bloodmoon check → start the next Crew round (§3). */
export function runEnemyRound(state: GameState, rng: Rng): void {
  state.phase = 'surge';
  resolveSurges(state, rng);
  if (isLost(state)) return finalize(state, 'lost');

  state.phase = 'threat';
  drawThreat(state, rng);
  if (state.activeLord) lordAct(state, rng);
  if (isLost(state)) return finalize(state, 'lost');

  state.phase = 'bloodmoon';
  if (state.bloodmoon >= state.bloodmoonMax) return finalize(state, 'lost');

  startNewRound(state, rng);
}

function startNewRound(state: GameState, rng: Rng): void {
  state.round += 1;
  state.phase = 'crew';

  // Stagger only lasts until the end of the round; light resets.
  for (const e of state.enemies) {
    e.staggered = false;
    e.light = 0;
    e.diceDebuff = 0;
    e.conditions = decDurations(e.conditions);
  }
  if (state.activeLord && state.activeLord.gimmickId !== 'rotating_wards') {
    state.activeLord.staggered = false;
    state.activeLord.light = 0;
    if (state.activeLord.mark) state.activeLord.mark = null;
  }

  // Persistent gadgets: UV Rig re-staggers its zone at round start.
  for (const g of state.gadgets) {
    if (g.type === 'uv_rig') {
      const radius = g.data?.radius ?? 0;
      restaggerZone(state, g.zone, radius);
    }
  }

  // Zone effects (burning, hallowed, flooded, lit) tick and apply.
  applyZoneTicks(state);
  for (const z of state.zones) z.effects = decDurations(z.effects);

  // Hunter upkeep: clear marks/blessing, tick buffs, refresh DR, draw to hand.
  for (const h of state.hunters) {
    h.damageReduction = 0;
    h.blessingDie = false;
    h.rerollMisses = false;
    h.buffs = h.buffs
      .filter((b) => b.buff !== '_used_wont_stay_down' ? true : true) // keep district-scoped flags
      .map((b) => (b.buff.startsWith('_') ? b : { ...b, duration: b.duration - 1 }))
      .filter((b) => b.buff.startsWith('_') || b.duration > 0);
  }

  // Begin the first hunter's turn.
  const order = state.turnOrder.filter((id) => !getHunter(state, id)?.downed);
  state.activeHunter = order[0] ?? null;
  const first = order[0] ? getHunter(state, order[0]) : undefined;
  if (first) startHunterTurn(state, first);

  void rng;
}

function restaggerZone(state: GameState, zoneId: string, radius: number): void {
  const zone = state.zones.find((z) => z.id === zoneId);
  const ids = new Set<string>([zoneId]);
  if (radius >= 1 && zone) zone.adjacent.forEach((a) => ids.add(a));
  for (const e of state.enemies) {
    if (e.isVampire && ids.has(e.zone) && e.staggerThreshold !== null) {
      e.light += 2;
      if (e.light >= e.staggerThreshold) e.staggered = true;
    }
  }
  // The Lord is a vampire too — the stagger engine works on it.
  const lord = state.activeLord;
  if (lord && ids.has(lord.zone) && lord.gimmickId !== 'rotating_wards') {
    lord.light += 2;
    if (lord.light >= lord.staggerThreshold) lord.staggered = true;
  }
}

function applyZoneTicks(state: GameState): void {
  const lord = state.activeLord;
  for (const z of state.zones) {
    const burning = z.effects.find((e) => e.kind === 'burning');
    const hallowed = z.effects.find((e) => e.kind === 'hallowed');
    if (burning) {
      for (const e of state.enemies.filter((x) => x.zone === z.id)) {
        e.hp = Math.max(0, e.hp - 1);
        if (e.isVampire && e.staggerThreshold !== null) {
          e.light += 1;
          if (e.light >= e.staggerThreshold) e.staggered = true;
        }
      }
      if (lord && lord.zone === z.id && lord.staggered) lord.hp = Math.max(0, lord.hp - 1);
    }
    if (burning || hallowed) {
      for (const e of state.enemies.filter((x) => x.isVampire && x.zone === z.id)) {
        if (e.staggerThreshold !== null) {
          e.light += 1;
          if (e.light >= e.staggerThreshold) e.staggered = true;
        }
      }
      if (lord && lord.zone === z.id && lord.gimmickId !== 'rotating_wards') {
        lord.light += 1;
        if (lord.light >= lord.staggerThreshold) lord.staggered = true;
      }
    }
  }
}

function decDurations<T extends { duration: number }>(list: T[]): T[] {
  return list.map((x) => ({ ...x, duration: x.duration - 1 })).filter((x) => x.duration > 0);
}

// ----------------------------------------------------------------------------
// End states
// ----------------------------------------------------------------------------

function isLost(state: GameState): boolean {
  return state.hunters.every((h) => h.downed) || state.bloodmoon >= state.bloodmoonMax;
}

function finalize(state: GameState, phase: 'won' | 'lost'): void {
  state.phase = phase;
  state.log.push(phase === 'won' ? 'Dawn breaks. You win.' : 'The crew falls. The dark wins.');
}

/** After any action: clear dead enemies, enrage/defeat the Lord, advance districts. */
function checkEndStates(state: GameState, rng: Rng): void {
  if (state.phase === 'won' || state.phase === 'lost') return;

  // Remove dead common enemies.
  state.enemies = state.enemies.filter((e) => e.hp > 0);
  state.summons = state.summons.filter((s) => s.hp > 0);

  const lord = state.activeLord;
  if (lord) {
    if (!lord.enraged && lord.hp <= lord.enrageAt && lord.hp > 0) {
      lord.enraged = true;
      state.log.push(`${lord.name} ENRAGES.`);
    }
    if (lord.hp <= 0) {
      state.log.push(`${lord.name} is destroyed!`);
      advanceDistrict(state, rng);
      return;
    }
  }

  if (isLost(state)) finalize(state, 'lost');
}

function advanceDistrict(state: GameState, rng: Rng): void {
  const last = state.run.lordSequence.length - 1;
  if (state.districtIndex >= last) {
    finalize(state, 'won');
    return;
  }
  setupDistrict(state, state.districtIndex + 1, rng);
  // Fresh opening hands for the new district.
  for (const h of state.hunters) {
    h.discard.push(...h.hand);
    h.hand = [];
    h.deck = rng.shuffle([...h.deck, ...h.discard]);
    h.discard = [];
    drawCards(state, h, HAND_SIZE, rng);
    h.downed = false;
    h.hp = h.maxHp;
  }
  const first = getHunter(state, state.turnOrder[0]);
  if (first) startHunterTurn(state, first);
}

/** Convenience for tests/UI: ensure the first hunter's turn is initialized. */
export function beginRun(state: GameState): GameState {
  const next = clone(state);
  const first = next.hunters.find((h) => h.id === next.activeHunter);
  for (const h of next.hunters) {
    if (h.hand.length === 0) {
      const rng = new Rng(next.seed, next.rngCursor);
      drawCards(next, h, HAND_SIZE - h.hand.length, rng);
      next.rngCursor = rng.cursor;
    }
  }
  if (first) startHunterTurn(next, first);
  return next;
}

void zoneDistance;
