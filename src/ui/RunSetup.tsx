// Crew select + run start (§ M7 entry; the slice uses it as the menu). Pick 1–4 Hunters,
// choose how many Lords stand before the Eclipse Heart, and descend into the parish.
import { useState } from 'react';
import { characters } from '@data/characters';
import { archetypes } from '@data/archetypes';
import { archetypeColors } from '@/theme/tokens';
import { useStore } from '@/store';

const archetypeName = Object.fromEntries(archetypes.map((a) => [a.id, a.name]));

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function RunSetup() {
  const newRun = useStore((s) => s.newRun);
  const [crew, setCrew] = useState<string[]>(['trapper']);
  const [seed, setSeed] = useState(randomSeed());
  const [lordCount, setLordCount] = useState(3);

  function toggle(id: string) {
    setCrew((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) return cur;
      return [...cur, id];
    });
  }

  return (
    <div className="bg-nightfall min-h-screen px-4 py-10 text-bone">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl text-bone">
          Nightfall<span className="text-eclipse">:</span> <span className="text-lantern">Last Light</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Bélâme Parish is locked under an endless eclipse. Pick your coven, break the Vampire
          Lords, and bring back the dawn. Fill a vampire&apos;s Stagger with{' '}
          <span className="text-lantern">Light</span>, then <span className="text-eclipse">Stake</span> it.
        </p>

        <h2 className="mt-8 font-display text-xl text-lantern">Choose your crew (1–4)</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {characters.map((ch) => {
            const selected = crew.includes(ch.id);
            const color = archetypeColors[ch.archetype];
            const locked = ch.unlock && ch.unlock.kind !== 'starter';
            return (
              <button
                key={ch.id}
                onClick={() => toggle(ch.id)}
                aria-pressed={selected}
                className={[
                  'rounded-lg border p-3 text-left transition',
                  selected ? 'ring-2 ring-lantern -translate-y-0.5' : 'border-cardBorder',
                  'bg-surface hover:-translate-y-0.5',
                ].join(' ')}
                style={{ borderColor: selected ? '#F2B95C' : `${color}55` }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-display text-sm">{ch.name}</span>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                  {archetypeName[ch.archetype]} · {ch.hp} HP
                </div>
                <div className="mt-1 text-[11px] leading-snug text-muted line-clamp-3">{ch.passive}</div>
                {locked && (
                  <div className="mt-1 text-[9px] text-eclipse">
                    {ch.unlock?.kind === 'progression'
                      ? `Unlock: kill ${ch.unlock.afterLordKills} Lords`
                      : 'Locked'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-6">
          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted">Seed</div>
            <div className="flex gap-2">
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-40 rounded border border-cardBorder bg-night px-2 py-1.5 text-sm text-bone"
              />
              <button
                onClick={() => setSeed(randomSeed())}
                className="rounded border border-cardBorder px-2 text-xs text-muted hover:text-bone"
              >
                ↻
              </button>
            </div>
          </label>

          <label className="text-sm">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted">Lords before the Heart</div>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setLordCount(n)}
                  className={[
                    'h-9 w-9 rounded border text-sm',
                    lordCount === n ? 'border-lantern bg-lantern text-night' : 'border-cardBorder text-muted',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </label>

          <button
            disabled={crew.length === 0}
            onClick={() => newRun(seed, crew, lordCount)}
            className="rounded-lg bg-eclipse px-6 py-3 font-display text-lg text-bone shadow-eclipse transition hover:brightness-110 disabled:opacity-40"
          >
            Into the Dark →
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Selected: {crew.length ? crew.map((c) => characters.find((x) => x.id === c)?.name).join(', ') : 'none'}
        </p>
      </div>
    </div>
  );
}
