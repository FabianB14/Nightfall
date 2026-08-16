// The Bloodmoon doom clock (§6): a red moon that fills toward `eclipse` as the track rises.
interface Props {
  value: number;
  max: number;
}

export function BloodmoonTrack({ value, max }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3" aria-label={`Bloodmoon ${value} of ${max}`}>
      <div
        className={`relative h-12 w-12 rounded-full overflow-hidden border border-eclipse/60 bg-night ${
          value >= max - 2 ? 'motion-safe:animate-pulse' : ''
        }`}
      >
        <div
          className="absolute bottom-0 left-0 w-full bg-eclipse transition-[height] duration-500"
          style={{ height: `${pct}%`, boxShadow: '0 0 18px 2px rgba(194,54,47,0.6)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-bone mix-blend-difference">
          {value}/{max}
        </div>
      </div>
      <div className="text-xs uppercase tracking-widest text-muted">
        Bloodmoon
        <div className="text-eclipse font-semibold normal-case tracking-normal">
          {value >= max - 2 ? 'The dark is almost here' : 'rising'}
        </div>
      </div>
    </div>
  );
}
