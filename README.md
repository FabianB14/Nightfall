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

## Deploying to GitHub Pages

The app is fully static, so Pages just serves the build — no server.

1. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs lint/typecheck/tests,
   builds with `VITE_BASE=/<repo>/`, and publishes the `dist/` artifact.
2. In the repo, **Settings → Pages → Build and deployment → Source: GitHub Actions** (one-time).
3. Your site appears at `https://<user>.github.io/<repo>/` (e.g. `…/Nightfall/`).

`vite.config.ts` reads `VITE_BASE` so asset URLs resolve under the repo subpath; locally and on
custom domains it defaults to `/`.

## Persistence (login, saved decks, unlocks)

GitHub Pages is **static hosting only** — it can't run a database or auth server. Two tiers:

- **Local-only (works today, zero backend):** saved decks, unlocks, and settings live in the
  browser's `localStorage`. Per-device, no account. This is the Phase-1 plan in `CLAUDE.md` §9
  and is fully compatible with Pages.
- **Accounts + cloud sync (Phase 8 / M10, optional):** for real login and decks that follow you
  across devices, the static client talks to a **Backend-as-a-Service** over HTTPS — the planned
  choice is **Supabase** (Postgres + Auth + Storage, free tier). No server of your own to host;
  the client uses the Supabase JS SDK directly, which works fine from a Pages site. The game
  stays fully playable logged-out and **migrates local data into the cloud on first login**.

Notes for the Supabase route: the Supabase URL + anon key get baked into the static build (they
are public keys; data is protected by Row-Level Security), and OAuth/magic-link redirect URLs
must include the Pages domain. All Supabase calls stay behind `src/services/` so the engine/UI
never import the SDK directly and the game keeps working if the backend is down.

## Status

Implemented (M0–M9, M11): scaffold, the pure engine (combat loop, surge, ultimate charge,
threat deck, seeded run setup), all content data, audio, and the **full single-player boss-rush**:
crew select → districts → Lords (with runtime mutations) → between-district Events → the
**Eclipse Heart** finale with rotating Wards that remix the gimmicks of the Lords you faced.
Deck builder, unlocks and run progression persist in `localStorage`; motion is gated on
`prefers-reduced-motion`, and the board is keyboard-playable. The remaining milestone is the
optional Supabase backend (M10 — accounts + cloud sync, see above).
