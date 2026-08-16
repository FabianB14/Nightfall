// Core engine types for Nightfall: Last Light.
// PURE TypeScript — no React, no DOM, no I/O (see §3/§4 of CLAUDE.md).
// The docs in /docs are the source of truth; this expands the §4 skeleton to match them.

// ----------------------------------------------------------------------------
// Identifiers & enums
// ----------------------------------------------------------------------------

export type ArchetypeId =
  | 'revenant'
  | 'devout'
  | 'cursed'
  | 'conjurer'
  | 'marksman'
  | 'maker';

export type CardType =
  | 'attack'
  | 'light'
  | 'heal'
  | 'utility'
  | 'gadget'
  | 'build'
  | 'curse'
  | 'movement'
  | 'summon'
  | 'ultimate'
  | 'zone';

export type Reach = 'melee' | 'ranged' | 'self' | 'zone';

export type CardSlot = 'spine' | 'inherent' | 'personal' | 'ultimate';

/** The custom Combat Die faces (§0 of cards-and-enemies.md). */
export type DieFace = 'hit' | 'crit' | 'miss' | 'surge';

/** What a damage roll/effect deals. */
export type DamageKind = 'light' | 'stake';

export type Condition = 'root' | 'stun' | 'fear' | 'taunt';

export type ZoneTerrain = 'lit' | 'shadow' | 'flooded';

export type EnemyId = 'thrall' | 'stalker' | 'brute' | 'cultist';

// ----------------------------------------------------------------------------
// Costs & effects (cards are data; combat.ts interprets effects)
// ----------------------------------------------------------------------------

export interface ResourceCost {
  type: string; // 'faith' | 'bloodlust' | 'scrap' | 'round' | 'charm' | 'curseMark'
  amount: number;
}

export interface Cost {
  action: 0 | 1; // 0 = Quick or React
  quick?: boolean; // free, once per turn
  reaction?: boolean; // playable on the enemy turn
  resource?: ResourceCost;
}

/**
 * Effects are data interpreted by combat.ts. Keep the set small and reusable;
 * every card in the docs must be expressible here (§4, §14).
 */
export type Effect =
  // Roll N Combat Dice and deal light/stake (or let the player choose the kind).
  | {
      kind: 'rollAttack';
      dice: number;
      deal: DamageKind | 'choose';
      bypassStagger?: boolean; // damage applies even if the target isn't staggered
      perHit?: { light?: number; stake?: number }; // overrides the default 1/2 mapping
      crit?: Effect[]; // crit clause: extra effects when any die crits
      rerollMisses?: boolean;
      lifesteal?: { mode: 'equal' | 'flat' | 'perHit'; amount?: number };
    }
  // Deal a flat amount with no roll (Holy Water, Censer, Candle, Crimson Step…).
  | { kind: 'fixedLight'; amount: number; radius?: number }
  | { kind: 'fixedDamage'; amount: number; bypassStagger?: boolean; radius?: number }
  | { kind: 'autoCrit'; deal: DamageKind | 'choose'; light?: number; stake?: number }
  | { kind: 'heal'; amount: number; target: 'self' | 'ally' }
  | { kind: 'revive'; toFull: boolean }
  | { kind: 'move'; zones: number; toward?: 'vampire' | 'enemy' }
  | { kind: 'condition'; condition: Condition; duration: number }
  | { kind: 'shield'; amount: number; target: 'self' | 'ally' }
  | { kind: 'damageReduction'; amount: number; duration: number }
  | { kind: 'gainResource'; resource: string; amount: number }
  | { kind: 'setResource'; resource: string; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'discardDraw'; discard: number; draw: number }
  | { kind: 'clearSurge'; amount: number }
  | { kind: 'clearCondition'; amount: number }
  | { kind: 'mark'; bonus: number; preventHeal?: boolean } // +X from all sources
  | { kind: 'extraAction' }
  | { kind: 'ignoreNextHit' }
  | { kind: 'deployGadget'; gadget: string }
  | { kind: 'summon'; hp: number; dice: number; bypassStagger?: boolean; duration?: number }
  | { kind: 'zoneEffect'; effect: ZoneEffectKind; duration: number; radius?: number }
  | { kind: 'autoStaggerZone'; radius: number; lightPerTurn?: number; duration: number }
  | { kind: 'blessing' } // next attack: one die auto-counts as a Hit
  | { kind: 'reduceEnemyDice'; amount: number } // debuff target's next attack
  | { kind: 'buff'; buff: string; duration: number; value?: number } // nightborn, beast, deathless…
  | { kind: 'bloodmoon'; amount: number }; // shift the doom clock (Full Moon aftermath, events)

