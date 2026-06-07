// Crew select: browse the eight Hunters, read their kit, draft a coven of 1–4, then descend.
// Reuses Card.tsx to preview each hunter's signature + ultimate from data alone.
import { useMemo, useState } from 'react';
import { characters } from '@data/characters';
import { archetypes } from '@data/archetypes';
import { cardsById } from '@data/cards';
import { archetypeColors } from '@/theme/tokens';
import { useStore } from '@/store';
import { Portrait } from './Portrait';
import { Card } from './Card';
import { SettingsButton } from './Settings';

const archetypeById = Object.fromEntries(archetypes.map((a) => [a.id, a]));

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function CharacterSelect() {
  const goTitle = useStore((s) => s.goTitle);
  const newRun = useStore((s) => s.newRun);

  const [crew, setCrew] = useState<string[]>(['trapper']);
  const [focusId, setFocusId] = useState<string>('trapper');
  const [seed, setSeed] = useState(randomSeed());
  const [lordCount, setLordCount] = useState(3);

  const focus = useMemo(() => characters.find((c) => c.id === focusId)!, [focusId]);
  const focusArch = archetypeById[focus.archetype];

  function toggle(id: string) {
    setCrew((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) return cur;
      return [...cur, id];
    });
  }

  return (
    <div className="bg-nightfall min-h-screen text-bone">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <button onClick={goTitle} className="text-sm text-muted hover:text-bone">
            ← Title
          </button>
          <h1 className="font-display text-2xl text-lantern sm:text-3xl">Assemble your coven</h1>
          <SettingsButton />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Roster grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {characters.map((ch) => {
              const selected = crew.includes(ch.id);
              const focused = focusId === ch.id;
              const color = archetypeColors[ch.archetype];
              const locked = ch.unlock && ch.unlock.kind !== 'starter';
              return (
                <div
                  key={ch.id}
                  onClick={() => setFocusId(ch.id)}
                  className={[
                    'flex cursor-pointer flex-col rounded-lg border bg-surface/80 p-3 transition',
                    focused ? 'ring-1 ring-lantern' : '',
                    selected ? 'border-lantern' : 'border-cardBorder',
                  ].join(' ')}
                  style={selected ? { boxShadow: `0 0 14px -4px ${color}` } : undefined}
                >
                  <div className="flex items-start gap-2">
                    <Portrait characterId={ch.id} name={ch.name} archetype={ch.archetype} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-sm">{ch.name}</div>
                      <div
                        className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                        style={{ backgroundColor: `${color}33`, color }}
                      >
                        {archetypeById[ch.archetype].name.replace('The ', '')}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted">{ch.hp} HP</div>
                    </div>
                  </div>

                  {locked && (
                    <div className="mt-1 text-[9px] text-eclipse/90">
                      {ch.unlock?.kind === 'progression'
                        ? `Unlocks after ${ch.unlock.afterLordKills} Lord kills`
                        : 'Locked'}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(ch.id);
                    }}
                    className={[
                      'mt-2 rounded py-1 text-xs font-semibold transition',
                      selected ? 'bg-lantern text-night' : 'border border-cardBorder text-muted hover:text-bone',
                    ].join(' ')}
                  >
                    {selected ? '✓ In coven' : crew.length >= 4 ? 'Coven full' : '+ Add'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Detail panel for the focused hunter */}
          <aside className="rounded-xl border border-cardBorder bg-surface/80 p-4">
            <div className="flex items-center gap-3">
              <Portrait characterId={focus.id} name={focus.name} archetype={focus.archetype} size={64} />
              <div>
                <div className="font-display text-xl">{focus.name}</div>
                <div className="text-xs text-muted">{focusArch.role}</div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-night/50 p-2 text-xs">
              <span className="text-lantern">Passive — </span>
              <span className="text-muted">{focus.passive}</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded bg-night/50 p-2">
                <div className="text-muted">Resource</div>
                <div className="text-bone capitalize">{focus.resourceType ?? '—'}</div>
              </div>
              <div className="rounded bg-night/50 p-2">
                <div className="text-muted">Health</div>
                <div className="text-bone">{focus.hp} HP</div>
              </div>
            </div>

            <div className="mt-3 text-[10px] uppercase tracking-widest text-muted">Signature kit</div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {cardsById[focus.inherent] && <Card card={cardsById[focus.inherent]} compact />}
              {cardsById[focus.ultimate] && <Card card={cardsById[focus.ultimate]} compact />}
            </div>
          </aside>
        </div>

        {/* Launch bar */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-cardBorder bg-surface/70 p-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">
              Coven ({crew.length}/4)
            </div>
            <div className="flex flex-wrap gap-2">
              {crew.length === 0 && <span className="text-xs italic text-muted">choose at least one hunter</span>}
              {crew.map((id) => {
                const ch = characters.find((c) => c.id === id)!;
                const color = archetypeColors[ch.archetype];
                return (
                  <span
                    key={id}
                    className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                    style={{ borderColor: `${color}88` }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {ch.name.replace(/^(The |Père |Sister |Mama )/, '')}
                    <button onClick={() => toggle(id)} className="ml-1 text-muted hover:text-eclipse" aria-label={`Remove ${ch.name}`}>
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">Seed</div>
              <div className="flex gap-1">
                <input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-28 rounded border border-cardBorder bg-night px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => setSeed(randomSeed())}
                  className="rounded border border-cardBorder px-2 text-xs text-muted hover:text-bone"
                  aria-label="Randomize seed"
                >
                  ↻
                </button>
              </div>
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[10px] uppercase tracking-widest text-muted">Lords</div>
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
              className="rounded-lg bg-eclipse px-7 py-3 font-display text-lg shadow-eclipse transition hover:brightness-110 disabled:opacity-40"
            >
              Into the Dark →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
