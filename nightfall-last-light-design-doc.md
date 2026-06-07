# NIGHTFALL: LAST LIGHT
### Tabletop Design Doc — v0.3

A cooperative, card-and-dice vampire boss-rush for 1–4 players.
A Hunters' coven against the dark. Tabletop-first, built to port into a web game.

---

## 1. The Premise (Gulf Coast Gothic)

**Bélâme Parish**, deep in the Louisiana bayou, has been locked under an endless eclipse. The vampire houses that always whispered through the old city have finally moved in the open — an artifact called the **Eclipse Heart**, sunk in the cathedral of the drowned town, drinks the sun and feeds it to the **Vampire Lords** who rule each district. Most of the parish has been turned.

You are the **Hunters** — the half-vampire, the priest, the cursed Rougarou, the conjure-woman, the trapper, the maker — the few who didn't kneel. Break the Lords, reach the Eclipse Heart, bring back the dawn.

> Setting is a skin over the rules. Swap the parish for any town and nothing mechanical changes.

---

## 2. Win / Lose (Boss Rush)

The parish is a sequence of **districts**, each ending in a **Vampire Lord**, then the **Eclipse Heart** finale.

- **WIN:** defeat the Eclipse Heart.
- **LOSE:** the whole crew is down at once, OR the **Bloodmoon Track** fills.

Each district = one self-contained level → exactly how you chunk the web version.

---

## 3. The Core Engine (unchanged, this is the spine)

**Light → Stagger → Stake.** Vampires ignore normal damage unless **staggered**. Fill a vampire's Stagger track with **light** (gadgets, flares, holy water), then **stake** it to deal real damage. This forces teamwork and is trivial to code.

**Hybrid combat:** *play a card (deterministic) → roll dice (risk).*
- **Combat Die** (custom d6): **Hit, Hit, Crit, Miss, Miss, Surge.**
- **Surge** = the enemy reacts → place a Surge token on you. At end of turn, roll one die per Surge token; each Hit/Crit lets an enemy attack or advance you. Reckless turns get punished.

**Round order:** Crew Phase (2 actions each) → Surge Phase → Threat Phase (flip Threat Deck, enemies act) → Bloodmoon check.

**Bloodmoon Track** (doom clock, ~12): advances when a Lord is reached and on certain Threat cards. As it climbs, spawns escalate. Fills = you lose. Keeps the run moving forward.

**Enemies** run on the **Threat Deck** (no GM): Thralls (weak swarm, no stagger needed), Stalkers (fast, ranged pounce), Brutes (heavy, high stagger threshold), Cultists (re-darken the board, buff vampires).

---

## 4. The Character System — Two Layers

The roster is built in **two layers** so it can grow cheaply while every character still feels like a real person. This is the core of the modular design.

### Layer 1 — ARCHETYPE (the playstyle)
The shared chassis for a role. All characters of one archetype share these:
- **Role** — the job (burst DPS, tank, support, etc.)
- **Resource** — the archetype's personal mechanic (Faith, Scrap, Bloodlust…)
- **Spine** — ~6 base cards every character of this archetype gets
- **Keyword/mechanic** — the rules quirk that defines the class

### Layer 2 — CHARACTER (the person)
A named individual who plays that archetype with their own twist:
- **Name & Lore** — who they are
- **HP** — within the archetype's band
- **Passive** — unique to them, always on
- **Inherent (signature) card** — always in their deck, their move
- **Personal cards** — 3–4 unique cards that replace the archetype's flex slots
- **Ultimate** — unique, charges as they fight

### How a deck is built
> **Deck = Archetype Spine (shared ~6) + Inherent (1) + Personal cards (3–4) ≈ 10 cards.**

Two characters of the same archetype share the spine and the role, but differ in passive, inherent, personal cards, and ultimate — about **60–70% shared, 30–40% unique**. Familiar to pick up, distinct to play.

**Why this matters:** a brand-new character isn't a new design problem. If they fit an existing archetype, you only invent a passive, a signature card, 3–4 personal cards, and an ultimate — and they slot in instantly. That's your content pipeline *and* your monetization path (sell/unlock new characters within known archetypes).

---

## 5. The Six Founding Archetypes

Each archetype below ships with one **founding character**. The archetype's **Spine** (shared cards) is listed once; the character is the twist on top. Later characters reuse the Spine.

### ARCHETYPE: THE REVENANT — *blood-touched predator, high-risk burst DPS*
- **Resource — Bloodlust (0–3):** gained by staking vampires; spent on extra dice/dashes. At 3, risk **Frenzy**.
- **Spine:** predatory strike, lunge, drain, blood-sense (reveal), feint, recover.
- **Founding character — THE DHAMPIR, *"Half-Light"*** · HP 5
  - **Lore:** Born of a mother turned mid-pregnancy. Half in the dark, hunting the houses that made her.
  - **Passive:** Heals 1 when she stakes a staggered vampire.
  - **Inherent — *Crimson Step*:** dash to any vampire in sight and stagger it.
  - **Personal cards:** lifesteal strike, fear-snarl, double-tap.
  - **Ultimate — *Nightborn*:** one round, attacks ignore the stagger requirement and heal on every hit.

