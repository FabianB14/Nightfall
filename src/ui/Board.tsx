// The board: zones with lit/shadow/flooded states, hunter + enemy + Lord tokens, gadgets.
// Presentational — all click handling is passed in from the play screen.
import type { GameState } from '@engine/types';
import { EnemyToken, HunterToken, LordToken, GadgetChip, SummonChip } from './tokens';

export interface BoardHandlers {
  onZoneClick?: (zoneId: string) => void;
  onEnemyClick?: (uid: string) => void;
  onLordClick?: () => void;
  onHunterClick?: (id: string) => void;
}

interface BoardProps extends BoardHandlers {
  game: GameState;
  activeZone?: string;
  moveZones?: Set<string>; // zones the active hunter can move into
  targetZones?: Set<string>; // zones selectable as a card target
  enemyTargetable?: boolean;
  lordTargetable?: boolean;
  hunterTargetable?: boolean;
}

const TERRAIN_STYLE: Record<string, string> = {
  lit: 'bg-[#26210f] border-lantern/40',
  shadow: 'bg-[#0d1020] border-cardBorder',
  flooded: 'bg-[#0c1c2a] border-marksman/40',
};

export function Board(props: BoardProps) {
  const {
    game,
    activeZone,
    moveZones,
    targetZones,
    enemyTargetable,
    lordTargetable,
    hunterTargetable,
    onZoneClick,
    onEnemyClick,
    onLordClick,
    onHunterClick,
  } = props;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {game.zones.map((zone) => {
        const canMove = moveZones?.has(zone.id);
        const canTarget = targetZones?.has(zone.id);
        const clickable = canMove || canTarget;
        const hunters = game.hunters.filter((h) => h.zone === zone.id);
        const enemies = game.enemies.filter((e) => e.zone === zone.id);
        const gadgets = game.gadgets.filter((g) => g.zone === zone.id);
        const summons = game.summons.filter((s) => s.zone === zone.id);
        const lordHere = game.activeLord && game.activeLord.zone === zone.id;

        return (
          <div
            key={zone.id}
            onClick={clickable ? () => onZoneClick?.(zone.id) : undefined}
            className={[
              'relative min-h-[150px] rounded-lg border p-2 transition',
              TERRAIN_STYLE[zone.terrain],
              activeZone === zone.id ? 'outline outline-1 outline-lantern/50' : '',
              clickable ? 'cursor-pointer ring-2 ring-swamp/70 hover:ring-swamp' : '',
            ].join(' ')}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-xs text-bone">{zone.name}</span>
              <span className="text-[8px] uppercase tracking-wider text-muted">{zone.terrain}</span>
            </div>

            {zone.effects.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1">
                {zone.effects.map((e) => (
                  <span key={e.kind} className="rounded bg-lantern/20 px-1 text-[8px] text-lantern">
                    {e.kind}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-start gap-1">
              {lordHere && game.activeLord && (
                <LordToken
                  lord={game.activeLord}
                  highlight={lordTargetable}
                  onClick={lordTargetable ? onLordClick : undefined}
                />
              )}
              {enemies.map((e) => (
                <EnemyToken
                  key={e.uid}
                  enemy={e}
                  highlight={enemyTargetable}
                  onClick={enemyTargetable ? () => onEnemyClick?.(e.uid) : undefined}
                />
              ))}
            </div>

            <div className="mt-1 flex flex-wrap items-start gap-1">
              {hunters.map((h) => (
                <HunterToken
                  key={h.id}
                  hunter={h}
                  active={game.activeHunter === h.id}
                  highlight={hunterTargetable}
                  onClick={hunterTargetable ? () => onHunterClick?.(h.id) : undefined}
                />
              ))}
            </div>

            {(gadgets.length > 0 || summons.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {gadgets.map((g) => (
                  <GadgetChip key={g.uid} gadget={g} />
                ))}
                {summons.map((s) => (
                  <SummonChip key={s.uid} summon={s} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
