// The active hunter's hand, plus deck/discard counters (§ M4). Clicking selects a card.
// Card draws slide up into the hand (Framer Motion, gated on prefers-reduced-motion).
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { HunterState } from '@engine/types';
import { cardsById } from '@data/cards';
import { Card } from './Card';

interface HandProps {
  hunter: HunterState;
  selectedCard: string | null;
  onSelect: (cardId: string) => void;
  yourTurn: boolean;
}

function affordable(hunter: HunterState, cardId: string): boolean {
  const card = cardsById[cardId];
  if (!card) return false;
  if (card.slot === 'ultimate') return hunter.charge >= 5;
  const actionOk = card.cost.quick || card.cost.reaction || hunter.actionsLeft >= card.cost.action;
  const resOk =
    !card.cost.resource ||
    hunter.resourceType !== card.cost.resource.type ||
    hunter.resource >= card.cost.resource.amount;
  return actionOk && resOk;
}

export function Hand({ hunter, selectedCard, onSelect, yourTurn }: HandProps) {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col items-center gap-1 text-[10px] text-muted">
        <div className="rounded bg-surface px-2 py-1">Deck {hunter.deck.length}</div>
        <div className="rounded bg-surface px-2 py-1">Discard {hunter.discard.length}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {hunter.hand.map((cardId, i) => {
            const card = cardsById[cardId];
            if (!card) return null;
            return (
              <motion.div
                key={`${cardId}-${i}`}
                layout={!reduced}
                initial={reduced ? false : { y: 40, opacity: 0, rotate: -3 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={reduced ? undefined : { y: 30, opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              >
                <Card
                  card={card}
                  selected={selectedCard === cardId}
                  disabled={!yourTurn || !affordable(hunter, cardId)}
                  onClick={() => onSelect(cardId)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
        {hunter.hand.length === 0 && <div className="text-xs italic text-muted">empty hand</div>}
      </div>
    </div>
  );
}
