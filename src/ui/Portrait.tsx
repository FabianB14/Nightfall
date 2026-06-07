// Character portrait with the same graceful fallback as Card art (§7): if the image is
// missing, render an archetype-tinted monogram. Drop a file at
// public/assets/art/portraits/<character_id>.webp to fill it in — no code change.
import { useState } from 'react';
import type { ArchetypeId } from '@engine/types';
import { archetypeColors } from '@/theme/tokens';
import { resolvePortrait } from '@/assets';

interface Props {
  characterId: string;
  name: string;
  archetype: ArchetypeId;
  size?: number;
  className?: string;
}

export function Portrait({ characterId, name, archetype, size = 72, className }: Props) {
  const [failed, setFailed] = useState(false);
  const color = archetypeColors[archetype];
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-lg border ${className ?? ''}`}
      style={{ width: size, height: size, borderColor: `${color}66` }}
    >
      {!failed ? (
        <img
          src={resolvePortrait(characterId)}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: `radial-gradient(circle at 50% 30%, ${color}44, #0B0E1A 80%)` }}
          aria-hidden
        >
          <span className="font-display opacity-70" style={{ color, fontSize: size * 0.42 }}>
            {name.replace(/^(The |Père |Sister |Mama )/, '').charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
}
