// Renders ANY card purely from its CardDef (§7). One component for all ~80 cards.
// Art is optional: a missing image swaps to an archetype-colored placeholder frame, so the
// whole game is playable with zero art — drop in public/assets/cards/<id>.webp to fill it.
import { useState } from 'react';
import type { CardDef } from '@engine/types';
import { archetypeColors } from '@/theme/tokens';
import { resolveCardArt } from '@/assets';

interface CardProps {
  card: CardDef;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

const SLOT_LABEL: Record<CardDef['slot'], string> = {
  spine: 'Starter',
  inherent: 'Inherent',
  personal: 'Personal',
  ultimate: 'Ultimate',
};

function costLabel(card: CardDef): string {
  if (card.cost.reaction) return 'React';
  if (card.cost.quick) return 'Quick';
  return `${card.cost.action}A`;
}

export function Card({ card, onClick, selected, disabled, compact }: CardProps) {
  const [artFailed, setArtFailed] = useState(false);
  const color = archetypeColors[card.archetype];
  const isUltimate = card.slot === 'ultimate';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${card.name}, ${card.type}, cost ${costLabel(card)}. ${card.text}`}
      aria-pressed={selected}
      className={[
        'group relative flex flex-col text-left rounded-lg overflow-hidden transition-all',
        compact ? 'w-28 h-40' : 'w-44 h-64',
        'bg-cardFace border',
        selected ? 'ring-2 ring-lantern -translate-y-2' : 'border-cardBorder',
        disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 cursor-pointer',
        isUltimate ? 'shadow-[0_0_18px_-2px_rgba(242,185,92,0.8)]' : '',
      ].join(' ')}
      style={isUltimate ? { borderColor: '#F2B95C' } : { borderColor: color }}
    >
      {/* Top banner: cost badge (left), card type (right) */}
      <div
        className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wide"
        style={{ backgroundColor: color, color: '#0B0E1A' }}
      >
        <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1 rounded bg-night/80 text-bone">
          {costLabel(card)}
        </span>
        <span className="uppercase">{card.type}</span>
      </div>

      {/* Name */}
      <div className="px-2 pt-1 font-display text-bone leading-tight" style={{ fontSize: compact ? 11 : 14 }}>
        {card.name}
      </div>

      {/* Art window (or placeholder) */}
      <div className="relative mx-2 mt-1 flex-1 rounded overflow-hidden bg-night/60 border border-cardBorder/60">
        {!artFailed ? (
          <img
            src={resolveCardArt(card)}
            alt=""
            onError={() => setArtFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `radial-gradient(circle at 50% 35%, ${color}33, #0B0E1A 75%)` }}
          >
            <span
              className="font-display opacity-40 select-none"
              style={{ color, fontSize: compact ? 26 : 40 }}
              aria-hidden
            >
              {card.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Effect text */}
      {!compact && (
        <div className="px-2 py-1 text-[10px] leading-snug text-muted line-clamp-4">{card.text}</div>
      )}

      {/* Footer tag */}
      <div
        className="px-2 py-0.5 text-[9px] uppercase tracking-widest"
        style={{ color, borderTop: `1px solid ${color}55` }}
      >
        {SLOT_LABEL[card.slot]}
        {card.unlock && card.unlock.kind !== 'starter' ? ' · Locked' : ''}
      </div>
    </button>
  );
}
