import React from 'react';

interface RegionCounterProps {
  label: string;
  count: number;
  total: number;
}

export function RegionCounter({ label, count, total }: RegionCounterProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-[var(--card-border)] flex items-center justify-center bg-[var(--hud-bg)] backdrop-blur-md relative">
        <span className="font-game-mono text-lg font-bold text-[var(--foreground)]">
          {count}/{total}
        </span>
      </div>
      <span className="font-game-heading text-xs text-[var(--foreground)] opacity-70 uppercase tracking-widest">{label}</span>
    </div>
  );
}
