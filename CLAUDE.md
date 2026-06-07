# CLAUDE.md — Nightfall: Last Light

This file is the build context for Claude Code. Read it fully before writing code.
The game design lives in `/docs` — treat those as the source of truth for rules and content.

---

## 1. What we're building

**Nightfall: Last Light** is a cooperative, turn-based, card-and-dice vampire **boss-rush** game for the web (1–4 players, online-optional; ships single-player/local first). Players pick a crew of **Hunters**, each a character belonging to an **archetype** (class), and fight through randomized districts to kill **Vampire Lords**, then a final boss (the **Eclipse Heart**), to bring back the sun. Setting is Gulf Coast / bayou Gothic.

Full design + all card/enemy numbers:
- `docs/design-doc.md` — rules, archetypes, the variability ("every game is different") engine.
- `docs/cards-and-enemies.md` — every card with exact numbers, all enemies, all Lords, the Threat Deck.

**The one rule that defines combat:** vampires ignore damage unless **Staggered**. You fill a vampire's **Stagger Threshold** with **Light**, then **Stake** it for HP damage. Build everything around this loop.

---

## 2. Tech stack (use exactly this unless you flag a reason)

- **Language:** TypeScript (strict mode on).
- **Build/dev:** Vite.
- **UI:** React 18 + function components + hooks.
- **Styling:** Tailwind CSS, plus the design tokens in §6 as CSS variables.
- **State:** Zustand (one store; the engine is separate and pure — see §4).
- **Validation:** Zod (validate all content data files against schemas at load).
- **Animation:** Framer Motion (card draws, dice, light/stagger flashes).
- **Audio:** Howler.js (via the audio manager in §8).
- **Tests:** Vitest + React Testing Library. The engine must have unit tests.
- **Lint/format:** ESLint + Prettier.
- **Backend (Phase 8, optional):** Supabase (Postgres + Auth + Storage). No custom server needed to start.
- **Hosting:** frontend on Vercel or Netlify (free tier); Supabase free tier for backend.

Keep dependencies minimal. Do not add a game framework (Phaser/Pixi) — this is turn-based; React + SVG/CSS is the right tool and is far easier to maintain.

---

## 3. Repo layout

```
nightfall/
├── CLAUDE.md                  # this file
├── README.md
├── docs/
│   ├── design-doc.md          # rules (source of truth)
│   └── cards-and-enemies.md   # all card/enemy numbers (source of truth)
├── public/
│   └── assets/
│       ├── cards/             # card art, named by card id: crimson_step.webp
│       ├── art/               # backgrounds, portraits, map tiles
│       └── audio/
│           ├── sfx/           # one-shot sounds: stake_hit.mp3, etc.
│           └── music/         # loops: menu.mp3, combat.mp3, boss.mp3
├── src/
│   ├── engine/                # PURE TypeScript. No React, no DOM, no I/O.
│   │   ├── types.ts           # GameState, Action, Card, Character, Enemy, Lord...
│   │   ├── createGame.ts      # builds initial GameState from a run config
│   │   ├── reducer.ts         # applyAction(state, action): GameState  (pure)
│   │   ├── combat.ts          # dice, light→stagger→stake, surge resolution
│   │   ├── threat.ts          # Threat Deck draw + enemy behavior
│   │   ├── run.ts             # run setup: lord draw, mutations, districts, events
│   │   ├── rng.ts             # SEEDED RNG (see §5)
│   │   └── index.ts
│   ├── data/                  # CONTENT as data. Validated by Zod schemas.
│   │   ├── schema.ts          # Zod schemas + inferred TS types for all content
│   │   ├── archetypes.ts      # the 6 archetypes + their shared spine cards
│   │   ├── characters.ts      # the 8 characters (inherent/personal/ultimate cards)
│   │   ├── enemies.ts         # Thrall, Stalker, Brute, Cultist
│   │   ├── lords.ts           # the 6 Vampire Lords + Eclipse Heart
│   │   ├── mutations.ts       # Lord mutations
│   │   ├── districts.ts       # district maps + objectives
│   │   ├── events.ts          # between-district events
│   │   └── threatDeck.ts      # the Threat Deck
│   ├── ui/
│   │   ├── Card.tsx           # renders any card from data (see §7)
│   │   ├── Hand.tsx  Board.tsx  Zone.tsx  EnemyToken.tsx  HunterToken.tsx
│   │   ├── BloodmoonTrack.tsx  DiceTray.tsx  DeckBuilder.tsx  RunSetup.tsx
│   │   └── ...
│   ├── audio/audio.ts         # Howler registry + manager (see §8)
│   ├── theme/tokens.ts        # colors, archetype colors (see §6)
│   ├── store.ts               # Zustand store: holds GameState, dispatches actions
│   ├── assets.ts              # resolveCardArt() + asset path helpers (see §7)
│   └── main.tsx
├── tests/                     # engine unit tests live next to engine too (*.test.ts)
└── (config files)
```

