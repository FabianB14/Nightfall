// Zustand store: holds the GameState, dispatches engine Actions, and bridges to audio.
// The engine stays pure — the store is the only place that mutates "the world" the UI sees,
// and the only place that turns engine log/events into sound (§3, §8).
import { create } from 'zustand';
import type { Action, GameState, TargetRef } from '@engine/types';
import { createGame, createRunConfig, applyAction, beginRun } from '@engine/index';
import { cardsById } from '@data/cards';
import { audio } from './audio/audio';
import {
  loadProgress,
  saveProgress,
  loadDecks,
  saveDecks,
  type PlayerProgress,
  type SavedDeck,
} from './services/progress';

export type Screen = 'title' | 'crew' | 'decks' | 'play';

interface Store {
  screen: Screen;
  game: GameState | null;
  selectedCard: string | null;
  hoveredCard: string | null;
  progress: PlayerProgress;
  decks: SavedDeck[];

  goTitle: () => void;
  goCrew: () => void;
  goDecks: () => void;
  newRun: (seed: string, crew: string[], lordCount?: number, deckByChar?: Record<string, string[]>) => void;
  toMenu: () => void;
  saveDeck: (deck: SavedDeck) => void;
  deleteDeck: (deckId: string) => void;
  dispatch: (action: Action) => void;
  selectCard: (cardId: string | null) => void;
  setHovered: (cardId: string | null) => void;
  endTurn: () => void;
  nextDistrict: () => void;
  moveTo: (zoneId: string) => void;
  playSelected: (targets: TargetRef[]) => void;
}

/** Play sound for the difference an action produced (kept out of the pure engine). */
function reactAudio(before: GameState | null, after: GameState): void {
  if (after.pendingDice.length && before?.pendingDice !== after.pendingDice) {
    audio.playSfx('dice_roll');
  }
  // Scene music follows the situation.
  if (after.phase === 'interlude' || after.phase === 'won' || after.phase === 'lost') {
    audio.playMusic('menu');
  } else if (after.activeLord) {
    audio.playMusic('boss');
  } else {
    audio.playMusic('combat');
  }
}

export const useStore = create<Store>((set, get) => ({
  screen: 'title',
  game: null,
  selectedCard: null,
  hoveredCard: null,
  progress: loadProgress(),
  decks: loadDecks(),

  goTitle: () => {
    audio.playMusic('menu');
    set({ screen: 'title', game: null, selectedCard: null });
  },

  goCrew: () => {
    audio.playMusic('menu');
    set({ screen: 'crew', game: null, selectedCard: null });
  },

  goDecks: () => {
    audio.playMusic('menu');
    set({ screen: 'decks', game: null, selectedCard: null });
  },

  newRun: (seed, crew, lordCount = 3, deckByChar) => {
    const run = createRunConfig({ seed, crew, lordCount, decks: deckByChar });
    const game = beginRun(createGame(seed, run));
    const progress = { ...get().progress, runs: get().progress.runs + 1 };
    saveProgress(progress);
    audio.playMusic(game.activeLord ? 'boss' : 'combat');
    set({ screen: 'play', game, selectedCard: null, progress });
  },

  saveDeck: (deck) => {
    const decks = [...get().decks.filter((d) => d.id !== deck.id), deck];
    saveDecks(decks);
    set({ decks });
  },

  deleteDeck: (deckId) => {
    const decks = get().decks.filter((d) => d.id !== deckId);
    saveDecks(decks);
    set({ decks });
  },

  toMenu: () => {
    audio.playMusic('menu');
    set({ screen: 'title', game: null, selectedCard: null });
  },

  dispatch: (action) => {
    const before = get().game;
    if (!before) return;
    const after = applyAction(before, action);
    reactAudio(before, after);

    // Progression: a Lord death moves the run to the interlude (or 'won' for the Heart).
    const lordFell =
      before.activeLord !== null &&
      before.phase !== 'interlude' &&
      (after.phase === 'interlude' || after.phase === 'won');
    if (lordFell) {
      const progress = {
        ...get().progress,
        lordKills: get().progress.lordKills + 1,
        wins: get().progress.wins + (after.phase === 'won' ? 1 : 0),
      };
      saveProgress(progress);
      set({ game: after, selectedCard: null, progress });
      return;
    }

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

  nextDistrict: () => {
    const game = get().game;
    if (game?.phase !== 'interlude') return;
    get().dispatch({ t: 'nextDistrict' });
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
