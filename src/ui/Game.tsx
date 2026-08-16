// The play screen — wires engine ↔ store ↔ UI for the vertical slice (§ M6).
// Turn flow, targeting, the board, hand, log, and win/lose overlays.
import { useMemo } from 'react';
import type { GameState, TargetRef } from '@engine/types';
import { cardsById } from '@data/cards';
import { lordsById } from '@data/lords';
import { mutationsById } from '@data/mutations';
import { objectivesById } from '@data/objectives';
import { districtsById } from '@data/districts';
import { eventsById } from '@data/events';
import { useStore } from '@/store';
import { Board } from './Board';
import { Hand } from './Hand';
import { BloodmoonTrack } from './BloodmoonTrack';
import { DiceTray } from './DiceTray';

function buildEnemyTargets(game: GameState, uid: string): TargetRef[] {
  const e = game.enemies.find((x) => x.uid === uid);
  return e ? [{ kind: 'enemy', uid }, { kind: 'zone', id: e.zone }, { kind: 'self' }] : [{ kind: 'enemy', uid }];
}

function buildLordTargets(game: GameState): TargetRef[] {
  const z = game.activeLord?.zone;
  return z ? [{ kind: 'lord' }, { kind: 'zone', id: z }, { kind: 'self' }] : [{ kind: 'lord' }];
}

function buildZoneTargets(game: GameState, zoneId: string): TargetRef[] {
  const refs: TargetRef[] = [{ kind: 'zone', id: zoneId }];
  if (game.activeLord?.zone === zoneId) refs.push({ kind: 'lord' });
  const enemy = game.enemies.find((e) => e.zone === zoneId);
  if (enemy) refs.push({ kind: 'enemy', uid: enemy.uid });
  refs.push({ kind: 'self' });
  return refs;
}

