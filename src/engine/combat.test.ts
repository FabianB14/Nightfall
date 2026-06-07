import { describe, it, expect } from 'vitest';
import type { EnemyState, GameState, LordState } from './types';
import { applyLight, applyStake } from './combat';
import { createRunConfig } from './run';
import { createGame } from './createGame';
import { applyAction, beginRun } from './reducer';

function stalker(): EnemyState {
  return {
    uid: 'e1',
    defId: 'stalker',
    name: 'Stalker',
    zone: 'z',
    hp: 3,
    maxHp: 3,
    staggerThreshold: 2,
    light: 0,
    staggered: false,
    isVampire: true,
    conditions: [],
    mark: null,
    diceDebuff: 0,
  };
}

describe('light → stagger → stake', () => {
  it('Light fills the Stagger Threshold and flips Staggered', () => {
    const e = stalker();
    applyLight(e, 1);
    expect(e.staggered).toBe(false);
    applyLight(e, 1); // total 2 == ST
    expect(e.staggered).toBe(true);
  });

  it('Stake is ignored on an un-staggered vampire', () => {
    const e = stalker();
    const dealt = applyStake(e, 3);
    expect(dealt).toBe(0);
    expect(e.hp).toBe(3);
  });

  it('Stake lands once Staggered', () => {
    const e = stalker();
    applyLight(e, 2);
    const dealt = applyStake(e, 3);
    expect(dealt).toBe(3);
    expect(e.hp).toBe(0);
  });

  it('bypassStagger lets Stake through (Rougarou Rend / Pounce)', () => {
    const e = stalker();
    const dealt = applyStake(e, 2, { bypassStagger: true });
    expect(dealt).toBe(2);
    expect(e.hp).toBe(1);
  });

  it('a Mark adds +1 from all sources to both Light and Stake', () => {
    const e = stalker();
    e.mark = { bonus: 1, preventHeal: false };
    applyLight(e, 1); // 1 + 1 mark = 2 == ST → staggered
    expect(e.staggered).toBe(true);
    const dealt = applyStake(e, 1); // 1 + 1 = 2
    expect(dealt).toBe(2);
  });

  it('thralls take Stake/HP damage anytime (no stagger needed)', () => {
    const thrall: EnemyState = { ...stalker(), defId: 'thrall', isVampire: false, staggerThreshold: null, hp: 2, maxHp: 2 };
    const dealt = applyStake(thrall, 2);
    expect(dealt).toBe(2);
    expect(thrall.hp).toBe(0);
  });

  it('a Lord ignores Stake until Staggered', () => {
    const lord: LordState = {
      defId: 'harbor_lord',
      name: 'Harbor Lord',
      zone: 'z',
      hp: 14,
      maxHp: 14,
      staggerThreshold: 3,
      light: 0,
      staggered: false,
      enraged: false,
      enrageAt: 7,
      gimmickId: 'heal_in_shadow',
      attackDamage: 3,
      mark: null,
    };
    expect(applyStake(lord, 5)).toBe(0);
    applyLight(lord, 3);
    expect(lord.staggered).toBe(true);
    expect(applyStake(lord, 5)).toBe(5);
    expect(lord.hp).toBe(9);
  });
});

describe('a full combat exchange through the reducer', () => {
  function newGame(): GameState {
    const run = createRunConfig({ seed: 'exchange', crew: ['trapper'], lordCount: 1 });
    return beginRun(createGame('exchange', run));
  }

  it("the Trapper's Silver Shot lights then finishes a Stalker", () => {
    let state = newGame();
    const trapper = state.hunters[0];
    // Stack the hand deterministically with two Silver Shots (Trapper starts with 3 rounds).
    state = { ...state, hunters: [{ ...trapper, hand: ['silver_shot', 'silver_shot'], resource: 3 }] };
    const target = state.enemies.find((e) => e.defId === 'stalker')!;

    // First shot: +2 Light (== ST 2 → staggered), then +2 Stake → hp 3-2 = 1.
    state = applyAction(state, {
      t: 'playCard',
      hunter: 'trapper',
      card: 'silver_shot',
      targets: [{ kind: 'enemy', uid: target.uid }],
    });
    const afterFirst = state.enemies.find((e) => e.uid === target.uid)!;
    expect(afterFirst.staggered).toBe(true);
    expect(afterFirst.hp).toBe(1);
    expect(state.hunters[0].resource).toBe(2); // spent one round
    expect(state.hunters[0].charge).toBeGreaterThanOrEqual(1); // HP damage to a vampire charges

    // Second shot finishes it.
    state = applyAction(state, {
      t: 'playCard',
      hunter: 'trapper',
      card: 'silver_shot',
      targets: [{ kind: 'enemy', uid: target.uid }],
    });
    expect(state.enemies.find((e) => e.uid === target.uid)).toBeUndefined(); // dead + cleared
  });

  it('rejects an unaffordable card (no Silver rounds left)', () => {
    let state = newGame();
    const trapper = state.hunters[0];
    state = { ...state, hunters: [{ ...trapper, hand: ['silver_shot'], resource: 0 }] };
    const before = structuredClone(state.enemies);
    state = applyAction(state, {
      t: 'playCard',
      hunter: 'trapper',
      card: 'silver_shot',
      targets: [{ kind: 'enemy', uid: before[0].uid }],
    });
    // Card not played: enemies unchanged, card still in hand.
    expect(state.hunters[0].hand).toContain('silver_shot');
  });
});