export type ZoneEffectKind = 'hallowed' | 'burning' | 'flooded' | 'lit';

// ----------------------------------------------------------------------------
// Content definitions (validated by data/schema.ts)
// ----------------------------------------------------------------------------

export type UnlockReq =
  | { kind: 'starter' }
  | { kind: 'progression'; afterLordKills: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'currency'; cost: number };

export interface CardDef {
  id: string; // 'crimson_step' (also art filename + sfx key)
  name: string;
  archetype: ArchetypeId;
  slot: CardSlot;
  type: CardType;
  cost: Cost;
  reach: Reach;
  text: string; // human-readable rules text (from the docs)
  effects: Effect[];
  targetKind?: 'enemy' | 'vampire' | 'ally' | 'zone' | 'self' | 'none';
  art?: string; // defaults to id
  sfx?: string; // defaults to a type-based sound
  unlock?: UnlockReq;
}

export interface ArchetypeDef {
  id: ArchetypeId;
  name: string;
  role: string;
  resourceType?: string; // 'bloodlust' | 'faith' | 'curse' | 'scrap' | 'round' | 'charm'
  resourceMax?: number;
  keyword: string; // the rules quirk that defines the class
  spine: string[]; // card ids shared by all characters of this archetype
}

export interface CharacterDef {
  id: string; // 'dhampir'
  name: string;
  archetype: ArchetypeId;
  hp: number;
  passive: string; // rules text; implemented as hooks where needed
  passiveHooks?: string[]; // machine-readable hook ids the reducer recognizes
  resourceType?: string;
  inherent: string; // card id
  personal: string[]; // card ids
  ultimate: string; // card id
  unlock?: UnlockReq;
}

export interface EnemyAttack {
  damage: number;
  reach: Reach;
  moveBefore?: number; // zones it advances before attacking
  knockback?: number;
}

export interface EnemyDef {
  id: EnemyId;
  name: string;
  staggerThreshold: number | null; // null = no stagger needed (thralls, humans)
  hp: number;
  move: number;
  isVampire: boolean;
  attack: EnemyAttack;
  notes?: string;
}

export interface LordDef {
  id: string;
  name: string;
  staggerThreshold: number;
  hp: number;
  enrageAt: number; // phase 2 threshold (HP)
  gimmick: string;
  gimmickId: string; // machine-readable hook id
  attackDamage: number;
}

export interface MutationDef {
  id: string;
  name: string;
  text: string;
  effectId: string; // machine-readable hook id
}

export interface ObjectiveDef {
  id: string;
  name: string;
  text: string;
}

export interface DistrictDef {
  id: string;
  name: string;
  zones: ZoneLayout[]; // map graph
  objectivePool: string[]; // objective ids that can appear here
  spawnZones: string[]; // zone ids enemies spawn at
}

export interface ZoneLayout {
  id: string;
  name: string;
  terrain: ZoneTerrain;
  adjacent: string[]; // adjacent zone ids
}

export interface EventDef {
  id: string;
  name: string;
  kind: 'boon' | 'bane';
  text: string;
  effectId: string;
}

export interface ThreatCardDef {
  id: string;
  name: string;
  count: number; // copies in the deck
  text: string;
  effectId: string; // 'advance' | 'hunt' | 'swarm' | ...
}

// ----------------------------------------------------------------------------
// Runtime game state
// ----------------------------------------------------------------------------

export interface Zone {
  id: string;
  name: string;
  terrain: ZoneTerrain;
  adjacent: string[];
  /** Transient per-zone effects keyed by kind, with remaining duration (rounds). */
  effects: { kind: ZoneEffectKind; duration: number }[];
}

export interface HunterState {
  id: string; // character id (also the player handle in this build)
  characterId: string;
  name: string;
  archetype: ArchetypeId;
  passiveHooks: string[];
  buffs: { buff: string; duration: number; value?: number }[];
  zone: string;
  hp: number;
  maxHp: number;
  hand: string[];
  deck: string[];
  discard: string[];
  resourceType?: string;
  resource: number; // bloodlust / faith / scrap / rounds / charms / curse marks
  charge: number; // ultimate charge (0..5)
  surge: number; // surge tokens accumulated this turn
  shield: number;
  damageReduction: number; // from Brace etc., decremented each round
  conditions: { condition: Condition; duration: number }[];
  marks: number; // generic mark counter (e.g. Augustin curse marks tracked in resource)
  ignoreNextHit: boolean;
  blessingDie: boolean; // next attack: one die auto-Hit
  rerollMisses: boolean; // next attack: reroll misses once
  actionsLeft: number;
  quickUsed: boolean;
  downed: boolean;
}

