// A short rules primer surfaced from the title/crew screens. The one rule that defines
// the game: vampires ignore damage unless Staggered (§3 of the design doc).
interface Props {
  onClose: () => void;
}

export function HowToPlay({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/85 p-4 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
    >
      <div
        className="max-h-[85vh] max-w-lg overflow-y-auto rounded-xl border border-cardBorder bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl text-lantern">How to hunt</h2>
        <p className="mt-2 text-sm text-muted">
          Bélâme Parish is locked under an endless eclipse. You are the few who didn&apos;t kneel.
          Break the Vampire Lords, reach the Eclipse Heart, bring back the dawn.
        </p>

        <ol className="mt-4 space-y-3 text-sm">
          <li>
            <span className="font-display text-lantern">1 · Light → Stagger → Stake.</span>
            <p className="text-muted">
              Vampires ignore damage unless <span className="text-lantern">Staggered</span>. Fill a
              vampire&apos;s Stagger Threshold with <span className="text-lantern">Light</span>, then{' '}
              <span className="text-eclipse">Stake</span> it for real HP damage. (Thralls and human
              Cultists can be hurt anytime.)
            </p>
          </li>
          <li>
            <span className="font-display text-lantern">2 · Play a card, then roll.</span>
            <p className="text-muted">
              Two actions per turn. Many attacks roll the Combat Die — <em>Hit, Hit, Crit, Miss,
              Miss, Surge</em>. A <span className="text-eclipse">Surge</span> lets the dark strike
              back at end of turn, so reckless turns get punished.
            </p>
          </li>
          <li>
            <span className="font-display text-lantern">3 · Beat the clock.</span>
            <p className="text-muted">
              The <span className="text-eclipse">Bloodmoon</span> rises as you fight. If it fills, or
              the whole crew falls, the dark wins. Charge your <span className="text-lantern">Ultimate</span>{' '}
              by dealing HP damage and killing.
            </p>
          </li>
        </ol>

        <p className="mt-4 text-xs text-muted">
          Crew matters: the Maker powers the stagger engine for everyone, the Devout keeps you
          standing, the Revenant and Cursed can bypass the stagger loop entirely.
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded bg-lantern py-2 font-semibold text-night"
        >
          Into the dark
        </button>
      </div>
    </div>
  );
}
