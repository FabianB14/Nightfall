// Zustand store: holds the GameState, dispatches engine Actions, and bridges to audio.
// The engine stays pure — the store is the only place that mutates "the world" the UI sees,
// and the only place that turns engine log/events into sound (§3, §8).
import { create } from 'zustand';
import type { Action, GameState, TargetRef } from '@engine/types';
import { createGame, createRunConfig, applyAction, beginRun } from '@engine/index';
import { cardsById } from '@data/cards';
import { audio } from './audio/audio';

export type Screen = 'menu' | 'play';

interface Store {
  screen: Screen;
  game: GameState | null;
  selectedCard: string | null;
  hoveredCard: string | null;

  newRun: (seed: string, crew: string[], lordCount?: number) => void;
  toMenu: () => void;
  dispatch: (action: Action) => void;
  selectCard: (cardId: string | null) => void;
  setHovered: (cardId: string | null) => void;
  endTurn: () => void;
  moveTo: (zoneId: string) => void;
  playSelected: (targets: TargetRef[]) => void;
}

/** Play sound for the difference an action produced (kept out of the pure engine). */
function reactAudio(before: GameState | null, after: GameState): void {
  if (after.pendingDice.length && before?.pendingDice !== after.pendingDice) {
    audio.playSfx('dice_roll');
  }
  // Scene music follows the situation.
  if (after.activeLord) audio.playMusic('boss');
  else audio.playMusic('combat');
}

export const useStore = create<Store>((set, get) => ({
  screen: 'menu',
  game: null,
  selectedCard: null,
  hoveredCard: null,

  newRun: (seed, crew, lordCount = 3) => {
    const run = createRunConfig({ seed, crew, lordCount });
    const game = beginRun(createGame(seed, run));
    audio.playMusic(game.activeLord ? 'boss' : 'combat');
    set({ screen: 'play', game, selectedCard: null });
  },

  toMenu: () => {
    audio.playMusic('menu');
    set({ screen: 'menu', game: null, selectedCard: null });
  },

  dispatch: (action) => {
    const before = get().game;
    if (!before) return;
    const after = applyAction(before, action);
    reactAudio(before, after);
    set({ game: after, selectedCard: null });
  },

  selectCard: (cardId) => {
    const { selectedCard } = get();
    set({ selectedCard: selectedCard === cardId ? null : cardId });
  },

  setHovered: (cardId) => set({ hoveredCard: cardId }),

  endTurn: () => {
    const game = get().game;
    if (!game?.activeHunter) return;
    get().dispatch({ t: 'endTurn', hunter: game.activeHunter });
  },

  moveTo: (zoneId) => {
    const game = get().game;
    if (!game?.activeHunter) return;
    get().dispatch({ t: 'move', hunter: game.activeHunter, toZone: zoneId });
  },

  playSelected: (targets) => {
    const { game, selectedCard } = get();
    if (!game?.activeHunter || !selectedCard) return;
    const card = cardsById[selectedCard];
    if (!card) return;
    audio.playForCardType(card.type, card.sfx);
    const t = card.type === 'ultimate' ? 'useUltimate' : 'playCard';
    if (t === 'useUltimate') {
      get().dispatch({ t: 'useUltimate', hunter: game.activeHunter, targets });
    } else {
      get().dispatch({ t: 'playCard', hunter: game.activeHunter, card: selectedCard, targets });
    }
  },
}));