export interface EnemyState {
  uid: string; // unique runtime id
  defId: EnemyId;
  name: string;
  zone: string;
  hp: number;
  maxHp: number;
  staggerThreshold: number | null;
  light: number; // accumulated light this round
  staggered: boolean;
  isVampire: boolean;
  conditions: { condition: Condition; duration: number }[];
  mark: { bonus: number; preventHeal: boolean } | null;
  diceDebuff: number; // reduces dice on its next attack
}

export interface LordState {
  defId: string;
  name: string;
  zone: string;
  hp: number;
  maxHp: number;
  staggerThreshold: number;
  light: number;
  staggered: boolean;
  enraged: boolean;
  enrageAt: number;
  gimmickId: string;
  attackDamage: number;
  mutationId?: string;
  /** Second mutation layered on by the "Blood in the Water" event. */
  extraMutationId?: string;
  mark: { bonus: number; preventHeal: boolean } | null;
  /**
   * Eclipse Heart only: 3 rotating Wards replace the stagger track. Light into the
   * arena exposes/rotates a Ward; only the exposed Ward takes damage. `remixed` holds
   * the gimmick ids of the Lords faced this run; one more activates per phase.
   */
  wards?: { hp: number[]; exposed: number | null; remixed: string[] };
  /** Foundry Lord only: Heat Vent HP — stake damage breaks vents before the Lord. */
  vents?: number[];
}

export interface SummonState {
  uid: string;
  owner: string; // hunter id
  zone: string;
  hp: number;
  dice: number;
  bypassStagger: boolean;
  duration: number; // rounds remaining; -1 = until destroyed
  name: string;
}

export interface GadgetState {
  uid: string;
  owner: string;
  type: string; // 'light_mine' | 'turret' | 'uv_rig' | 'bear_trap' | 'barricade' | ...
  zone: string;
  hp: number;
  data?: Record<string, number>;
}

export type GamePhase = 'crew' | 'surge' | 'threat' | 'bloodmoon' | 'interlude' | 'won' | 'lost';

export interface RunConfig {
  lordSequence: string[]; // ordered lord def ids; always ends with 'eclipse_heart'
  mutations: Record<string, string>; // lordId -> mutationId
  districts: string[]; // ordered district def ids (one per lord + the finale)
  objectives: Record<string, string>; // lordId -> objective id
  events: string[]; // event ids drawn between districts (one per slain regular Lord)
  crew: string[]; // character ids
  /** Optional saved-deck overrides per character (Deck Builder, §9). */
  decks?: Record<string, string[]>;
}

export interface GameState {
  seed: string;
  rngCursor: number;
  round: number;
  phase: GamePhase;
  turnOrder: string[]; // hunter ids in activation order
  activeHunter: string | null; // whose crew turn it is
  bloodmoon: number; // doom clock
  bloodmoonMax: number;
  zones: Zone[];
  hunters: HunterState[];
  enemies: EnemyState[];
  summons: SummonState[];
  gadgets: GadgetState[];
  activeLord: LordState | null;
  threatDeck: string[];
  threatDiscard: string[];
  run: RunConfig;
  districtIndex: number; // which lord/district we're on
  objectiveId: string | null;
  /** Event drawn at the interlude between districts; applied by the nextDistrict action. */
  pendingEventId: string | null;
  pendingDice: DieFace[]; // last roll, surfaced for the UI
  log: string[];
}

// ----------------------------------------------------------------------------
// Targets & actions
// ----------------------------------------------------------------------------

export type TargetRef =
  | { kind: 'enemy'; uid: string }
  | { kind: 'lord' }
  | { kind: 'hunter'; id: string }
  | { kind: 'zone'; id: string }
  | { kind: 'gadget'; uid: string }
  | { kind: 'self' };

export type Action =
  | { t: 'playCard'; hunter: string; card: string; targets: TargetRef[] }
  | { t: 'move'; hunter: string; toZone: string }
  | { t: 'useGadget'; hunter: string; gadget: string; targets: TargetRef[] }
  | { t: 'endTurn'; hunter: string }
  | { t: 'useUltimate'; hunter: string; targets: TargetRef[] }
  | { t: 'reactCard'; hunter: string; card: string; targets: TargetRef[] }
  | { t: 'advancePhase' } // engine-driven: resolve surge/threat/bloodmoon, start next round
  | { t: 'nextDistrict' }; // from the interlude: apply the drawn Event, enter the next district
