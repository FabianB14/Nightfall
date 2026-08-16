// The Deck Builder (§9): pick a hunter, fill the personal slots from their pool
// (own cards + unlocked same-archetype variants), name it, save it to localStorage.
// Spine, inherent and ultimate are locked in — a deck is the 3 personal choices.
import { useMemo, useState } from 'react';
import { characters } from '@data/characters';
import { archetypes } from '@data/archetypes';
import { cardsById } from '@data/cards';
import { archetypeColors } from '@/theme/tokens';
import { useStore } from '@/store';
import {
  isUnlocked,
  unlockText,
  personalPool,
  validateDeck,
  PERSONAL_SLOTS,
  type SavedDeck,
} from '@/services/progress';
import { Portrait } from './Portrait';
import { Card } from './Card';
import { SettingsButton } from './Settings';

const archetypeById = Object.fromEntries(archetypes.map((a) => [a.id, a]));

function newDeckId(): string {
  return `deck_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function DeckBuilder() {
  const goCrew = useStore((s) => s.goCrew);
  const progress = useStore((s) => s.progress);
  const decks = useStore((s) => s.decks);
  const saveDeck = useStore((s) => s.saveDeck);
  const deleteDeck = useStore((s) => s.deleteDeck);

  const unlockedChars = characters.filter((c) => isUnlocked(c.unlock, progress));
  const [characterId, setCharacterId] = useState(unlockedChars[0]?.id ?? 'trapper');
  const [editingId, setEditingId] = useState<string | null>(null); // SavedDeck.id being edited
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const character = useMemo(() => characters.find((c) => c.id === characterId)!, [characterId]);
  const archetype = archetypeById[character.archetype];
  const pool = useMemo(() => personalPool(characterId, progress), [characterId, progress]);
  const myDecks = decks.filter((d) => d.characterId === characterId);

  const draft: SavedDeck = {
    id: editingId ?? 'draft',
    name: name.trim() || `${character.name} deck`,
    characterId,
    cardIds: picked,
  };
  const problems = validateDeck(draft, progress);

  function selectCharacter(id: string) {
    setCharacterId(id);
    setEditingId(null);
    setName('');
    setPicked([]);
  }

  function togglePick(cardId: string) {
    setPicked((cur) =>
      cur.includes(cardId)
        ? cur.filter((x) => x !== cardId)
        : cur.length < PERSONAL_SLOTS
          ? [...cur, cardId]
          : cur,
    );
  }

  function loadDeckForEdit(deck: SavedDeck) {
    setEditingId(deck.id);
    setName(deck.name);
    setPicked([...deck.cardIds]);
  }

  function save() {
    if (problems.length > 0) return;
    saveDeck({ ...draft, id: editingId ?? newDeckId() });
    setEditingId(null);
    setName('');
    setPicked([]);
  }

  const lockedIn = [
    ...archetype.spine.map((id) => cardsById[id]),
    cardsById[character.inherent],
    cardsById[character.ultimate],
  ].filter(Boolean);

  return (
    <div className="bg-nightfall min-h-screen text-bone">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={goCrew} className="text-sm text-muted hover:text-bone">
            ← Crew select
          </button>
          <h1 className="font-display text-2xl text-lantern sm:text-3xl">Deck Builder</h1>
          <SettingsButton />
        </div>

        <div className="grid gap-5 lg:grid-cols-[220px_1fr_260px]">
          {/* Hunter picker */}
          <aside className="flex flex-col gap-2">
            <div className="text-[10px] uppercase tracking-widest text-muted">Hunter</div>
            {characters.map((ch) => {
              const locked = !isUnlocked(ch.unlock, progress);
              const active = ch.id === characterId;
              const color = archetypeColors[ch.archetype];
              return (
                <button
                  key={ch.id}
                  onClick={() => !locked && selectCharacter(ch.id)}
                  disabled={locked}
                  className={[
                    'flex items-center gap-2 rounded-lg border p-2 text-left transition',
                    active ? 'border-lantern bg-surface' : 'border-cardBorder bg-surface/60',
                    locked ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-lantern/60',
                  ].join(' ')}
                >
                  <Portrait characterId={ch.id} name={ch.name} archetype={ch.archetype} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs">{ch.name}</span>
                    <span className="block text-[9px]" style={{ color }}>
                      {archetypeById[ch.archetype].name.replace('The ', '')}
                    </span>
                    {locked && <span className="block text-[9px] text-eclipse/90">🔒 {unlockText(ch.unlock)}</span>}
                  </span>
                </button>
              );
            })}
          </aside>

          {/* Card pool */}
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-[10px] uppercase tracking-widest text-muted">
                Personal slots — pick {PERSONAL_SLOTS} ({picked.length}/{PERSONAL_SLOTS})
              </div>
              <div className="text-[10px] text-muted">
                variants come from unlocked {archetype.name.replace('The ', '')} hunters
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {pool.map((card) => {
                const own = character.personal.includes(card.id);
                return (
                  <div key={card.id} className="relative">
                    <Card
                      card={card}
                      compact
                      selected={picked.includes(card.id)}
                      disabled={!picked.includes(card.id) && picked.length >= PERSONAL_SLOTS}
                      onClick={() => togglePick(card.id)}
                    />
                    {!own && (
                      <span className="absolute -top-1 -right-1 rounded bg-conjurer px-1 text-[8px] text-night">
                        variant
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 text-[10px] uppercase tracking-widest text-muted">
              Always in the deck — {archetype.name.replace('The ', '')} spine · inherent · ultimate
            </div>
            <div className="mt-2 flex flex-wrap gap-2 opacity-80">
              {lockedIn.map((card) => (
                <Card key={card.id} card={card} compact />
              ))}
            </div>
          </section>

          {/* Save panel + saved decks */}
          <aside className="flex flex-col gap-3">
            <div className="rounded-xl border border-cardBorder bg-surface/80 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted">
                {editingId ? 'Edit deck' : 'New deck'}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${character.name} deck`}
                aria-label="Deck name"
                className="mt-2 w-full rounded border border-cardBorder bg-night px-2 py-1.5 text-sm"
              />
              {problems.length > 0 && picked.length > 0 && (
                <ul className="mt-2 text-[10px] text-eclipse">
                  {problems.map((p) => (
                    <li key={p}>• {p}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={save}
                disabled={problems.length > 0}
                className="mt-3 w-full rounded bg-lantern py-1.5 text-sm font-semibold text-night disabled:opacity-40"
              >
                {editingId ? 'Save changes' : 'Save deck'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setPicked([]);
                  }}
                  className="mt-1 w-full rounded border border-cardBorder py-1 text-xs text-muted"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="rounded-xl border border-cardBorder bg-surface/80 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted">
                Saved decks — {character.name}
              </div>
              {myDecks.length === 0 && (
                <p className="mt-2 text-xs italic text-muted">None yet. The standard kit is always available.</p>
              )}
              <ul className="mt-2 flex flex-col gap-1.5">
                {myDecks.map((d) => (
                  <li key={d.id} className="flex items-center gap-1 rounded bg-night/50 px-2 py-1.5 text-xs">
                    <span className="min-w-0 flex-1 truncate">{d.name}</span>
                    <button onClick={() => loadDeckForEdit(d)} className="text-muted hover:text-lantern" aria-label={`Edit ${d.name}`}>
                      ✎
                    </button>
                    <button onClick={() => deleteDeck(d.id)} className="text-muted hover:text-eclipse" aria-label={`Delete ${d.name}`}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-cardBorder bg-surface/60 p-3 text-[11px] text-muted">
              <div className="text-[10px] uppercase tracking-widest">Hunter's ledger</div>
              <p className="mt-1">
                Lords slain: <span className="text-lantern">{progress.lordKills}</span> · Runs won:{' '}
                <span className="text-lantern">{progress.wins}</span> · Runs begun:{' '}
                <span className="text-lantern">{progress.runs}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
