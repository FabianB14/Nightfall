// Small board tokens for hunters, enemies, the Lord, gadgets and summons.
import type { EnemyState, HunterState, LordState, GadgetState, SummonState } from '@engine/types';
import { archetypeColors } from '@/theme/tokens';

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1 w-full rounded bg-night/80 overflow-hidden">
      <div className="h-full transition-[width] duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function HunterToken({
  hunter,
  active,
  highlight,
  onClick,
}: {
  hunter: HunterState;
  active?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const color = archetypeColors[hunter.archetype];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${hunter.name}, ${hunter.hp} of ${hunter.maxHp} HP${hunter.downed ? ', downed' : ''}`}
      className={[
        'flex w-20 flex-col items-center gap-0.5 rounded-md border p-1 text-center transition',
        active ? 'border-lantern shadow-lantern' : 'border-cardBorder',
        highlight ? 'ring-2 ring-swamp animate-pulse' : '',
        hunter.downed ? 'opacity-40 grayscale' : '',
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : '',
      ].join(' ')}
      style={{ backgroundColor: `${color}22` }}
    >
      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      <div className="truncate text-[9px] text-bone w-full">{hunter.name.replace(/^The /, '')}</div>
      <Bar value={hunter.hp} max={hunter.maxHp} color="#A9B24E" />
      <div className="text-[8px] text-muted">
        {hunter.hp}/{hunter.maxHp}
        {hunter.shield > 0 ? ` 🛡${hunter.shield}` : ''}
      </div>
      {hunter.resourceType && (
        <div className="text-[8px] text-lantern">
          {hunter.resourceType}: {hunter.resource}
        </div>
      )}
      <div className="text-[8px] text-eclipse">⚡{hunter.charge}/5</div>
    </button>
  );
}

export function EnemyToken({
  enemy,
  highlight,
  onClick,
}: {
  enemy: EnemyState;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const st = enemy.staggerThreshold;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${enemy.name}, ${enemy.hp} HP${enemy.staggered ? ', staggered' : ''}`}
      className={[
        'flex w-16 flex-col items-center gap-0.5 rounded-md border p-1 text-center transition',
        enemy.staggered ? 'border-lantern shadow-lantern' : 'border-eclipse/50',
        highlight ? 'ring-2 ring-lantern cursor-pointer hover:-translate-y-0.5' : '',
        'bg-eclipse/10',
      ].join(' ')}
    >
      <div className="text-[9px] text-bone">{enemy.name}</div>
      <Bar value={enemy.hp} max={enemy.maxHp} color="#C2362F" />
      <div className="text-[8px] text-muted">{enemy.hp} hp</div>
      {st !== null && (
        <div className={`text-[8px] ${enemy.staggered ? 'text-lantern' : 'text-muted'}`}>
          {enemy.staggered ? 'STAGGERED' : `☀ ${enemy.light}/${st}`}
        </div>
      )}
      {enemy.mark && <div className="text-[8px] text-conjurer">hexed</div>}
    </button>
  );
}

export function LordToken({
  lord,
  highlight,
  onClick,
}: {
  lord: LordState;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${lord.name}, ${lord.hp} of ${lord.maxHp} HP${lord.staggered ? ', staggered' : ''}${lord.enraged ? ', enraged' : ''}`}
      className={[
        'flex w-28 flex-col items-center gap-0.5 rounded-md border-2 p-1.5 text-center transition',
        lord.staggered ? 'border-lantern shadow-lantern' : 'border-eclipse',
        lord.enraged ? 'bg-eclipse/30' : 'bg-eclipse/15',
        highlight ? 'ring-2 ring-lantern cursor-pointer hover:-translate-y-0.5' : '',
      ].join(' ')}
    >
      <div className="font-display text-[11px] text-bone leading-tight">
        {lord.name}
        {lord.enraged ? ' ⚔' : ''}
      </div>
      <Bar value={lord.hp} max={lord.maxHp} color="#C2362F" />
      <div className="text-[9px] text-muted">
        {lord.hp}/{lord.maxHp} hp
      </div>
      <div className={`text-[9px] ${lord.staggered ? 'text-lantern' : 'text-muted'}`}>
        {lord.staggered ? 'STAGGERED' : `☀ ${lord.light}/${lord.staggerThreshold}`}
      </div>
    </button>
  );
}

export function GadgetChip({ gadget }: { gadget: GadgetState }) {
  return (
    <span className="rounded bg-maker/25 px-1 py-0.5 text-[8px] text-maker" title={gadget.type}>
      {gadget.type.replace(/_/g, ' ')}
    </span>
  );
}

export function SummonChip({ summon }: { summon: SummonState }) {
  return (
    <span className="rounded bg-conjurer/25 px-1 py-0.5 text-[8px] text-conjurer">
      {summon.name} {summon.hp}hp
    </span>
  );
}
