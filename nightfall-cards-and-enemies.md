# NIGHTFALL: LAST LIGHT
### Card & Enemy Reference — v0.1
Pairs with the Design Doc (v0.3). This is the playable content: every card, with numbers.

---

## 0. Read This First — The Numbers Everything Uses

**Your turn:** 2 **Actions**. Draw back up to a **hand of 4** at the end of your turn. Deck is ~10 cards; when it runs out, shuffle the discard.

**Combat Die (CD)** — custom d6 faces: **Hit · Hit · Crit · Miss · Miss · Surge**
- **Hit** = 1 (of Light or Stake, as the card says)
- **Crit** = 2, and triggers the card's *crit clause* if it has one
- **Miss** = nothing
- **Surge** = place 1 **Surge token** on you (resolved end of turn — roll 1 CD per token; each Hit/Crit lets an enemy attack or advance you)

**Light vs. Stake (the core loop):**
- **Light** fills a vampire's **Stagger Threshold (ST)**. Reach the ST → the vampire is **Staggered** until the end of the round.
- **Stake** deals HP damage, but **only to Staggered vampires.** (Thralls and human Cultists take Stake/HP damage anytime — they don't need staggering.)

**Ultimate Charge:** gain **1 Charge** whenever you deal HP damage to a vampire or kill any enemy. Ultimates are ready at **5 Charge** and reset to 0 when used.

**Cost notation on cards:** `1A` = one action · `Quick` = free, once per turn · `React` = playable on the enemy turn. Resource costs are written out (e.g. *spend 1 Faith*).

**Reach:** *Melee* = same zone/adjacent · *Ranged* = anywhere in line of sight.

---

## 1. THE REVENANT — *blood-touched predator · burst DPS*
**Resource — Bloodlust (BL), 0–3.** Gain 1 by staking a vampire. At 3 BL you risk **Frenzy** (when you'd gain a 4th, roll 1 CD; on Surge you attack the nearest ally and reset BL to 0).

**Spine (shared by all Revenants):**
- **Predator's Strike** — *(Attack · 1A)* Melee, roll **2 CD Stake**. *Crit: +1 BL.*
- **Lunge** — *(Attack · 1A, or Quick if you spend 1 BL)* Move 1 zone toward a vampire, then Melee **1 CD Stake**.
- **Drain** — *(Attack · 1A)* Melee vs a staggered vampire: **2 CD Stake**; heal 1 if you deal any damage.
- **Blood-Sense** — *(Utility · Quick)* Mark a vampire in sight: your attacks deal +1 Light to it this round.
- **Feint** — *(Utility · 1A)* Discard 1 card, draw 2 — *or* clear 1 Surge token.
- **Recover** — *(Utility · Quick)* Spend up to 2 BL: heal that much.

### CHARACTER — THE DHAMPIR, *"Half-Light"* · HP 5
- **Passive:** Heals 1 when she stakes a staggered vampire.
- **Crimson Step** *(Inherent · 1A)* — Dash adjacent to any vampire in line of sight; deal it **+2 Light** (staggers most Stalkers outright).
- **Lifesteal Strike** *(Attack · 1A)* — Melee **2 CD Stake**; heal equal to damage dealt.
- **Fear-Snarl** *(Utility · 1A)* — Adjacent enemies can't attack you next enemy turn; gain 1 BL.
- **Double-Tap** *(Attack · 1A, spend 1 BL)* — Two Melee attacks of **1 CD Stake** each.
- **★ Nightborn** *(Ultimate · 5 Charge)* — For one round your Stake attacks hit vampires **even if not staggered**, and you heal 1 per Hit.

---

## 2. THE DEVOUT — *faith and light · support / anti-vampire*
**Resource — Faith.** Gain 1 when you heal an ally, or at the end of a round in which you took no damage. Spend on blessings.

**Spine (shared by all Devout):**
- **Holy Light** — *(Light · 1A)* Ranged, roll **2 CD**; each Hit/Crit = +1 Light to the target.
- **Mend** — *(Heal · 1A)* Heal an ally in sight **2**; gain 1 Faith.
- **Ward** — *(Utility · 1A)* An ally in sight ignores the next hit against them.
- **Censer** — *(Light · Quick)* +1 Light to an adjacent vampire (no roll).
- **Prayer** — *(Utility · 1A)* Draw 2 cards; gain 1 Faith.
- **Rebuke** — *(Attack · 1A)* Ranged: vs a human/Cultist roll **2 CD Stake**; vs a vampire instead deal **+2 Light**.

### CHARACTER — PÈRE EZRA, the priest · HP 6
- **Passive:** Allies adjacent to him take 1 less vampire damage.
- **Holy Water** *(Inherent · 1A)* — Target gets **+2 Light**. No roll, no Surge — your reliable stagger.
- **Greater Heal** *(Heal · 1A, spend 2 Faith)* — Heal an ally in sight **4**.
- **Blessing** *(Utility · Quick, spend 1 Faith)* — The next attack a chosen hunter makes this turn: one die auto-counts as a **Hit**.
- **Consecrate Ground** *(Light/Zone · 1A)* — A chosen zone is **Hallowed** until end of round: vampires in it gain +1 Light each enemy turn.
- **★ Last Rites** *(Ultimate · 5 Charge)* — Choose: revive a downed ally at full HP, **or** +3 Light to every vampire in your zone and all adjacent zones.

### CHARACTER — SISTER COLETTE, the militant · HP 6
*(Same archetype as Ezra, opposite playstyle — she burns instead of shields.)*
- **Passive:** Her Light effects also deal **1 Stake** to staggered vampires.
- **Smite** *(Inherent · 1A, spend 1 Faith)* — Ranged, **auto-Crit**: deal 2 Light; if the target is already staggered, deal **2 Stake** instead.
- **Pyre** *(Zone · 1A)* — A chosen zone burns for 2 rounds: each enemy turn, enemies there take **1 damage** and vampires gain +1 Light.
- **Zeal** *(Utility · Quick)* — Take 1 damage to gain an **extra action** this turn.
- **Purge** *(Attack · 1A)* — Ranged vs a vampire, roll **2 CD**; each Hit = +1 Light **and** 1 Stake if it's staggered.
- **★ Holy Pyre** *(Ultimate · 5 Charge)* — Set a zone and all adjacent ablaze for 2 rounds: each enemy turn, enemies there take **2 damage** and +2 Light.

---

## 3. THE CURSED — *cursed bruiser / tank*
**Resource — the Curse + Frenzy.** Lean on the curse for power; push too far and **Frenzy** takes over. How the curse manifests is per-character (the Rougarou shifts; Augustin won't die). Each tracks **Frenzy**; at 3 → a Frenzy event (act against the crew / Bloodmoon +1).

**Spine (shared by all Cursed):**
- **Maul** — *(Attack · 1A)* Melee, roll **3 CD Stake**.
- **Brace** — *(Utility · Quick)* Until your next turn, reduce damage you take by 1.
- **Charge** — *(Move+Attack · 1A)* Move up to 2 zones in a line; if you end adjacent to an enemy, roll **1 CD Stake**.
- **Endure** — *(Utility · 1A)* Heal **2**; clear 1 condition on you.
- **Shake-Off** — *(Utility · React)* Cancel a root, stun, or fear on you.
- **Thick Hide** — *(Utility · Quick)* Gain a **2-damage shield** (absorbs the next 2 damage).

### CHARACTER — THE ROUGAROU, the cursed · HP 9
- **Stances:** **Shift** *(1A)* toggles Human ↔ Beast. In **Beast**: +1 die on melee attacks, move through enemies, damage reduction 1 — but **no Heal/Gadget cards**, and gain 1 Frenzy at the start of each of your turns.
- **Rend** *(Inherent · 1A)* — Melee, roll **3 CD**; deals HP damage to vampires **even if not staggered** (claws tear them open).
- **Pounce** *(Move+Attack · 1A · Beast only)* — Leap up to 2 zones to an enemy; **2 CD Stake** (bypasses stagger).
- **Howl** *(Utility · 1A)* — Taunt: all enemies in sight must target you next enemy turn; gain a 2-damage shield.
- **Regeneration** *(Utility · Quick)* — Heal **2** (Beast: heal 3). *(Human-only card — can't use while Beast.)*
- **★ Full Moon** *(Ultimate · 5 Charge)* — Become unstoppable Beast for 2 rounds (immune to control, +1 die all attacks, DR 2). Afterward, Bloodmoon +1.

### CHARACTER — AUGUSTIN, *"the Undrowned"* · HP 9
*(A Cursed who does NOT transform — his curse is deathlessness. Tracks **Curse marks** toward Frenzy.)*
- **Passive — Won't Stay Down:** the first time each district he'd be downed, he stays up at **1 HP** and gains 1 Curse mark. (3 marks → Frenzy event.)
- **Drowned Hands** *(Inherent · 1A)* — Melee grab: **root** the target until your next turn + roll **2 CD Stake**; +1 die if Augustin is at half HP or less.
- **Unfeeling** *(Utility · React)* — Ignore the next hit against you entirely (0 damage).
- **Grave-Grip** *(Utility · 1A)* — Root an adjacent enemy until your next turn; it can't be moved by anything.
- **Low Tide** *(Heal · 1A, spend 1 Curse mark)* — Heal **3**.
- **★ Not Yet** *(Ultimate · 5 Charge)* — For one full round Augustin **cannot be downed** (minimum 1 HP, ignores all "down" effects). At end of round, gain 2 Curse marks.

---

## 4. THE CONJURER — *charms, curses, spirits · control / debuff*
**Resource — Gris-gris charms (tokens).** Craft 1 at setup and 1 at the start of each district. **Charm menu** — spend a charm any time to: cancel a Surge (yours or an ally's), root an enemy until its next turn, or redirect an attack to an adjacent enemy.

**Spine (shared by all Conjurers):**
- **Hex-Bolt** — *(Attack · 1A)* Ranged, roll **2 CD**; choose Light or Stake for the whole roll.
- **Warding Circle** — *(Zone · 1A)* Allies in a chosen zone take 1 less damage until your next turn.
- **Bind** — *(Utility · 1A)* Root a target in sight until your next turn.
- **Candle** — *(Light · Quick)* +1 Light to a vampire in sight (no roll).
- **Cleanse** — *(Utility · Quick)* Remove a condition or Surge token from an ally in sight.
- **Omen** — *(Utility · Quick)* Look at the top 2 Threat cards; return them in any order.

### CHARACTER — MAMA VESPERINE, the conjure-woman · HP 6
- **Passive:** When an ally would be downed, you may spend a charm to leave them at **1 HP** instead.
- **Hex** *(Inherent · 1A)* — Mark a vampire: it takes **+1 from all sources** and **can't heal**, until end of round.
- **Blinding Curse** *(Utility · 1A)* — A target enemy rolls 1 fewer die on its next attack (minimum 0).
- **Withering Curse** *(Attack · 1A)* — Ranged **2 CD Stake**; the target also deals 1 less on its next attack.
- **Spirit Summon** *(Summon · 1A, spend 1 charm)* — Place a **Spirit** (3 HP) in a zone; on each of your turns it makes a **1 CD Stake** attack. Lasts until destroyed.
- **★ The Crossroads** *(Ultimate · 5 Charge)* — Summon a vengeful **Spirit** (5 HP, makes **2 CD Stake** attacks that bypass stagger) for 3 rounds.

---

## 5. THE MARKSMAN — *ranged precision + traps · DPS*
**Resource — Silver rounds (ammo).** Hold up to **3**; most shots cost 1 round. **Reload** sets you back to 3. Traps/utility don't cost rounds.

**Spine (shared by all Marksmen):**
- **Aimed Shot** — *(Attack · 1A, spend 1 round)* Ranged, roll **2 CD**; choose Light or Stake.
- **Snap Shot** — *(Attack · Quick, spend 1 round)* Ranged, roll **1 CD**; choose Light or Stake.
- **Reload** — *(Utility · 1A)* Set Silver rounds to 3.
- **Flare** — *(Light/Zone · 1A)* Throw to a zone in sight: +1 Light to all vampires there now, and +1 each enemy turn for 1 round.
- **Cover** — *(Utility · Quick)* Until your next turn, ranged attacks against you roll 1 fewer die.
- **Mark** — *(Utility · Quick)* A target enemy takes +1 from all sources until your next turn.

### CHARACTER — THE TRAPPER, the sharpshooter · HP 6
- **Passive:** May attack any target in line of sight at **any distance** — the only true long-range hunter.
- **Silver Shot** *(Inherent · 1A, spend 1 round)* — Ranged: **+2 Light**; if the target is already staggered, also deal **2 Stake** (combo finisher).
- **Bear Trap** *(Gadget · 1A)* — Place in an adjacent zone; the first enemy to enter is **rooted** 1 turn and gains +2 Light.
- **Called Shot** *(Attack · 1A, spend 1 round)* — Ranged **3 CD Stake** at a staggered vampire. *Crit: ignore damage reduction.*
- **Steady Aim** *(Utility · Quick)* — Your next attack this turn: reroll all Misses once.
- **★ Dead-Eye** *(Ultimate · 5 Charge)* — Make **3 shots** that each auto-Crit (no roll, no ammo). Choose Light or Stake per shot.

---

## 6. THE MAKER — *gadgets · the crew's stagger engine · zone control*
**Resource — Scrap.** Gain from **Salvage** and from map objectives. Spend to **Build**.

**Spine (shared by all Makers):**
- **Quick Gadget** — *(Build · 1A, 1 Scrap)* Deploy a **Light Mine** in a zone; first enemy to enter takes +2 Light (one use).
- **Salvage** — *(Utility · 1A)* Gain 2 Scrap; draw 1 card.
- **Barricade** — *(Build · 1A, 1 Scrap)* Block movement between two adjacent zones (3 HP) until destroyed.
- **Repair** — *(Utility · Quick, 1 Scrap)* Heal a gadget to full, or give an ally a 2-damage shield.
- **Deploy Turret** — *(Build · 1A, 2 Scrap)* Place a **Turret** (3 HP); on each of your turns it makes a **2 CD** attack (choose Light or Stake) in its zone or adjacent.
- **Hand-Off** — *(Utility · Quick)* Give an ally a one-use **Light Grenade** (they may, as a Quick action, deal +2 Light to a vampire in sight).

### CHARACTER — THE ARTISAN, the maker · HP 7
- **Passive:** Once per turn, one **Build** card becomes **Quick** (free action). Carries extra gadgets.
- **UV Rig** *(Inherent · 1A, 2 Scrap)* — Deploy a **UV Rig** (4 HP) in a zone; at the start of each enemy turn, every vampire in its zone gains **+2 Light** (the team's auto-stagger engine).
- **Flashbang** *(Gadget · 1A)* — Throw to a zone: enemies there are **stunned** (skip their next attack) and vampires gain +1 Light.
- **Light-Grenade Hand-Off** *(Utility · Quick)* — As Hand-Off, but the ally's grenade gives **+3 Light**.
- **Reinforced Barricade** *(Build · 1A, 2 Scrap)* — Barricade with **6 HP** that also deals 1 damage to enemies attacking it.
- **★ Floodlight Array** *(Ultimate · 5 Charge)* — A chosen zone and all adjacent: every vampire is **Staggered immediately** and re-staggered at the start of the next 2 rounds.

---

## 7. The Enemies (common — the Threat Deck pool)

| Enemy | Stagger Threshold | HP | Attack | Notes |
|---|---|---|---|---|
| **Thrall** | — (none) | 2 | 1 dmg melee | Turned townsfolk. Swarms. Takes Stake/HP damage anytime. |
| **Stalker** | 2 | 3 | Pounce up to 2 zones, 2 dmg | Fast vampire (moves 2). |
| **Brute** | 4 | 5 | 3 dmg melee + knockback 1 zone | Slow (moves 1). High threshold — needs setup to stagger. |
| **Cultist** | — (human) | 3 | Rarely attacks (1 dmg) | **Darkens:** removes 2 Light from a vampire in its zone, OR gives an adjacent vampire +1 attack die. Hangs back. |

**Behavior is driven by the Threat Deck (§9)** — these blocks just say what each unit *can* do.

---

## 8. The Vampire Lords (bosses)

Each Lord is **drawn into a run** (see Design Doc §6), wears a random **Mutation**, and acts on its own behavior each Threat phase. Baseline: **2 phases** — at half HP it **Enrages** (acts one extra time per round, +1 attack die).

- **The Harbor Lord** — *ST 3 · HP 14.* **Gimmick:** heals 2 each enemy turn while in an unlit (shadow) zone. Light its zone to shut off the healing. *Acts:* Claw (3 dmg adjacent), then moves to the darkest zone. **Enrage:** heals 3.
- **The Bell-Tower Lord** — *ST 3 · HP 14.* **Gimmick:** rings the bell at the start of each enemy turn → spawn 1 Stalker. *Acts:* Dive (move + 3 dmg). **Enrage:** spawns 2.
- **The Garden Lord** — *ST 4 · HP 15.* **Gimmick:** roots one hunter (vines) each enemy turn. *Acts:* Thorn-lash (2 dmg to everyone in a zone). **Enrage:** roots two hunters. *(Rougarou, Augustin, and the Trapper shine — root-immunity and range.)*
- **The Foundry Lord** — *ST 3 · HP 16.* **Gimmick:** **immune to Stake/HP damage** until both **Heat Vents** (objectives, 3 HP each, Light or Stake to break) are destroyed; until then it can only be staggered, not hurt. *Acts:* Molten slam (3 dmg adjacent + ignites the zone for 1 dmg/turn). **Enrage:** rebuilds one vent.
- **The Cathedral Lord** — *ST 2*, but **sheds all Light at the start of each enemy turn** — you must burst-stagger it in one crew turn. *HP 14.* *Acts:* Blood-prayer (heal 2) + Bite (3 dmg). **Enrage:** heals 3. *(Devout + Maker burst light is the answer.)*
- **The Drowned Lord** — *ST 3 · HP 15.* **Gimmick:** floods one zone each enemy turn (flooded zones: hunters take 1 dmg, movement costs +1). *Acts:* Tide-pull (drag a hunter 1 zone toward it) + slam (2 dmg). **Enrage:** floods two zones.

### FINALE — The Eclipse Heart
Stationary boss in the drowned cathedral. No stagger track; instead it has **3 rotating Wards** — only the currently **Exposed** Ward can be damaged. **Lighting the arena** (any Light effect into its zone) rotates which Ward is exposed. It **remixes the gimmicks of whichever Lords you faced this run** (e.g., if you fought Bell-Tower + Drowned, it summons Stalkers *and* floods). Three phases; each phase exposes Wards faster and adds one more remixed gimmick. Destroy all Wards across all phases → **dawn breaks. You win.**

---

## 9. The Threat Deck (how enemies "play themselves")

Flip the top card each **Threat Phase**. A ~14-card deck; shuffle when exhausted. (During a Lord fight, the Lord's behavior happens *in addition*.)

- **Advance** ×3 — All enemies move toward the nearest hunter; adjacent ones attack.
- **Hunt** ×2 — Stalkers move twice, then attack.
- **Swarm** ×2 — Spawn 2 Thralls at the nearest spawn point; Thralls attack.
- **The Dark Deepens** ×2 — Remove 1 Light from each vampire; all Cultists act.
- **Ambush** ×1 — Spawn 1 Stalker behind the hunters; it attacks.
- **Bloodmoon Rises** ×2 — Advance the Bloodmoon Track 1; Brutes act.
- **Lord's Will** ×1 — The active Lord acts an extra time (no Lord present → treat as Advance).
- **Lull** ×1 — Enemies only move; nothing spawns. (A breather.)

**Scaling:** as the Bloodmoon climbs past its thresholds, **Swarm** spawns 3 instead of 2, and **Bloodmoon Rises** also spawns a Brute. (This is the difficulty dial you'll tune in playtesting.)

---

## 10. First-Pass Balance Targets (tune on the table)
- Player HP 5–9; most cards roll 1–3 CD. A "good" attack turn deals ~3–4.
- Common vampires die in 1–2 staked attacks once staggered; Brutes need real setup.
- Lords: ~6–9 crew turns each at 1–4 players. If a Lord dies in under 4 turns, raise its HP or ST.
- Surge should sting ~once per combat-heavy turn — if players never fear it, add a Surge face or lower hand size.
