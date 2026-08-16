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
    // 3 drawn Lords + the Eclipse Heart finale; mutations/objectives only for the regular Lords.
    expect(cfg.lordSequence).toHaveLength(4);
    expect(cfg.lordSequence[3]).toBe('eclipse_heart');
    expect(cfg.districts).toHaveLength(4);
    expect(cfg.districts[3]).toBe('drowned_cathedral');
    expect(Object.keys(cfg.mutations)).toHaveLength(3);
    expect(Object.keys(cfg.objectives)).toHaveLength(3);
    expect(cfg.events).toHaveLength(3);
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
  if (state.phase === 'interlude') return [{ t: 'nextDistrict' }];
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

  it('clearing a Lord opens the interlude with a drawn Event, then the next district', () => {
    // Kill the (only) regular Lord: the run pauses at the interlude instead of ending,
    // reveals the drawn Event, and nextDistrict leads into the Eclipse Heart finale.
    const run = createRunConfig({ seed: 'kill', crew: ['trapper'], lordCount: 1 });
    let state = beginRun(createGame('kill', run));
    const lord = state.activeLord!;
    state = {
      ...state,
      enemies: [],
      // vents/mutations stripped so the stake lands on the Lord itself
      activeLord: { ...lord, hp: 4, light: lord.staggerThreshold, staggered: true, vents: undefined, mutationId: undefined },
      hunters: [{ ...state.hunters[0], hand: ['silver_shot', 'silver_shot'], resource: 3, actionsLeft: 2 }],
    };

    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.activeLord!.hp).toBe(2); // +2 Stake landed on the staggered Lord
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });

    expect(state.phase).toBe('interlude');
    expect(state.pendingEventId).toBe(run.events[0]);
    expect(state.activeLord).toBeNull();

    state = applyAction(state, { t: 'nextDistrict' });
    if (state.phase !== 'lost') {
      // (The Moon Lurches can theoretically end a doomed run here; not with this seed.)
      expect(state.phase).toBe('crew');
      expect(state.activeLord!.defId).toBe('eclipse_heart');
      expect(state.activeLord!.wards).toBeDefined();
      expect(state.zones.map((z) => z.id)).toContain('sanctum');
    }
  });

  it('the Eclipse Heart: light exposes a Ward, stakes break it, all Wards down wins', () => {
    const run = createRunConfig({ seed: 'finale', crew: ['trapper'], lordCount: 1 });
    let state = beginRun(createGame('finale', run));
    // Kill the regular Lord with an action so no enemy turn can heal it back.
    const lord0 = state.activeLord!;
    state = {
      ...state,
      enemies: [],
      activeLord: { ...lord0, hp: 2, light: lord0.staggerThreshold, staggered: true, vents: undefined, mutationId: undefined },
      hunters: [{ ...state.hunters[0], hand: ['silver_shot'], resource: 3, actionsLeft: 2 }],
    };
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.phase).toBe('interlude');
    state = applyAction(state, { t: 'nextDistrict' });
    if (state.phase === 'lost') return; // a doomed-run bane; not with this seed
    expect(state.activeLord!.defId).toBe('eclipse_heart');

    // Weaken the Wards so two Silver Shots per Ward finish the job deterministically.
    state = structuredClone(state);
    state.activeLord!.wards = { ...state.activeLord!.wards!, hp: [2, 2, 2], exposed: null };
    state.activeLord!.hp = 6;
    state.enemies = [];
    const heartZone = state.activeLord!.zone;

    // No Ward exposed → stake damage is ignored entirely.
    state.hunters[0] = { ...state.hunters[0], hand: ['silver_shot', 'silver_shot', 'silver_shot'], resource: 3, actionsLeft: 2, zone: heartZone };
    const before = state.activeLord!.hp;
    // Each Silver Shot first lights (exposing/rotating a Ward), then stakes the exposed Ward.
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.activeLord!.hp).toBe(before - 2); // one 2-HP Ward shattered
    expect(state.activeLord!.wards!.exposed).toBeNull(); // exposure closes when a Ward breaks

    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.activeLord!.hp).toBe(before - 4);

    // Third shot needs actions again — give them back and finish it.
    state = structuredClone(state);
    state.hunters[0].actionsLeft = 2;
    state.hunters[0].resource = 1;
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.phase).toBe('won');
  });

  it('between-district recovery is not a full heal, and downed hunters stand at half HP', () => {
    const run = createRunConfig({ seed: 'recover', crew: ['trapper', 'pere_ezra'], lordCount: 1 });
    let state = beginRun(createGame('recover', run));
    const lord0 = state.activeLord!;
    state = {
      ...state,
      enemies: [],
      activeLord: { ...lord0, hp: 2, light: lord0.staggerThreshold, staggered: true, vents: undefined, mutationId: undefined },
    };
    state.hunters[0] = { ...state.hunters[0], hp: 2, hand: ['silver_shot'], resource: 3, actionsLeft: 2 };
    state.hunters[1] = { ...state.hunters[1], hp: 0, downed: true };
    state = applyAction(state, { t: 'playCard', hunter: 'trapper', card: 'silver_shot', targets: [{ kind: 'lord' }] });
    expect(state.phase).toBe('interlude');
    state = applyAction(state, { t: 'nextDistrict' });
    if (state.phase === 'lost') return; // a bane event can end a doomed run
    const trapper = state.hunters.find((h) => h.id === 'trapper')!;
    const ezra = state.hunters.find((h) => h.id === 'pere_ezra')!;
    expect(ezra.downed).toBe(false);
    // Stands at half HP, plus 3 if the Safe House boon happened to be drawn.
    expect(ezra.hp).toBeGreaterThanOrEqual(Math.ceil(ezra.maxHp / 2));
    // No free full heal unless the Safe House boon was drawn.
    if (run.events[0] !== 'safe_house') expect(trapper.hp).toBeLessThan(trapper.maxHp);
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
      // Beefy HP so a (possibly Swift) Lord's reprisals can't down the solo Artisan mid-test.
      hunters: [{ ...state.hunters[0], hp: 30, maxHp: 30, hand: ['uv_rig'], resource: 2, actionsLeft: 2, zone: lordZone }],
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
