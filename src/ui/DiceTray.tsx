// Shows the last Combat Die roll (§0 faces: Hit, Crit, Miss, Surge).
import type { DieFace } from '@engine/types';

const FACE: Record<DieFace, { label: string; cls: string }> = {
  hit: { label: 'Hit', cls: 'bg-lantern/20 text-lantern border-lantern/50' },
  crit: { label: 'Crit', cls: 'bg-lantern/30 text-lantern border-lantern font-bold' },
  miss: { label: 'Miss', cls: 'bg-night text-muted border-cardBorder' },
  surge: { label: 'Surge', cls: 'bg-eclipse/25 text-eclipse border-eclipse/60' },
};

export function DiceTray({ dice }: { dice: DieFace[] }) {
  if (!dice.length) {
    return <div className="text-xs text-muted/60 italic">no dice rolled yet</div>;
  }
  return (
    <div className="flex flex-wrap gap-1" aria-label="last dice roll">
      {dice.map((d, i) => (
        <span
          key={i}
          className={`inline-flex h-8 w-10 items-center justify-center rounded border text-[10px] uppercase ${FACE[d].cls}`}
        >
          {FACE[d].label}
        </span>
      ))}
    </div>
  );
}