**Hard architectural rule:** `src/engine` and `src/data` must never import from `src/ui`, `react`, or anything browser-specific. The engine is a pure state machine: `applyAction(state, action) -> newState`. The UI only renders state and dispatches actions. This is what lets us test the rules headlessly and (later) run them on a server for multiplayer/anti-cheat.

---

## 4. Engine model (the core data shapes)

Define these in `src/engine/types.ts`. This is a starting skeleton — expand to match `docs/cards-and-enemies.md` exactly.

```ts
export type CardType =
  | 'attack' | 'light' | 'heal' | 'utility' | 'gadget' | 'build'
  | 'curse' | 'movement' | 'summon' | 'ultimate';

export type Reach = 'melee' | 'ranged' | 'self' | 'zone';

export type ArchetypeId =
  | 'revenant' | 'devout' | 'cursed' | 'conjurer' | 'marksman' | 'maker';

export interface Cost {
  action: 0 | 1;          // 0 = Quick
  quick?: boolean;        // free, once per turn
  reaction?: boolean;     // playable on enemy turn
  resource?: { type: string; amount: number }; // e.g. { type: 'faith', amount: 1 }
}

export interface CardDef {
  id: string;             // 'crimson_step'  (also the art filename + sfx key)
  name: string;           // 'Crimson Step'
  archetype: ArchetypeId;
  slot: 'spine' | 'inherent' | 'personal' | 'ultimate';
  type: CardType;
  cost: Cost;
  reach: Reach;
  text: string;           // human-readable rules text (from the design doc)
  // Machine-readable effect. Prefer a small composable effect list over bespoke code.
  effects: Effect[];
  art?: string;           // defaults to id; resolved by resolveCardArt()
  sfx?: string;           // defaults to a type-based sound
  unlock?: UnlockReq;     // see §9; omit = always available (starter)
}

// Effects are data, interpreted by combat.ts. Keep the set small and reusable.
export type Effect =
  | { kind: 'rollAttack'; dice: number; deal: 'light' | 'stake' | 'choose' }
  | { kind: 'fixedLight'; amount: number }
  | { kind: 'fixedDamage'; amount: number; needsStagger?: boolean }
  | { kind: 'heal'; amount: number; target: 'self' | 'ally' }
  | { kind: 'move'; zones: number }
  | { kind: 'root' | 'stun' | 'taunt' | 'fear'; duration: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'gainResource'; resource: string; amount: number }
  | { kind: 'deployGadget'; gadget: string }
  | { kind: 'mark'; bonus: number }
  | { kind: 'clearSurge'; amount: number }
  // ...extend as needed; every card in the docs must be expressible here.

export interface CharacterDef {
  id: string;             // 'dhampir'
  name: string;           // 'The Dhampir'
  archetype: ArchetypeId;
  hp: number;
  passive: string;        // rules text; implement as hooks in reducer where needed
  resourceType?: string;  // 'bloodlust' | 'faith' | 'curse' | 'scrap' | ...
  inherent: string;       // card id
  personal: string[];     // card ids
  ultimate: string;       // card id
  unlock?: UnlockReq;
}

export interface EnemyDef {
  id: 'thrall' | 'stalker' | 'brute' | 'cultist';
  staggerThreshold: number | null; // null = no stagger needed (thralls, humans)
  hp: number;
  move: number;
  // attack + special described as data the threat resolver reads
}

export interface LordDef {
  id: string; name: string;
  staggerThreshold: number;
  hp: number; enrageAt: number;   // phase 2 threshold
  gimmick: string;                // rules text; implemented via lord hooks
}

export interface GameState {
  seed: string;
  rngCursor: number;
  round: number;
  phase: 'crew' | 'surge' | 'threat' | 'bloodmoon';
  bloodmoon: number;              // doom clock
  zones: Zone[];                  // the map (lit/shadow/flooded per zone)
  hunters: HunterState[];         // per-player character state (hp, hand, deck, discard, resource, charge, surge[])
  enemies: EnemyState[];
  activeLord?: LordState;
  threatDeck: string[]; threatDiscard: string[];
  log: string[];
}

export type Action =
  | { t: 'playCard'; hunter: string; card: string; targets: TargetRef[] }
  | { t: 'move'; hunter: string; toZone: string }
  | { t: 'useGadget'; hunter: string; gadget: string; targets: TargetRef[] }
  | { t: 'endTurn'; hunter: string }
  | { t: 'useUltimate'; hunter: string; targets: TargetRef[] }
  | { t: 'reactCard'; hunter: string; card: string; targets: TargetRef[] };
```