### ARCHETYPE: THE DEVOUT — *faith and light, support / anti-vampire*
- **Resource — Faith:** built by helping allies and surviving; spent on blessings.
- **Spine:** holy light (zone light), mend, ward, censer (small light burst), prayer (draw), rebuke.
- **Founding character — PÈRE EZRA, the priest** · HP 6
  - **Lore:** Kept the last lit church in the parish. Faith is a weapon when the sun is gone.
  - **Passive:** Allies adjacent to him take 1 less vampire damage.
  - **Inherent — *Holy Water*:** guaranteed light + 1 damage, **no roll, no Surge**.
  - **Personal cards:** greater heal, blessing (turn a die to auto-Hit), consecrate ground.
  - **Ultimate — *Last Rites*:** revive a downed ally to full, OR wide burst light staggering everything near.

### ARCHETYPE: THE CURSED — *cursed bruiser / tank*
- **Resource — the Curse + Frenzy risk:** lean on the curse for power; push too far and **Frenzy** takes over (you act against the crew / the Bloodmoon ticks). *How the curse manifests is per-character* — the Rougarou shifts into a Beast, others carry it differently. Transformation is optional.
- **Spine:** maul, brace, charge, endure, shake-off (clear a condition), thick hide.
- **Founding character — THE ROUGAROU, the cursed** · HP 9
  - **Lore:** Cursed in the bayou long before the eclipse; hunts vampires hoping the beast might let go. (Cajun folklore — the parish's own monster, turned protector.)
  - **Passive (Beast):** damage reduction, move through enemies, melee power — but **no gadget/heal cards** and Frenzy risk each round.
  - **Inherent — *Rend*:** heavy claw that **does not need stagger** — tears vampires open.
  - **Personal cards:** pounce, howl (taunt/fear), regeneration.
  - **Ultimate — *Full Moon*:** unstoppable Beast for 2 rounds; Bloodmoon ticks afterward.

### ARCHETYPE: THE CONJURER — *charms, curses, spirits — control / debuff*
- **Resource — Gris-gris charms:** craft 1 at setup and 1 per district; one-use powerful effects.
- **Spine:** hex-bolt, ward (zone), bind (root), candle (small light), cleanse, omen (look at top Threat card).
- **Founding character — MAMA VESPERINE, the conjure-woman** · HP 6
  - **Lore:** Root-worker on the parish edge; trades in charms, hexes, and spirits that still answer.
  - **Passive:** When an ally would go down, may spend a charm to leave them at 1 HP.
  - **Inherent — *Hex*:** mark a vampire — +1 from all sources, can't heal.
  - **Personal cards:** blinding curse, withering curse, spirit summon (temporary ally token).
  - **Ultimate — *The Crossroads*:** summon a vengeful spirit that fights for the crew 3 rounds.

### ARCHETYPE: THE MARKSMAN — *ranged precision + traps, DPS*
- **Resource — Silver rounds:** limited ammo; reloading is an action.
- **Spine:** aimed shot, snap shot, reload, flare (zone light), cover, mark (target takes +1).
- **Founding character — THE TRAPPER, the sharpshooter** · HP 6
  - **Lore:** A grounded human gone gator-hunting for monsters, pockets full of silver.
  - **Passive:** Can attack any target in line of sight at **any distance** — the only true long-range hunter.
  - **Inherent — *Silver Shot*:** lights a target; if already staggered, also stakes it (combo finisher).
  - **Personal cards:** bear trap (root + light), called shot, steady aim.
  - **Ultimate — *Dead-Eye*:** three free guaranteed-crit shots.

### ARCHETYPE: THE MAKER — *gadgets / the crew's stagger engine, zone control*
- **Resource — Scrap:** gathered from board/objectives; spent to build.
- **Spine:** quick gadget, salvage (gain scrap), barricade, repair, deploy turret, hand-off (give gear to an ally).
- **Founding character — THE ARTISAN, the maker** · HP 7
  - **Lore:** Parish mechanic who turned the workshop into an armory; arms everyone else.
  - **Passive:** Builds gadgets for 1 less action and carries extra.
  - **Inherent — *UV Rig*:** deploy a light emitter that auto-staggers vampires in its zone each round.
  - **Personal cards:** flashbang, light-grenade hand-off, reinforced barricade.
  - **Ultimate — *Floodlight Array*:** bathe a large area in UV, staggering everything for 2 rounds.

**Role coverage:** burst DPS (Revenant), ranged DPS (Marksman), tank (Cursed), zone/stagger engine (Maker), support (Devout), control (Conjurer). The Revenant and Cursed *bypass* the stagger loop; the Maker *powers* it for everyone — deliberate asymmetry so crew composition matters.

---

## 5.5 Expanding an Archetype (the whole point of two layers)

Adding a character to an existing archetype only requires a passive, an inherent card, 3–4 personal cards, and an ultimate. Same spine, same resource, same role — **different person, different feel.** Examples:

### New DEVOUT — *SISTER COLETTE, the militant* (same class as Père Ezra, opposite playstyle)
- **HP:** 6 · shares the Devout spine and Faith.
- **Passive:** Her light effects also deal 1 damage to staggered vampires (offense, not protection).
- **Inherent — *Smite*:** spend Faith to make a guaranteed-Crit light attack.
- **Personal cards:** pyre (burning zone), zeal (gain an extra action, take 1 damage), purge.
- **Ultimate — *Holy Pyre*:** set a wide area ablaze — heavy light + damage over 2 rounds.
- *Result:* Ezra protects and heals; Colette burns the front line down. Same archetype, totally different hands.

### New CURSED — *AUGUSTIN, "the Undrowned"* (a Cursed who does NOT transform)
- **HP:** 9 · shares the Curse + Frenzy frame, but his curse is **deathlessness**, not a beast form.
- **Passive — *Won't Stay Down*:** the first time each district he would be downed, he stays up at 1 HP instead and gains a **Curse mark**. Marks build toward Frenzy — the more he cheats death, the more the dead thing pushes through.
- **Inherent — *Drowned Hands*:** a melee grab that roots a vampire in place and deals more damage the lower Augustin's own HP is (the closer to death, the stronger).
- **Personal cards:** unfeeling (ignore the next hit entirely), grave-grip (root an adjacent enemy), low tide (heal a little by spending a Curse mark).
- **Ultimate — *Not Yet*:** become unkillable for one full round — he cannot be downed no matter the damage — then the bill comes due (gain Curse marks).
- *Result:* the Rougarou is a mobile beast you unleash; Augustin is a deathless wall you plant in a doorway and dare the dark to move. Same archetype, same Frenzy tension, no transformation.

Every future character is this small a delta — that's how the roster (and lore) grows without growing the rules.

---

## 6. The "Every Game Is Different" Engine

Variety from shuffling a small content pool — not from building a thousand games.

**A. Lord Draw.** A pool of Lords (start with the 5–6 below). Each run, draw a sequence (e.g., 3 Lords) in random order → different bosses, different order.

**B. Mutation Deck.** Each drawn Lord gets 1 random **Mutation** layered on:
- *Bloodgorged* — +50% HP.
- *Shrouded* — higher stagger threshold (harder to stagger).
- *Swift* — acts twice per Threat phase.
- *Thrallmaster* — spawns a Thrall each round.
- *Veiled in Shadow* — heals unless standing in light.
Same Lord plays completely differently run to run.

**C. District Deck.** Shuffle district maps; each Lord sits in a drawn district with a drawn **Objective** (restore the streetlights / escort a survivor / destroy the blood font / hold a position). Different maps + goals every time.

**D. Event Deck.** Between districts, draw one Event — a boon (find a relic, free heal) or a bane (a Cultist ambush, the Bloodmoon lurches forward).

**E. Threat Deck** is shuffled → enemy waves never come in the same order.

**F. Crew + Relic Draft.** Players pick characters; optionally draft a starting **relic** that bends the rules (e.g., "stakes deal +1 but you start with a Surge token").

> **The math:** even just *3 of 6 Lords × their order × one mutation each × district × event × crew* runs into the thousands of distinct openings from a tiny content set. That's the whole reason a web roguelite is cheap to build and sticky to play — it's data, not new code.

**Candidate Lords (each a boss with a gimmick + multi-phase HP):**
- *The Harbor Lord* — heals in shadow; light the arena.
- *The Bell-Tower Lord* — summons Stalkers each round.
- *The Garden Lord* — roots players in place (Rougarou & Trapper shine).
- *The Foundry Lord* — immune until two heat vents are destroyed.
- *The Cathedral Lord* — sheds Stagger fast; needs burst light.
- *The Drowned Lord* — floods zones that must be crossed.

**Finale — the Eclipse Heart:** stationary boss, rotating weak points, remixing the mechanics of whichever Lords you faced that run.

---

## 7. Why this ports cleanly to web

- Co-op vs. board → enemies are a weighted state machine (the Threat Deck), no PvP netcode.
- Characters, cards, Lords, mutations, districts, events → all JSON data objects.
- Custom dice → random over a fixed face array.
- Variability engine → shuffles + draws, i.e. array operations.
- Modular character template → a content pipeline you can keep feeding (and monetize).

Prove the numbers on paper, then the web build is mostly UI over rules you've already balanced.

---

## 8. Next Steps

- Write **one full character deck card-by-card** (the Trapper or the Maker are the cleanest to start) so you can playtest a real turn.
- Stat the **first district + one Lord** as a playable vertical slice.
- Lock baseline numbers: player HP 5–9, Lord HP ~12–18 with 2 phases, stagger thresholds 2–4.
- Decide **meta-progression** between runs (unlock characters, persistent relics) — the single biggest retention lever for the web version.
