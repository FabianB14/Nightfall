// The main menu / title screen. Sets the tone, then routes into crew select.
import { useState } from 'react';
import { useStore } from '@/store';
import { HowToPlay } from './HowToPlay';
import { SettingsButton } from './Settings';

export function TitleScreen() {
  const goCrew = useStore((s) => s.goCrew);
  const [rules, setRules] = useState(false);

  return (
    <div className="bg-nightfall relative min-h-screen overflow-hidden text-bone">
      {/* The dead sun, hanging over the parish */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-220px] h-[460px] w-[460px] -translate-x-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(194,54,47,0.55), rgba(194,54,47,0.12) 55%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="absolute right-4 top-4">
        <SettingsButton />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 text-xs uppercase tracking-[0.4em] text-eclipse">Gulf Coast Gothic</div>
        <h1 className="font-display text-6xl leading-none drop-shadow-[0_2px_20px_rgba(0,0,0,0.7)] sm:text-7xl">
          Nightfall
        </h1>
        <div className="mt-1 font-display text-3xl text-lantern sm:text-4xl">Last Light</div>

        <p className="mt-6 max-w-xl text-sm text-muted">
          A cooperative, turn-based vampire boss-rush. Pick your coven, fight through the drowned
          districts of Bélâme Parish, break the Vampire Lords, and bring back the dawn.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={goCrew}
            className="rounded-lg bg-eclipse px-10 py-3.5 font-display text-xl shadow-eclipse transition hover:brightness-110"
          >
            New Run
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setRules(true)}
              className="rounded-lg border border-cardBorder px-5 py-2 text-sm text-muted hover:text-bone"
            >
              How to Play
            </button>
            <button
              disabled
              title="Saved runs arrive with accounts (see roadmap)"
              className="rounded-lg border border-cardBorder px-5 py-2 text-sm text-muted/40"
            >
              Continue
            </button>
          </div>
        </div>

        <div className="mt-12 text-[11px] text-muted/60">
          Fill a vampire&apos;s Stagger with <span className="text-lantern">Light</span>, then{' '}
          <span className="text-eclipse">Stake</span> it. That is the whole war.
        </div>
      </div>

      {rules && <HowToPlay onClose={() => setRules(false)} />}
    </div>
  );
}