`applyAction` must be **pure and deterministic** given `(state, action)` — all randomness comes from the seeded RNG read off `state` (see §5). No `Math.random()` anywhere in the engine.

---

## 5. Determinism & RNG (important)

All randomness (dice, deck shuffles, threat draws, lord/mutation/district draws) goes through one **seeded RNG** in `src/engine/rng.ts` (use `mulberry32` or `seedrandom`). The seed and a cursor live in `GameState`, so:
- The same seed + same actions always produce the same game (replays, debugging, save/resume).
- Later, a server can re-simulate to validate a client (anti-cheat for unlocks/leaderboards).
- Never call `Math.random()` in `engine/` or `data/`.

A run's variability (which 3 Lords, their mutations, district order, events) is rolled once at run creation in `run.ts` using the seed, then stored in state.

---

## 6. Theme tokens (the look)

Gulf Coast Gothic: blue-black night, eclipse-red moon, light is the only warmth. Put these in `src/theme/tokens.ts` and expose as CSS variables (and Tailwind theme extension).

```ts
export const colors = {
  night:      '#0B0E1A',  // app background
  surface:    '#161C2E',  // panels
  cardFace:   '#1B2236',  // card body
  cardBorder: '#2C3550',
  eclipse:    '#C2362F',  // bloodmoon / danger / the dead sun
  lantern:    '#F2B95C',  // LIGHT / lit zones / hope
  swamp:      '#A9B24E',  // bayou accents
  bone:       '#ECE6D6',  // primary text
  muted:      '#9AA0B5',  // secondary text
};

export const archetypeColors: Record<ArchetypeId, string> = {
  revenant: '#B11E2F',  // crimson  (blood)
  devout:   '#E6B84A',  // gold     (faith/light)
  cursed:   '#7A4FA3',  // violet   (the curse)
  conjurer: '#1FA398',  // teal     (hoodoo)
  marksman: '#4A6FA5',  // steel    (silver/precision)
  maker:    '#C8742E',  // copper   (gadgets/scrap)
};
```

**Card anatomy** (see `Card.tsx`, §7): top banner in the card's archetype color holding the cost badge (left) and card type (right); then name; then the art window; then effect text; then a footer tag (Starter / Inherent / Unlockable). Ultimates get a glowing gold frame regardless of archetype.

**Map/board:** zones are nodes/regions. Lit zones glow `lantern`; shadow zones are darkened toward `night` with a cool overlay; flooded zones get a translucent blue tint. The Bloodmoon track is a red moon at the top that fills toward `eclipse` as the doom clock rises.

---

## 7. Card rendering + the "easy images" system

`Card.tsx` renders **any** card purely from its `CardDef` — never hardcode a card. One component, all ~80 cards.

Art resolution in `src/assets.ts`:

```ts
// Card art is optional. If the file is missing, render the placeholder frame.
export function resolveCardArt(card: CardDef): string {
  return `/assets/cards/${card.art ?? card.id}.webp`;
}
```

`Card.tsx` shows an `<img>` with `onError` → swap to a placeholder (archetype-colored frame + the card name + a faint icon). **This means: build and play the whole game with no art, then add an image by simply dropping `public/assets/cards/<card_id>.webp` into the folder. No code change.** Use `.webp` (small, fast); accept `.png` fallback.

For remote/CDN art later (Supabase Storage or community packs), make `resolveCardArt` consult an optional manifest map `{ cardId: url }` before falling back to the local path. Keep that swap behind one function so nothing else changes.

Same idea for character portraits (`/assets/art/portraits/<character_id>.webp`) and map tiles.

---

## 8. Audio system ("easy to add sounds and music")

`src/audio/audio.ts` is a thin Howler wrapper with a registry. Adding a sound = drop the file in `public/assets/audio/...` and add one line to the registry.

