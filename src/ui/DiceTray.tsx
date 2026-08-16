// Shows the last Combat Die roll (§0 faces: Hit, Crit, Miss, Surge).
// Dice tumble in one after another; a fresh roll re-tumbles even if the faces match.
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DieFace } from '@engine/types';

const FACE: Record<DieFace, { label: string; cls: string }> = {
  hit: { label: 'Hit', cls: 'bg-lantern/20 text-lantern border-lantern/50' },
  crit: { label: 'Crit', cls: 'bg-lantern/30 text-lantern border-lantern font-bold' },
  miss: { label: 'Miss', cls: 'bg-night text-muted border-cardBorder' },
  surge: { label: 'Surge', cls: 'bg-eclipse/25 text-eclipse border-eclipse/60' },
};

export function DiceTray({ dice }: { dice: DieFace[] }) {
  const reduced = useReducedMotion();
  // A new roll is a new array reference from the engine — bump a nonce so keys change
  // and every die re-tumbles, even when the faces happen to repeat.
  const [nonce, setNonce] = useState(0);
  const lastRoll = useRef<DieFace[]>(dice);
  useEffect(() => {
    if (dice !== lastRoll.current) {
      lastRoll.current = dice;
      setNonce((n) => n + 1);
    }
  }, [dice]);

  if (!dice.length) {
    return <div className="text-xs text-muted/60 italic">no dice rolled yet</div>;
  }
  return (
    <div className="flex flex-wrap gap-1" aria-label="last dice roll">
      {dice.map((d, i) => (
        <motion.span
          key={`${nonce}-${i}`}
          initial={reduced ? false : { scale: 0.3, rotate: -120, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22, delay: reduced ? 0 : i * 0.06 }}
          className={`inline-flex h-8 w-10 items-center justify-center rounded border text-[10px] uppercase ${FACE[d].cls}`}
        >
          {FACE[d].label}
        </motion.span>
      ))}
    </div>
  );
}
