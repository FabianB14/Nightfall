// Audio settings (master volume + mute), persisted to localStorage by the audio manager (§8).
import { useState } from 'react';
import { audio } from '@/audio/audio';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [vol, setVol] = useState(() => audio.getSettings().volume);
  const [muted, setMuted] = useState(() => audio.getSettings().muted);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Audio settings"
        className="rounded-full border border-cardBorder bg-surface px-3 py-2 text-sm text-muted hover:text-bone"
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-cardBorder bg-surface p-3 shadow-xl">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-muted">Audio</div>
          <label className="flex items-center justify-between text-xs text-bone">
            Mute
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => {
                setMuted(e.target.checked);
                audio.mute(e.target.checked);
              }}
            />
          </label>
          <label className="mt-3 block text-xs text-bone">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vol}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVol(v);
                audio.setVolume(v);
              }}
              className="mt-1 w-full accent-lantern"
            />
          </label>
          <p className="mt-2 text-[10px] text-muted/70">No audio files ship yet — this is wired for when they do.</p>
        </div>
      )}
    </div>
  );
}