```ts
import { Howl, Howler } from 'howler';

const SFX: Record<string, string> = {
  stake_hit:   '/assets/audio/sfx/stake_hit.mp3',
  light_flare: '/assets/audio/sfx/light_flare.mp3',
  stagger:     '/assets/audio/sfx/stagger.mp3',
  surge:       '/assets/audio/sfx/surge.mp3',
  dice_roll:   '/assets/audio/sfx/dice_roll.mp3',
  card_play:   '/assets/audio/sfx/card_play.mp3',
  // add a line per new sound
};

const MUSIC: Record<string, string> = {
  menu:   '/assets/audio/music/menu.mp3',
  combat: '/assets/audio/music/combat.mp3',
  boss:   '/assets/audio/music/boss.mp3',
};

const cache = new Map<string, Howl>();
function get(src: string, loop = false) {
  if (!cache.has(src)) cache.set(src, new Howl({ src: [src], loop, html5: loop }));
  return cache.get(src)!;
}

export const audio = {
  playSfx(key: string) { const s = SFX[key]; if (s) get(s).play(); },        // missing key = silent, never throws
  playMusic(key: string) { /* stop current track, fade in MUSIC[key] (loop) */ },
  stopMusic() { /* fade out */ },
  setVolume(v: number) { Howler.volume(v); },   // persist to localStorage
  mute(on: boolean) { Howler.mute(on); },
};
```

- Cards may declare an `sfx` key; otherwise fall back to a default sound for that card `type`.
- The UI layer calls `audio.playSfx(...)` in response to engine events (keep audio OUT of the engine — the engine just produces a log/events; the UI plays sound). 
- Music is set per scene: menu → `menu`, in a district → `combat`, in a Lord fight → `boss`.
- Settings (master volume, mute, music on/off) persist in `localStorage`. (localStorage is fine here — this is a real app, not a claude.ai artifact.)

---

## 9. Unlock system (cards, characters, decks)

Content can be locked. Add an optional `unlock` field to `CardDef` and `CharacterDef`:

```ts
export type UnlockReq =
  | { kind: 'starter' }                                   // available from the start (or omit field)
  | { kind: 'progression'; afterLordKills: number }       // e.g. kill 3 Lords total
  | { kind: 'achievement'; id: string }                   // 'win_with_no_heals'
  | { kind: 'currency'; cost: number };                   // spend run currency / "embers"
```

- A `useUnlocks()` selector returns the set of unlocked content ids for the current player.
- Locked content shows greyed-out in the **Deck Builder** and **Run Setup** with its unlock condition.
- **Phase 1 (no backend):** store unlocks + achievement progress in `localStorage`.
- **Phase 8 (backend):** move the unlock set to Supabase per user (see §10) so it follows them across devices; validate progression server-side later if needed (we have deterministic replays for this).

Decks: a saved deck = `{ id, name, characterId, cardIds: string[] }`. Validate against unlocks + archetype rules (spine cards are auto-included; personal/inherent/ultimate must belong to the chosen character or be unlocked variants).

---

## 10. Backend (Phase 8 — optional, do last)

Use **Supabase** (Postgres + Auth + Storage). No custom server to run; the client uses the Supabase JS SDK. (If a custom Node/Express API on Render.com is preferred later, the same schema applies — but start with Supabase to avoid hosting a server.)

Tables (with Row Level Security so each user only sees their own rows):
- `profiles` — `id (= auth uid)`, `display_name`, `created_at`.
- `decks` — `id`, `user_id`, `name`, `character_id`, `card_ids text[]`, `updated_at`.
- `unlocks` — `user_id`, `content_id`, `unlocked_at` (PK: user_id + content_id).
- `saves` — `id`, `user_id`, `seed`, `state jsonb`, `updated_at` (resume a run).
- (later) `runs` / `leaderboard` — `user_id`, `seed`, `result`, `lords_killed`, `time`.

Auth: email magic-link + an OAuth provider. Gate save/sync behind login; the game is fully playable logged-out with localStorage, and we **migrate local data into Supabase on first login**.

Storage: an optional bucket for community/custom card art packs (feeds the manifest in §7).

Keep all Supabase calls in `src/services/` behind a small interface so the engine/UI never import the SDK directly. The game must keep working offline if the backend is down.

---

## 11. Conventions