export function Game() {
  const game = useStore((s) => s.game)!;
  const selectedCard = useStore((s) => s.selectedCard);
  const selectCard = useStore((s) => s.selectCard);
  const playSelected = useStore((s) => s.playSelected);
  const moveTo = useStore((s) => s.moveTo);
  const endTurn = useStore((s) => s.endTurn);
  const toMenu = useStore((s) => s.toMenu);

  const active = game.hunters.find((h) => h.id === game.activeHunter) ?? null;
  const card = selectedCard ? cardsById[selectedCard] : null;
  const yourTurn = game.phase === 'crew' && !!active && !active.downed;

  // Movement options when no card is selected.
  const moveZones = useMemo(() => {
    if (card || !active) return new Set<string>();
    const zone = game.zones.find((z) => z.id === active.zone);
    return new Set(zone?.adjacent ?? []);
  }, [card, active, game.zones]);

  // Targeting highlights driven by the selected card's targetKind.
  const tk = card?.targetKind;
  const enemyTargetable = tk === 'enemy' || tk === 'vampire';
  const lordTargetable = (tk === 'enemy' || tk === 'vampire') && !!game.activeLord;
  const hunterTargetable = tk === 'ally';
  const zoneTargetable = tk === 'zone';
  const targetZones = useMemo(
    () => (zoneTargetable ? new Set(game.zones.map((z) => z.id)) : new Set<string>()),
    [zoneTargetable, game.zones],
  );

  // Selecting a self/none card plays it immediately.
  function onSelect(cardId: string) {
    const c = cardsById[cardId];
    if (selectedCard === cardId) return selectCard(null);
    if (c && (c.targetKind === 'self' || c.targetKind === 'none')) {
      selectCard(cardId);
      playSelected([{ kind: 'self' }]);
      return;
    }
    selectCard(cardId);
  }

  const lordDef = game.activeLord ? lordsById[game.activeLord.defId] : null;
  const mutation = game.activeLord?.mutationId ? mutationsById[game.activeLord.mutationId] : null;
  const objective = game.objectiveId ? objectivesById[game.objectiveId] : null;

  return (
    <div className="bg-nightfall min-h-screen p-3 text-bone md:p-5">
      {/* Header */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <BloodmoonTrack value={game.bloodmoon} max={game.bloodmoonMax} />
          <div className="text-sm">
            <div className="font-display text-lantern">Round {game.round}</div>
            <div className="text-xs uppercase tracking-widest text-muted">{game.phase} phase</div>
          </div>
          <RunProgress game={game} />
          {objective && (
            <div className="rounded border border-cardBorder bg-surface px-3 py-1 text-xs">
              <span className="text-muted">Objective: </span>
              <span className="text-bone">{objective.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {active && (
            <div className="rounded border border-lantern/40 bg-surface px-3 py-1 text-xs">
              <span className="text-lantern">{active.name}</span> · {active.actionsLeft} actions
            </div>
          )}
          <button
            onClick={endTurn}
            disabled={!yourTurn}
            className="rounded bg-lantern px-3 py-1.5 text-sm font-semibold text-night disabled:opacity-40"
          >
            End Turn
          </button>
          <button onClick={toMenu} className="rounded border border-cardBorder px-3 py-1.5 text-sm text-muted">
            Quit
          </button>
        </div>
      </header>

      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
        {/* Board */}
        <section>
          {lordDef && game.activeLord && (
            <div className="mb-2 rounded border border-eclipse/40 bg-eclipse/10 p-2 text-xs">
              <span className="font-display text-eclipse">{game.activeLord.name}</span>
              {mutation && <span className="ml-2 text-lantern">· {mutation.name}</span>}
              <span className="ml-2 text-muted">{lordDef.gimmick}</span>
            </div>
          )}
          <Board
            game={game}
            activeZone={active?.zone}
            moveZones={moveZones}
            targetZones={targetZones}
            enemyTargetable={enemyTargetable}
            lordTargetable={lordTargetable}
            hunterTargetable={hunterTargetable}
            onZoneClick={(zoneId) => {
              if (card && zoneTargetable) playSelected(buildZoneTargets(game, zoneId));
              else if (!card) moveTo(zoneId);
            }}
            onEnemyClick={(uid) => card && playSelected(buildEnemyTargets(game, uid))}
            onLordClick={() => card && playSelected(buildLordTargets(game))}
            onHunterClick={(id) => card && playSelected([{ kind: 'hunter', id }, { kind: 'self' }])}
          />
          {card && (
            <p className="mt-2 text-xs text-swamp">
              Playing <span className="font-semibold">{card.name}</span> — choose a{' '}
              {tk === 'zone' ? 'zone' : tk === 'ally' ? 'hunter' : 'target'}, or click the card again to cancel.
            </p>
          )}
        </section>

        {/* Side panel: dice + log */}
        <aside className="flex flex-col gap-3">
          <div className="rounded border border-cardBorder bg-surface p-2">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">Last Roll</div>
            <DiceTray dice={game.pendingDice} />
          </div>
          <div className="flex-1 overflow-hidden rounded border border-cardBorder bg-surface p-2">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">Chronicle</div>
            <ol className="flex max-h-64 flex-col-reverse gap-0.5 overflow-y-auto text-[11px] text-muted">
              {game.log
                .slice(-40)
                .reverse()
                .map((line, i) => (
                  <li key={game.log.length - i} className="leading-snug">
                    {line}
                  </li>
                ))}
            </ol>
          </div>
        </aside>
      </div>

      {/* Hand */}
      <footer className="mt-3 rounded-lg border border-cardBorder bg-surface/70 p-3">
        {active ? (
          <Hand hunter={active} selectedCard={selectedCard} onSelect={onSelect} yourTurn={yourTurn} />
        ) : (
          <div className="text-xs italic text-muted">The dark moves…</div>
        )}
      </footer>

      {game.phase === 'interlude' && <Interlude game={game} />}

      {(game.phase === 'won' || game.phase === 'lost') && (
        <EndOverlay won={game.phase === 'won'} onMenu={toMenu} />
      )}
    </div>
  );
}

/** Boss-rush progress: one moon per Lord, ending at the Eclipse Heart. */
function RunProgress({ game }: { game: GameState }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Run progress">
      {game.run.lordSequence.map((lordId, i) => {
        const isHeart = lordId === 'eclipse_heart';
        const slain = i < game.districtIndex || (game.phase === 'won' && i <= game.districtIndex);
        const current = i === game.districtIndex && game.phase !== 'won';
        const name = lordsById[lordId]?.name ?? lordId;
        return (
          <li
            key={lordId}
            title={`${name}${slain ? ' — slain' : current ? ' — now' : ''}`}
            aria-label={`${name}${slain ? ', slain' : current ? ', current' : ', ahead'}`}
            className={[
              'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
              slain
                ? 'border-lantern bg-lantern/20 text-lantern'
                : current
                  ? 'border-eclipse bg-eclipse/25 text-eclipse animate-pulse'
                  : 'border-cardBorder text-muted',
              isHeart ? 'h-6 w-6 text-[12px]' : '',
            ].join(' ')}
          >
            {isHeart ? '☀' : slain ? '✝' : '●'}
          </li>
        );
      })}
    </ol>
  );
}

/** Between districts: the drawn Event and the road ahead (§6.D). */
function Interlude({ game }: { game: GameState }) {
  const nextDistrict = useStore((s) => s.nextDistrict);
  const ev = game.pendingEventId ? eventsById[game.pendingEventId] : null;
  const nextIdx = game.districtIndex + 1;
  const nextLord = lordsById[game.run.lordSequence[nextIdx]];
  const nextDistrictDef = districtsById[game.run.districts[nextIdx]];
  const slainLord = lordsById[game.run.lordSequence[game.districtIndex]];
  const finaleNext = nextLord?.id === 'eclipse_heart';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-xl border border-cardBorder bg-surface p-6 text-center">
        <div className="text-[10px] uppercase tracking-widest text-muted">District cleared</div>
        <h2 className="mt-1 font-display text-2xl text-lantern">{slainLord?.name} has fallen</h2>

        {ev && (
          <div
            className={[
              'mt-4 rounded-lg border p-3 text-left',
              ev.kind === 'boon' ? 'border-swamp/50 bg-swamp/10' : 'border-eclipse/50 bg-eclipse/10',
            ].join(' ')}
          >
            <div
              className={`text-[10px] uppercase tracking-widest ${ev.kind === 'boon' ? 'text-swamp' : 'text-eclipse'}`}
            >
              {ev.kind === 'boon' ? 'A boon on the road' : 'A bane on the road'}
            </div>
            <div className="mt-0.5 font-display text-lg text-bone">{ev.name}</div>
            <p className="mt-1 text-xs text-muted">{ev.text}</p>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-night/60 p-3 text-left text-xs">
          <div className="text-[10px] uppercase tracking-widest text-muted">The road ahead</div>
          <div className="mt-1 text-bone">
            <span className={finaleNext ? 'text-eclipse' : 'text-lantern'}>{nextDistrictDef?.name}</span>
            <span className="text-muted"> — {finaleNext ? 'the eclipse itself waits' : 'a Lord waits'}: </span>
            <span className="font-display">{nextLord?.name}</span>
          </div>
          <p className="mt-1 text-muted">
            The downed stand back up at half strength. No rest is a full rest under a dead sun.
          </p>
        </div>

        <button
          onClick={nextDistrict}
          autoFocus
          className="mt-5 rounded-lg bg-eclipse px-6 py-2.5 font-display text-lg shadow-eclipse transition hover:brightness-110"
        >
          {finaleNext ? 'To the Drowned Cathedral →' : 'Press on →'}
        </button>
      </div>
    </div>
  );
}

function EndOverlay({ won, onMenu }: { won: boolean; onMenu: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/85 backdrop-blur">
      <div className="rounded-xl border border-cardBorder bg-surface p-8 text-center">
        <h2 className={`font-display text-4xl ${won ? 'text-lantern' : 'text-eclipse'}`}>
          {won ? 'Dawn Breaks' : 'The Dark Wins'}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {won ? 'The sun returns to Bélâme Parish.' : 'The parish falls to endless night.'}
        </p>
        <button
          onClick={onMenu}
          className="mt-5 rounded bg-lantern px-5 py-2 font-semibold text-night"
        >
          Return to the Crossroads
        </button>
      </div>
    </div>
  );
}
