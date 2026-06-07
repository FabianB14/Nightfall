// Zod schemas for all content data (§3, §11 of CLAUDE.md). Content lives in data/ and is
// validated at load; a bad data file must fail loudly in dev. Inferred types are checked
// against the engine's hand-written types via the assertions at the bottom of this file.
import { z } from 'zod';
import type {
  ArchetypeDef,
  CardDef,
  CharacterDef,
  EnemyDef,
  LordDef,
  MutationDef,
  DistrictDef,
  EventDef,
  ThreatCardDef,
  ObjectiveDef,
} from '@engine/types';

const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids must be snake_case');

export const archetypeIdSchema = z.enum([
  'revenant',
  'devout',
  'cursed',
  'conjurer',
  'marksman',
  'maker',
]);

const damageKind = z.enum(['light', 'stake']);
const condition = z.enum(['root', 'stun', 'fear', 'taunt']);
const zoneEffectKind = z.enum(['hallowed', 'burning', 'flooded', 'lit']);

// Effects are recursive (crit clauses contain effects), so declare lazily.
export const effectSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('rollAttack'),
      dice: z.number().int().min(1),
      deal: z.union([damageKind, z.literal('choose')]),
      bypassStagger: z.boolean().optional(),
      perHit: z.object({ light: z.number().optional(), stake: z.number().optional() }).optional(),
      crit: z.array(effectSchema).optional(),
      rerollMisses: z.boolean().optional(),
      lifesteal: z
        .object({ mode: z.enum(['equal', 'flat', 'perHit']), amount: z.number().optional() })
        .optional(),
    }),
    z.object({
      kind: z.literal('fixedLight'),
      amount: z.number().int(),
      radius: z.number().int().optional(),
    }),
    z.object({
      kind: z.literal('fixedDamage'),
      amount: z.number().int(),
      bypassStagger: z.boolean().optional(),
      radius: z.number().int().optional(),
    }),
    z.object({
      kind: z.literal('autoCrit'),
      deal: z.union([damageKind, z.literal('choose')]),
      light: z.number().optional(),
      stake: z.number().optional(),
    }),
    z.object({
      kind: z.literal('heal'),
      amount: z.number().int(),
      target: z.enum(['self', 'ally']),
    }),
    z.object({ kind: z.literal('revive'), toFull: z.boolean() }),
    z.object({
      kind: z.literal('move'),
      zones: z.number().int(),
      toward: z.enum(['vampire', 'enemy']).optional(),
    }),
    z.object({ kind: z.literal('condition'), condition, duration: z.number().int() }),
    z.object({
      kind: z.literal('shield'),
      amount: z.number().int(),
      target: z.enum(['self', 'ally']),
    }),
    z.object({
      kind: z.literal('damageReduction'),
      amount: z.number().int(),
      duration: z.number().int(),
    }),
    z.object({ kind: z.literal('gainResource'), resource: z.string(), amount: z.number().int() }),
    z.object({ kind: z.literal('setResource'), resource: z.string(), amount: z.number().int() }),
    z.object({ kind: z.literal('draw'), amount: z.number().int() }),
    z.object({
      kind: z.literal('discardDraw'),
      discard: z.number().int(),
      draw: z.number().int(),
    }),
    z.object({ kind: z.literal('clearSurge'), amount: z.number().int() }),
    z.object({ kind: z.literal('clearCondition'), amount: z.number().int() }),
    z.object({
      kind: z.literal('mark'),
      bonus: z.number().int(),
      preventHeal: z.boolean().optional(),
    }),
    z.object({ kind: z.literal('extraAction') }),
    z.object({ kind: z.literal('ignoreNextHit') }),
    z.object({ kind: z.literal('deployGadget'), gadget: z.string() }),
    z.object({
      kind: z.literal('summon'),
      hp: z.number().int(),
      dice: z.number().int(),
      bypassStagger: z.boolean().optional(),
      duration: z.number().int().optional(),
    }),
    z.object({
      kind: z.literal('zoneEffect'),
      effect: zoneEffectKind,
      duration: z.number().int(),
      radius: z.number().int().optional(),
    }),
    z.object({
      kind: z.literal('autoStaggerZone'),
      radius: z.number().int(),
      lightPerTurn: z.number().int().optional(),
      duration: z.number().int(),
    }),
    z.object({ kind: z.literal('blessing') }),
    z.object({ kind: z.literal('reduceEnemyDice'), amount: z.number().int() }),
    z.object({
      kind: z.literal('buff'),
      buff: z.string(),
      duration: z.number().int(),
      value: z.number().optional(),
    }),
    z.object({ kind: z.literal('bloodmoon'), amount: z.number().int() }),
  ]),
);

const costSchema = z.object({
  action: z.union([z.literal(0), z.literal(1)]),
  quick: z.boolean().optional(),
  reaction: z.boolean().optional(),
  resource: z.object({ type: z.string(), amount: z.number().int() }).optional(),
});

const unlockSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('starter') }),
  z.object({ kind: z.literal('progression'), afterLordKills: z.number().int() }),
  z.object({ kind: z.literal('achievement'), id: z.string() }),
  z.object({ kind: z.literal('currency'), cost: z.number().int() }),
]);

export const cardSchema = z.object({
  id,
  name: z.string().min(1),
  archetype: archetypeIdSchema,
  slot: z.enum(['spine', 'inherent', 'personal', 'ultimate']),
  type: z.enum([
    'attack',
    'light',
    'heal',
    'utility',
    'gadget',
    'build',
    'curse',
    'movement',
    'summon',
    'ultimate',
    'zone',
  ]),
  cost: costSchema,
  reach: z.enum(['melee', 'ranged', 'self', 'zone']),
  text: z.string().min(1),
  effects: z.array(effectSchema),
  targetKind: z.enum(['enemy', 'vampire', 'ally', 'zone', 'self', 'none']).optional(),
  art: z.string().optional(),
  sfx: z.string().optional(),
  unlock: unlockSchema.optional(),
});

export const archetypeSchema = z.object({
  id: archetypeIdSchema,
  name: z.string(),
  role: z.string(),
  resourceType: z.string().optional(),
  resourceMax: z.number().int().optional(),
  keyword: z.string(),
  spine: z.array(id),
});

export const characterSchema = z.object({
  id,
  name: z.string(),
  archetype: archetypeIdSchema,
  hp: z.number().int().min(1),
  passive: z.string(),
  passiveHooks: z.array(z.string()).optional(),
  resourceType: z.string().optional(),
  inherent: id,
  personal: z.array(id),
  ultimate: id,
  unlock: unlockSchema.optional(),
});

export const enemySchema = z.object({
  id: z.enum(['thrall', 'stalker', 'brute', 'cultist']),
  name: z.string(),
  staggerThreshold: z.number().int().nullable(),
  hp: z.number().int().min(1),
  move: z.number().int().min(0),
  isVampire: z.boolean(),
  attack: z.object({
    damage: z.number().int(),
    reach: z.enum(['melee', 'ranged', 'self', 'zone']),
    moveBefore: z.number().int().optional(),
    knockback: z.number().int().optional(),
  }),
  notes: z.string().optional(),
});

export const lordSchema = z.object({
  id,
  name: z.string(),
  // The Eclipse Heart finale has no stagger track (0); the six Lords use 2–4.
  staggerThreshold: z.number().int().min(0),
  hp: z.number().int().min(1),
  enrageAt: z.number().int().min(0),
  gimmick: z.string(),
  gimmickId: z.string(),
  attackDamage: z.number().int(),
});

export const mutationSchema = z.object({
  id,
  name: z.string(),
  text: z.string(),
  effectId: z.string(),
});

export const objectiveSchema = z.object({ id, name: z.string(), text: z.string() });

export const zoneLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  terrain: z.enum(['lit', 'shadow', 'flooded']),
  adjacent: z.array(z.string()),
});

export const districtSchema = z.object({
  id,
  name: z.string(),
  zones: z.array(zoneLayoutSchema).min(1),
  objectivePool: z.array(id),
  spawnZones: z.array(z.string()).min(1),
});

export const eventSchema = z.object({
  id,
  name: z.string(),
  kind: z.enum(['boon', 'bane']),
  text: z.string(),
  effectId: z.string(),
});

export const threatCardSchema = z.object({
  id,
  name: z.string(),
  count: z.number().int().min(1),
  text: z.string(),
  effectId: z.string(),
});

// Compile-time guarantee that inferred schema types match the engine's hand-written ones.
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _checks: {
  card: AssertEqual<z.infer<typeof cardSchema>, CardDef>;
  archetype: AssertEqual<z.infer<typeof archetypeSchema>, ArchetypeDef>;
  character: AssertEqual<z.infer<typeof characterSchema>, CharacterDef>;
  enemy: AssertEqual<z.infer<typeof enemySchema>, EnemyDef>;
  lord: AssertEqual<z.infer<typeof lordSchema>, LordDef>;
  mutation: AssertEqual<z.infer<typeof mutationSchema>, MutationDef>;
  district: AssertEqual<z.infer<typeof districtSchema>, DistrictDef>;
  event: AssertEqual<z.infer<typeof eventSchema>, EventDef>;
  threat: AssertEqual<z.infer<typeof threatCardSchema>, ThreatCardDef>;
  objective: AssertEqual<z.infer<typeof objectiveSchema>, ObjectiveDef>;
} = {
  card: true,
  archetype: true,
  character: true,
  enemy: true,
  lord: true,
  mutation: true,
  district: true,
  event: true,
  threat: true,
  objective: true,
};
void _checks;
