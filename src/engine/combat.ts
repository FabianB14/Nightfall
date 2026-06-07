// Combat resolution: the Combat Die, light → stagger → stake, Surge, Ultimate charge,
// and the interpreter for the Effect union (§3 of design-doc.md, §0 of cards-and-enemies.md).
// PURE: operates on a mutable draft GameState passed in by the reducer; no I/O.
import type {
  DieFace,
  Effect,
  EnemyState,
  GameState,
  HunterState,
  LordState,
  TargetRef,
} from './types';
import { Rng } from './rng';

/** Anything that can take Light/Stake: a common enemy or the active Lord. */
export type Combatant = EnemyState | LordState;

export interface RollResult {
  faces: DieFace[];
  hits: number; // hit faces (after blessing/reroll)
  crits: number; // crit faces
  surges: number; // surge faces
}

/** Resolve a dice roll, applying a one-die blessing and miss-rerolls if active on the hunter. */
export function rollAttackDice(
  rng: Rng,
  dice: number,
  hunter: HunterState,
  rerollMisses: boolean,
): RollResult {
  let faces = rng.rollDice(dice);

  const wantReroll = rerollMisses || hunter.rerollMisses || hasBuff(hunter, 'reroll_misses');
  if (wantReroll) {
    faces = faces.map((f) => (f === 'miss' ? rng.rollDie() : f));
  }

  // Blessing: turn one non-Hit die into a Hit.
  if (hunter.blessingDie) {
    const idx = faces.findIndex((f) => f !== 'hit' && f !== 'crit');
    if (idx >= 0) faces[idx] = 'hit';
  }

  const hits = faces.filter((f) => f === 'hit').length;
  const crits = faces.filter((f) => f === 'crit').length;
  const surges = faces.filter((f) => f === 'surge').length;
  return { faces, hits, crits, surges };
}

export function hasBuff(hunter: HunterState, buff: string): boolean {
  return hunter.buffs.some((b) => b.buff === buff);
}

function isVampire(target: Combatant): boolean {
  return 'isVampire' in target ? target.isVampire : true; // LordState has no flag; lords are vampires
}

function markBonus(target: Combatant): number {
  return target.mark ? target.mark.bonus : 0;
}

/** Apply Light to a target, flipping Staggered when the threshold is met. Returns light added. */
export function applyLight(target: Combatant, amount: number): number {
  const total = amount + markBonus(target);
  if (total <= 0) return 0;
  target.light += total;
  const st = target.staggerThreshold;
  if (st !== null && st !== undefined && target.light >= st) {
    target.staggered = true;
  }
  return total;
}

/**
 * Apply Stake/HP damage. Vampires only take it while Staggered (unless bypassStagger);
 * thralls/cultists take it anytime. Returns the HP actually removed.
 */
export function applyStake(
  target: Combatant,
  amount: number,
  opts: { bypassStagger?: boolean } = {},
): number {
  const total = amount + markBonus(target);
  if (total <= 0) return 0;
  const vampire = isVampire(target);
  if (vampire && !target.staggered && !opts.bypassStagger) return 0; // ignored
  const before = target.hp;
  target.hp = Math.max(0, target.hp - total);
  return before - target.hp;
}

function gainCharge(hunter: HunterState, amount: number): void {
  hunter.charge = Math.min(5, hunter.charge + amount);
}

// ----------------------------------------------------------------------------
// Effect interpreter
// ----------------------------------------------------------------------------

export interface EffectContext {
  state: GameState;
  hunter: HunterState;
  targets: TargetRef[];
  rng: Rng;
}

/** Find the primary combatant target (enemy uid or the lord). */
export function resolveCombatant(state: GameState, targets: TargetRef[]): Combatant | null {
  for (const t of targets) {
    if (t.kind === 'enemy') {
      const e = state.enemies.find((x) => x.uid === t.uid);
      if (e) return e;
    }
    if (t.kind === 'lord' && state.activeLord) return state.activeLord;
  }
  return null;
}

function resolveHunter(state: GameState, targets: TargetRef[], self: HunterState): HunterState {
  for (const t of targets) {
    if (t.kind === 'hunter') {
      const h = state.hunters.find((x) => x.id === t.id);
      if (h) return h;
    }
    if (t.kind === 'self') return self;
  }
  return self;
}

function resolveZone(_state: GameState, targets: TargetRef[], self: HunterState): string {
  for (const t of targets) {
    if (t.kind === 'zone') return t.id;
  }
  return self.zone;
}

