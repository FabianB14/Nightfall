import { describe, it, expect } from 'vitest';
import type { Action, GameState, TargetRef } from './types';
import { createRunConfig } from './run';
import { createGame } from './createGame';
import { applyAction, beginRun } from './reducer';
import { cardsById } from '@data/cards';

describe('run setup (the "every game is different" engine)', () => {
  it('is deterministic for a seed', () => {
    const a = createRunConfig({ seed: 'parish-7', crew: ['trapper', 'pere_ezra'] });
    const b = createRunConfig({ seed: 'parish-7', crew: ['trapper', 'pere_ezra'] });
    expect(a).toEqual(b);
  });

  it('different seeds usually produce different openings', () => {
    const a = createRunConfig({ seed: 'one', crew: ['trapper'] });
    const b = createRunConfig({ seed: 'two', crew: ['trapper'] });
    expect(a.lordSequence.join() + a.districts.join()).not.toEqual(
      b.lordSequence.join() + b.districts.join(),
    );
  });

  it('draws one mutation, district and objective per Lord', () => {
    const cfg = createRunConfig({ seed: 'mut', crew: ['trapper'], lordCount: 3 });
    expect(cfg.lordSequence).toHaveLength(3);
    expect(cfg.districts).toHaveLength(3);
    expect(Object.keys(cfg.mutations)).toHaveLength(3);
    expect(Object.keys(cfg.objectives)).toHaveLength(3);
  });
});

// A simple greedy bot that drives a headless game to completion: each active hunter
// lights/stakes the Lord (or nearest enemy) with whatever is in hand, then ends turn.
function pickTarget(state: GameState, hunter: GameState['hunters'][number]): TargetRef[] {
  // Hand the resolver both a combatant and a zone so any card kind can resolve a target.
  if (state.activeLord) return [{ kind: 'lord' }, { kind: 'zone', id: state.activeLord.zone }, { kind: 'self' }];
  const e = state.enemies[0];
  if (e) return [{ kind: 'enemy', uid: e.uid }, { kind: 'zone', id: e.zone }, { kind: 'self' }];
  return [{ kind: 'self' }, { kind: 'zone', id: hunter.zone }];
}

function botTurn(state: GameState): Action[] {
  const actions: Action[] = [];
  const hunter = state.hunters.find((h) => h.id === state.activeHunter);
  if (!hunter) return actions;
  // Greedy: try to play every card in hand (the reducer rejects anything unaffordable),
  // including the stagger-engine builds/zones, then end the turn.
  for (const cardId of [...hunter.hand]) {
    if (!cardsById[cardId]) continue;
    actions.push({ t: 'playCard', hunter: hunter.id, card: cardId, targets: pickTarget(state, hunter) });
  }
  actions.push({ t: 'endTurn', hunter: hunter.id });
  return actions;
}

describe('a district-into-Lord sequence resolves headlessly', () => {
  function playOut(seed: string, crew: string[]): GameState {
    let state = beginRun(createGame(seed, createRunConfig({ seed, crew, lordCount: 1 })));
    let guard = 0;
    while (state.phase !== 'won' && state.phase !== 'lost' && guard < 400) {
      for (const action of botTurn(state)) {
        state = applyAction(state, action);
        if (state.phase === 'won' || state.phase === 'lost') break;
      }
      guard += 1;
    }
    return state;
  }

  it('reaches a terminal state (win or lose) without throwing', () => {
    const state = playOut('slice-1', ['trapper', 'pere_ezra', 'rougarou']);
    expect(['won', 'lost']).toContain(state.phase);
    expect(state.log.length).toBeGreaterThan(0);
  });

  it('is fully deterministic: same seed → identical outcome', () => {
    const a = playOut('slice-determinism', ['trapper', 'artisan']);
    const b = playOut('slice-determinism', ['trapper', 'artisan']);
    expect(a.phase).toBe(b.phase);
    expect(a.round).toBe(b.round);
    expect(a.log).toEqual(b.log);
    expect(a.bloodmoon).toBe(b.bloodmoon);
  });

  it('clears the final Lord and wins the run (light → stagger → stake → kill)', () => {
    // Drive the full win path deterministically: a staggered, nearly-dead Lord finished
    // with the Trapper's Silver Shot, transitioning the run to "won".
    const run = createRunConfig({ seed: 'kill', crew: ['trapper'], lordCount: 1 });
    let state = beginRun(createGame('kill', run));
    const lord = state.activeLord!;
    state = {
      ...state,
      enemies: [],
      activeLord: { ...lord, hp: 4, light: lord.staggerThreshold, staggered: true },
      hunters: [{ ...state.hunters[0], hand: ['silver_shot', 'silver_shot'], resource: 3, actionsLeft: 2 }],
    };

    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.activeLord!.hp).toBe(2); // +2 Stake landed on the staggered Lord
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.phase).toBe('won');
  });

  it('the UV Rig keeps a Lord staggered across rounds (the stagger engine)', () => {
    // Artisan deploys the UV Rig in the Lord's zone; at the next round start the Lord is
    // re-staggered even though stagger normally clears each round.
    const run = createRunConfig({ seed: 'rig', crew: ['artisan'], lordCount: 1 });
    let state = beginRun(createGame('rig', run));
    const lordZone = state.activeLord!.zone;
    state = {
      ...state,
      enemies: [],
      hunters: [{ ...state.hunters[0], hand: ['uv_rig'], resource: 2, actionsLeft: 2, zone: lordZone }],
    };
    state = applyAction(state, {
      t: 'playCard',
      hunter: 'artisan',
      card: 'uv_rig',
      targets: [{ kind: 'zone', id: lordZone }, { kind: 'lord' }],
    });
    expect(state.gadgets.some((g) => g.type === 'uv_rig')).toBe(true);
    expect(state.activeLord!.staggered).toBe(true); // immediate stagger on deploy

    // End the round; the Lord's light/stagger resets, then the Rig re-applies it.
    state = applyAction(state, { t: 'endTurn', hunter: 'artisan' });
    expect(state.round).toBe(2);
    expect(state.activeLord!.staggered).toBe(true);
  });
});
