// Thin Howler wrapper with a registry (§8 of CLAUDE.md). Adding a sound = drop the file in
// public/assets/audio/... and add one line below. Audio stays OUT of the engine: the UI
// plays sounds in response to engine log/events. A missing key is silent, never throws.
import { Howl, Howler } from 'howler';
import type { CardType } from '@engine/types';

const SFX: Record<string, string> = {
  stake_hit: '/assets/audio/sfx/stake_hit.mp3',
  light_flare: '/assets/audio/sfx/light_flare.mp3',
  stagger: '/assets/audio/sfx/stagger.mp3',
  surge: '/assets/audio/sfx/surge.mp3',
  dice_roll: '/assets/audio/sfx/dice_roll.mp3',
  card_play: '/assets/audio/sfx/card_play.mp3',
  heal: '/assets/audio/sfx/heal.mp3',
  // add a line per new sound
};

const MUSIC: Record<string, string> = {
  menu: '/assets/audio/music/menu.mp3',
  combat: '/assets/audio/music/combat.mp3',
  boss: '/assets/audio/music/boss.mp3',
};

/** Default sfx key for a card type when the card declares none. */
const TYPE_SFX: Partial<Record<CardType, string>> = {
  attack: 'stake_hit',
  light: 'light_flare',
  heal: 'heal',
  ultimate: 'stagger',
  gadget: 'card_play',
  build: 'card_play',
  zone: 'light_flare',
};

const STORAGE_KEY = 'nightfall.audio';

interface AudioSettings {
  volume: number;
  muted: boolean;
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AudioSettings;
  } catch {
    /* ignore */
  }
  return { volume: 0.6, muted: false };
}

function saveSettings(s: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let settings = loadSettings();
let currentMusic: Howl | null = null;
let currentMusicKey: string | null = null;
const cache = new Map<string, Howl>();
const failed = new Set<string>(); // assets that 404'd — don't retry (and stop the noise)

/** True when there's no audio support (jsdom/headless) — skip everything cleanly. */
function silent(): boolean {
  return Howler.noAudio === true || typeof window === 'undefined';
}

// Respect Vite's base path so audio resolves under a repo subpath on Pages.
const BASE = import.meta.env.BASE_URL;
function withBase(src: string): string {
  return BASE + src.replace(/^\//, '');
}

function get(src: string, loop = false): Howl {
  let howl = cache.get(src);
  if (!howl) {
    howl = new Howl({
      src: [withBase(src)],
      loop,
      html5: loop,
      volume: settings.volume,
      onloaderror: () => failed.add(src), // asset not present yet — mark and forget
    });
    cache.set(src, howl);
  }
  return howl;
}

export const audio = {
  playSfx(key: string): void {
    if (silent()) return;
    const src = SFX[key];
    if (!src || failed.has(src)) return; // missing key/asset = silent
    try {
      get(src).play();
    } catch {
      /* asset not present yet — silent */
    }
  },

  /** Play the default sound for a card type (used when a card declares no sfx). */
  playForCardType(type: CardType, explicit?: string): void {
    this.playSfx(explicit ?? TYPE_SFX[type] ?? 'card_play');
  },

  playMusic(key: string): void {
    if (silent()) return;
    if (currentMusicKey === key) return;
    const src = MUSIC[key];
    if (!src || failed.has(src)) return;
    this.stopMusic();
    try {
      const track = get(src, true);
      track.volume(settings.muted ? 0 : settings.volume);
      track.play();
      currentMusic = track;
      currentMusicKey = key;
    } catch {
      /* asset not present yet */
    }
  },

  stopMusic(): void {
    currentMusic?.stop();
    currentMusic = null;
    currentMusicKey = null;
  },

  setVolume(v: number): void {
    settings = { ...settings, volume: v };
    saveSettings(settings);
    Howler.volume(settings.muted ? 0 : v);
  },

  mute(on: boolean): void {
    settings = { ...settings, muted: on };
    saveSettings(settings);
    Howler.mute(on);
  },

  getSettings(): AudioSettings {
    return { ...settings };
  },
};

// Apply persisted settings on load.
Howler.volume(settings.muted ? 0 : settings.volume);
Howler.mute(settings.muted);
