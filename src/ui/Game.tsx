// The play screen — wires engine ↔ store ↔ UI for the vertical slice (§ M6).
// Turn flow, targeting, the board, hand, log, and win/lose overlays.
import { useMemo } from 'react';
import type { GameState, TargetRef } from '@engine/types';
import { cardsById } from '@data/cards';
import { lordsById } from '@data/lords';
import { mutationsById } from '@data/mutations';
import { objectivesById } from '@data/objectives';
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

      {(game.phase === 'won' || game.phase === 'lost') && (
        <EndOverlay won={game.phase === 'won'} onMenu={toMenu} />
      )}
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