/** Every combatant in a zone (and adjacent zones if radius >= 1). */
function combatantsInRadius(state: GameState, zoneId: string, radius: number): Combatant[] {
  const zone = state.zones.find((z) => z.id === zoneId);
  const zoneIds = new Set<string>([zoneId]);
  if (radius >= 1 && zone) zone.adjacent.forEach((a) => zoneIds.add(a));
  const out: Combatant[] = state.enemies.filter((e) => zoneIds.has(e.zone));
  if (state.activeLord && zoneIds.has(state.activeLord.zone)) out.push(state.activeLord);
  return out;
}

/** Run a list of effects against resolved targets, mutating the draft state. */
export function applyEffects(ctx: EffectContext, effects: Effect[]): void {
  for (const effect of effects) applyEffect(ctx, effect);
}

function applyEffect(ctx: EffectContext, effect: Effect): void {
  const { state, hunter, targets, rng } = ctx;

  switch (effect.kind) {
    case 'rollAttack': {
      const target = resolveCombatant(state, targets);
      if (!target) return;
      const roll = rollAttackDice(rng, effect.dice, hunter, effect.rerollMisses ?? false);
      state.pendingDice = roll.faces;
      hunter.surge += roll.surges;

      const deal = chooseDealKind(effect.deal, target, hunter);
      const perHitLight = effect.perHit?.light ?? 1;
      const perHitStake = effect.perHit?.stake ?? 1;

      let lightDealt = 0;
      let hpDealt = 0;

      if (deal === 'light' || effect.perHit?.light !== undefined) {
        const amount = roll.hits * perHitLight + roll.crits * (perHitLight * 2);
        lightDealt += applyLight(target, amount);
      }
      if (deal === 'stake' || effect.perHit?.stake !== undefined) {
        const amount = roll.hits * perHitStake + roll.crits * (perHitStake * 2);
        hpDealt += applyStake(target, amount, { bypassStagger: effect.bypassStagger || nightborn(hunter) });
      }

      onDamageDealt(ctx, target, hpDealt);
      handleLifesteal(hunter, effect, hpDealt, roll);

      if (roll.crits > 0 && effect.crit) applyEffects(ctx, effect.crit);
      consumeOneShotBuffs(hunter);
      break;
    }

    case 'fixedLight': {
      const radius = effect.radius ?? 0;
      const zoneId = radius > 0 ? resolveZone(state, targets, hunter) : null;
      const list = zoneId
        ? combatantsInRadius(state, zoneId, radius)
        : ([resolveCombatant(state, targets)].filter(Boolean) as Combatant[]);
      for (const t of list) {
        applyLight(t, effect.amount);
        lightBurnsStaggeredPassive(ctx, t);
      }
      break;
    }

    case 'fixedDamage': {
      const radius = effect.radius ?? 0;
      const zoneId = radius > 0 ? resolveZone(state, targets, hunter) : null;
      const list = zoneId
        ? combatantsInRadius(state, zoneId, radius)
        : ([resolveCombatant(state, targets)].filter(Boolean) as Combatant[]);
      for (const t of list) {
        const dmg = applyStake(t, effect.amount, { bypassStagger: effect.bypassStagger });
        onDamageDealt(ctx, t, dmg);
      }
      break;
    }

    case 'autoCrit': {
      const target = resolveCombatant(state, targets);
      if (!target) return;
      const deal = chooseDealKind(effect.deal, target, hunter);
      if (deal === 'light') {
        applyLight(target, effect.light ?? 2);
        lightBurnsStaggeredPassive(ctx, target);
      } else {
        const dmg = applyStake(target, effect.stake ?? 2, { bypassStagger: nightborn(hunter) });
        onDamageDealt(ctx, target, dmg);
      }
      break;
    }

    case 'heal': {
      const tgt = effect.target === 'self' ? hunter : resolveHunter(state, targets, hunter);
      heal(tgt, effect.amount);
      if (effect.target === 'ally' && tgt.id !== hunter.id) gainFaithOnHeal(hunter);
      break;
    }

    case 'revive': {
      const tgt = resolveHunter(state, targets, hunter);
      if (tgt.downed) {
        tgt.downed = false;
        tgt.hp = effect.toFull ? tgt.maxHp : 1;
      }
      break;
    }

    case 'shield': {
      const tgt = effect.target === 'self' ? hunter : resolveHunter(state, targets, hunter);
      tgt.shield += effect.amount;
      break;
    }

    case 'damageReduction':
      hunter.damageReduction += effect.amount;
      break;

    case 'condition': {
      // Conditions land on the targeted combatant (lords are immune to control by default).
      const target = resolveCombatant(state, targets);
      if (target && 'conditions' in target) addCondition(target.conditions, effect.condition, effect.duration);
      break;
    }

    case 'clearCondition':
      hunter.conditions.splice(0, effect.amount);
      break;

    case 'clearSurge':
      hunter.surge = Math.max(0, hunter.surge - effect.amount);
      break;

    case 'mark': {
      const target = resolveCombatant(state, targets);
      if (target) target.mark = { bonus: effect.bonus, preventHeal: effect.preventHeal ?? false };
      break;
    }

    case 'reduceEnemyDice': {
      const target = resolveCombatant(state, targets);
      if (target && 'diceDebuff' in target) target.diceDebuff += effect.amount;
      break;
    }

    case 'gainResource':
      if (hunter.resourceType === effect.resource) addResource(hunter, effect.amount);
      break;

    case 'setResource':
      if (hunter.resourceType === effect.resource) hunter.resource = effect.amount;
      break;

    case 'draw':
      drawCards(ctx.state, hunter, effect.amount, rng);
      break;

    case 'discardDraw': {
      // Discard the cheapest leftover from hand (simple heuristic), then draw.
      for (let i = 0; i < effect.discard && hunter.hand.length > 0; i++) {
        const card = hunter.hand.pop();
        if (card) hunter.discard.push(card);
      }
      drawCards(ctx.state, hunter, effect.draw, rng);
      break;
    }

    case 'extraAction':
      hunter.actionsLeft += 1;
      break;

    case 'ignoreNextHit': {
      const tgt = resolveHunter(state, targets, hunter);
      tgt.ignoreNextHit = true;
      break;
    }

    case 'blessing': {
      const tgt = resolveHunter(state, targets, hunter);
      tgt.blessingDie = true;
      break;
    }

    case 'buff':
      hunter.buffs.push({ buff: effect.buff, duration: effect.duration, value: effect.value });
      break;

    case 'bloodmoon':
      state.bloodmoon = Math.max(0, state.bloodmoon + effect.amount);
      break;

    case 'zoneEffect': {
      const zoneId = resolveZone(state, targets, hunter);
      addZoneEffect(state, zoneId, effect.effect, effect.duration);
      if ((effect.radius ?? 0) >= 1) {
        const zone = state.zones.find((z) => z.id === zoneId);
        zone?.adjacent.forEach((a) => addZoneEffect(state, a, effect.effect, effect.duration));
      }
      break;
    }

    case 'autoStaggerZone': {
      const zoneId = resolveZone(state, targets, hunter);
      // Immediate stagger of vampires in radius, plus a persistent rig (modeled as a gadget).
      for (const t of combatantsInRadius(state, zoneId, effect.radius)) {
        if (isVampire(t)) {
          applyLight(t, Math.max(effect.lightPerTurn ?? 99, (t.staggerThreshold ?? 0) + 1));
        }
      }
      state.gadgets.push({
        uid: `gadget_${state.gadgets.length}_${zoneId}`,
        owner: hunter.id,
        type: 'uv_rig',
        zone: zoneId,
        hp: 4,
        data: { radius: effect.radius, lightPerTurn: effect.lightPerTurn ?? 2, duration: effect.duration },
      });
      break;
    }

    case 'deployGadget':
      state.gadgets.push({
        uid: `gadget_${state.gadgets.length}_${effect.gadget}`,
        owner: hunter.id,
        type: effect.gadget,
        zone: resolveZone(state, targets, hunter),
        hp: gadgetHp(effect.gadget),
      });
      break;

    case 'move': {
      const zoneId = resolveZone(state, targets, hunter);
      // Dash toward the target's zone when one is given; otherwise stay (UI provides the zone).
      const target = resolveCombatant(state, targets);
      hunter.zone = target ? target.zone : zoneId;
      break;
    }

    case 'summon':
      state.summons.push({
        uid: `summon_${state.summons.length}`,
        owner: hunter.id,
        zone: resolveZone(state, targets, hunter),
        hp: effect.hp,
        dice: effect.dice,
        bypassStagger: effect.bypassStagger ?? false,
        duration: effect.duration ?? -1,
        name: 'Spirit',
      });
      break;
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function chooseDealKind(
  deal: 'light' | 'stake' | 'choose',
  target: Combatant,
  hunter: HunterState,
): 'light' | 'stake' {
  if (deal !== 'choose') return deal;
  if (nightborn(hunter)) return 'stake';
  if (!isVampire(target)) return 'stake';
  // For a vampire: light it if not yet staggered, otherwise stake it.
  return target.staggered ? 'stake' : 'light';
}

function nightborn(hunter: HunterState): boolean {
  return hasBuff(hunter, 'nightborn');
}

function onDamageDealt(ctx: EffectContext, target: Combatant, hpDealt: number): void {
  if (hpDealt <= 0) return;
  const vampire = isVampire(target);
  if (vampire) gainCharge(ctx.hunter, 1);
  if (target.hp <= 0) {
    gainCharge(ctx.hunter, 1); // a kill also charges
  }
  // Dhampir: heal 1 when she stakes a staggered vampire.
  if (vampire && target.staggered && ctx.hunter.passiveHooks.includes('heal_on_stake')) {
    heal(ctx.hunter, 1);
  }
}

function handleLifesteal(
  hunter: HunterState,
  effect: Extract<Effect, { kind: 'rollAttack' }>,
  hpDealt: number,
  roll: RollResult,
): void {
  if (!effect.lifesteal || hpDealt <= 0) {
    // Nightborn heals 1 per Hit even without an explicit lifesteal clause.
    if (nightborn(hunter)) heal(hunter, roll.hits + roll.crits);
    return;
  }
  const ls = effect.lifesteal;
  if (ls.mode === 'equal') heal(hunter, hpDealt);
  else if (ls.mode === 'flat') heal(hunter, ls.amount ?? 1);
  else if (ls.mode === 'perHit') heal(hunter, (roll.hits + roll.crits) * (ls.amount ?? 1));
}

// Colette: her Light effects also deal 1 Stake to staggered vampires.
function lightBurnsStaggeredPassive(ctx: EffectContext, target: Combatant): void {
  if (!ctx.hunter.passiveHooks.includes('light_burns_staggered')) return;
  if (isVampire(target) && target.staggered) {
    const dmg = applyStake(target, 1);
    onDamageDealt(ctx, target, dmg);
  }
}

function heal(hunter: HunterState, amount: number): void {
  if (amount <= 0 || hunter.downed) return;
  hunter.hp = Math.min(hunter.maxHp, hunter.hp + amount);
}

function gainFaithOnHeal(hunter: HunterState): void {
  // Devout: gain 1 Faith when you heal an ally (handled here for cards without an explicit gain).
  if (hunter.resourceType === 'faith') addResource(hunter, 0); // explicit gainResource cards already cover this
}

function addResource(hunter: HunterState, amount: number): void {
  const max = resourceMax(hunter.resourceType);
  hunter.resource = Math.min(max, hunter.resource + amount);
}

function resourceMax(type: string | undefined): number {
  switch (type) {
    case 'bloodlust':
      return 3;
    case 'round':
      return 3;
    case 'frenzy':
      return 3;
    default:
      return 99;
  }
}

function addCondition(
  list: { condition: 'root' | 'stun' | 'fear' | 'taunt'; duration: number }[],
  condition: 'root' | 'stun' | 'fear' | 'taunt',
  duration: number,
): void {
  const existing = list.find((c) => c.condition === condition);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else list.push({ condition, duration });
}

function addZoneEffect(
  state: GameState,
  zoneId: string,
  kind: 'hallowed' | 'burning' | 'flooded' | 'lit',
  duration: number,
): void {
  const zone = state.zones.find((z) => z.id === zoneId);
  if (!zone) return;
  const existing = zone.effects.find((e) => e.kind === kind);
  if (existing) existing.duration = Math.max(existing.duration, duration);
  else zone.effects.push({ kind, duration });
  if (kind === 'lit') zone.terrain = 'lit';
}

function gadgetHp(type: string): number {
  switch (type) {
    case 'turret':
      return 3;
    case 'barricade':
      return 3;
    case 'reinforced_barricade':
      return 6;
    case 'uv_rig':
      return 4;
    default:
      return 1;
  }
}

function consumeOneShotBuffs(hunter: HunterState): void {
  hunter.blessingDie = false;
  hunter.rerollMisses = false;
  hunter.buffs = hunter.buffs.filter((b) => b.buff !== 'reroll_misses');
}

/** Draw N cards, shuffling the discard into the deck when it runs out (§0: hand of 4). */
export function drawCards(_state: GameState, hunter: HunterState, n: number, rng: Rng): void {
  for (let i = 0; i < n; i++) {
    if (hunter.deck.length === 0) {
      if (hunter.discard.length === 0) return; // nothing left to draw
      hunter.deck = rng.shuffle(hunter.discard);
      hunter.discard = [];
    }
    const card = hunter.deck.shift();
    if (card) hunter.hand.push(card);
  }
}
