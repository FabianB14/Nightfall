// Public engine surface. The UI imports from here; everything below is pure (§3/§4).
export * from './types';
export { Rng, hashSeed, withRng } from './rng';
export { createRunConfig } from './run';
export type { RunOptions } from './run';
export { createGame, setupDistrict, buildDeck, makeEnemy } from './createGame';
export { applyAction, beginRun, runEnemyRound, startHunterTurn } from './reducer';
export {
  applyLight,
  applyStake,
  rollAttackDice,
  drawCards,
  resolveCombatant,
  applyEffects,
} from './combat';
export { zoneDistance, damageHunter, drawThreat, resolveSurges, lordAct } from './threat';
