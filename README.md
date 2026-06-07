# Nightfall: Last Light

A cooperative, turn-based, card-and-dice vampire **boss-rush** for the web. Pick a crew of
Hunters, fight through randomized districts of Bélâme Parish, break the Vampire Lords, and
reach the **Eclipse Heart** to bring back the dawn.

> **The one rule that defines combat:** vampires ignore damage unless **Staggered**. Fill a
> vampire's Stagger Threshold with **Light**, then **Stake** it for HP damage.

Setting and full rules live in [`/docs`](./docs) (the source of truth). Build context for
contributors (and Claude Code) is in [`CLAUDE.md`](./CLAUDE.md).

## Tech

TypeScript (strict) · Vite · React 18 · Tailwind · Zustand · Zod · Framer Motion · Howler ·
Vitest. The game engine (`src/engine`) is **pure** — no React, no DOM — so the rules can be
tested headlessly and re-simulated on a server later. The UI only renders state and dispatches
actions.

```
src/
  engine/   pure state machine: types, seeded RNG, combat, reducer, threat, run
  data/     all content as validated data (cards, characters, enemies, Lords, …)
  ui/       presentational React components (Card, Board, Hand, …)
  audio/    Howler wrapper (drop a file + add one line to add a sound)
  theme/    Gulf Coast Gothic design tokens
  store.ts  Zustand store bridging engine ↔ UI ↔ audio
docs/       design-doc.md + cards-and-enemies.md (source of truth)
```

## Commands

```bash
npm install
npm run dev        # Vite dev server
npm run build      # production build (tsc + vite)
npm run test       # Vitest (engine + UI)
npm run lint       # ESLint (0 warnings)
npm run typecheck  # tsc --noEmit
```

## Adding content

A new card needs only a data entry in `src/data/cards.ts` (its `effects` expressed with the
`Effect` union), optionally an image at `public/assets/cards/<card_id>.webp`, and optionally a
sound. No engine changes — if a card needs new engine code, generalize the `Effect` union
instead of special-casing.

## Status

Implemented: scaffold, the pure engine (combat loop, surge, ultimate charge, threat deck,
seeded run setup), all content data, and a playable single-player vertical slice (crew select →
district → Lord, with the full Light → Stagger → Stake loop, win/lose). See `CLAUDE.md` §12 for
the remaining milestones (full boss-rush to the Eclipse Heart, deck builder + unlocks, backend,
polish).