- TypeScript strict. No `any` (use `unknown` + narrowing). Prefer discriminated unions (see `Action`, `Effect`, `UnlockReq`).
- Pure functions in `engine/`; side effects (audio, storage, network) only in `ui/` and `services/`.
- Content lives in `data/`, validated by Zod at startup; a bad data file should fail loudly in dev.
- Card/character/enemy ids are `snake_case` and stable (they're used as art/sfx keys and DB values) — never rename an id casually.
- Components are small and presentational; logic goes in the store or engine.
- Every engine module gets unit tests. Aim to test: a full combat exchange (light → stagger → stake), surge resolution, the threat deck loop, and a complete district-into-Lord sequence.
- Accessibility: keyboard-playable, focus states, aria labels on tokens/cards, respect `prefers-reduced-motion` (gate Framer Motion).
- Commit small; conventional commit messages.

---

## 12. Build order (milestones — do them in order)

Each milestone is a self-contained task. The user may paste these to you one at a time. Finish and verify (tests/`npm run dev`) before moving on. Always re-read `/docs` for exact numbers.

**M0 — Scaffold.** Vite + React + TS (strict) + Tailwind + Zustand + Zod + Framer Motion + Howler + Vitest + ESLint/Prettier. Create the folder structure in §3. Wire the theme tokens (§6) into Tailwind + CSS variables. App renders a themed empty shell. Commit.

**M1 — Engine types & content schemas.** Implement `engine/types.ts` and `data/schema.ts` (Zod) covering every field needed by the docs. Add `rng.ts` (seeded). No game logic yet — just types + a `validateContent()` that throws on bad data.

**M2 — Content data.** Encode all content from `docs/cards-and-enemies.md` into `data/`: 6 archetypes + spines, 8 characters (inherent/personal/ultimate), 4 enemies, 6 Lords + Eclipse Heart, mutations, districts, events, the Threat Deck. Every card's `effects` must be expressible with the `Effect` union — extend the union if the docs need it. Validate all of it.

**M3 — Combat engine + tests.** `combat.ts`: the Combat Die, rolling, light→stagger→stake, Surge tokens + end-of-turn resolution, damage/shield/heal, Ultimate charge. `reducer.ts`: `applyAction` for play/move/endTurn/ultimate/react. `threat.ts`: draw + resolve enemy behavior. `run.ts`: seeded run setup (lord/mutation/district/event draws). Unit-test a full exchange and a district-into-Lord sequence headlessly.

**M4 — Card UI.** `Card.tsx` rendering any `CardDef` with the §6 anatomy + `resolveCardArt` placeholder system. `Hand`, deck/discard counters, hover/zoom. No board yet — render a hand of one character's deck.

**M5 — Board UI.** `Board`/`Zone` with lit/shadow/flooded states, hunter + enemy tokens, the Bloodmoon track, a dice tray. Render a static `GameState`.

**M6 — Vertical slice (the milestone that proves the game is fun).** Wire engine ↔ store ↔ UI so one player can play one full district against one Lord (e.g. the Trapper vs a Stalker+Brute wave into the Harbor Lord). Turn flow, targeting, enemy turns, win/lose. This is the playtest build — tune numbers here against `docs` §10 targets.

**M7 — Run setup & variability.** Crew select (1–4 hunters), the lord-draw / mutation / district / event engine surfaced in UI, full boss-rush loop to the Eclipse Heart.

**M8 — Audio.** Implement `audio.ts`; hook sfx to engine events in the UI; scene music; settings panel (volume/mute) persisted to localStorage.

**M9 — Deck builder + unlocks (local).** Build/save decks (localStorage), unlock system per §9 with progression tracking, locked content shown with conditions.

**M10 — Backend (optional).** Supabase auth + decks/unlocks/saves sync per §10, with local→cloud migration on first login. Game still fully works logged-out.

**M11 — Polish.** Framer Motion juice (card draw, dice, the light-pushing-back-dark moment, stagger flash, stake kill), reduced-motion support, accessibility pass, responsive layout, a real art/audio pass dropping files into the asset folders.

---

## 13. Commands (fill in after M0)

```
npm install
npm run dev        # Vite dev server
npm run build      # production build
npm run test       # Vitest
npm run lint
```

---

## 14. Notes for Claude Code

- `/docs` is the source of truth for any rule or number. If code and docs disagree, the docs win — or ask.
- Never put randomness or side effects in `engine/` or `data/`.
- A new card should require only: a data entry in `data/`, optionally an image file, optionally a sound. If a new card needs new engine code, that's a signal to generalize the `Effect` union instead of special-casing.
- Prefer clarity over cleverness; this is a solo-maintained project by a CS student building toward shipping.
