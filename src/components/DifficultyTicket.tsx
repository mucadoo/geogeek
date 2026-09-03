import { Check, SlidersHorizontal } from 'lucide-react';
import React from 'react';

interface DifficultyTicketProps {
  title: string;
  /** Already-localized one-liner: format + pace, e.g. "Type the answer · 20s each". */
  desc: string;
  /** 1 (calm) to 5 (brutal) drives the signal-bar meter; 0 shows the settings glyph. */
  intensity: number;
  isSelected: boolean;
  onClick: () => void;
}

// One row on the difficulty ramp. The bar meter makes the easy -> brutal
// progression readable at a glance; the desc carries the actual rules so the
// start screen no longer needs a separate description line.
export default function DifficultyTicket({ title, desc, intensity, isSelected, onClick }: DifficultyTicketProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`group flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10'
          : 'border-[var(--card-border)] bg-[var(--background)]/40 hover:border-primary/50'
      }`}
    >
      <div className="flex h-7 w-8 shrink-0 items-end justify-center gap-[3px]" aria-hidden="true">
        {intensity === 0 ? (
          <SlidersHorizontal size={18} className={isSelected ? 'text-primary' : 'text-slate-400'} />
        ) : (
          [0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${
                i < intensity ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={{ height: `${20 + i * 20}%` }}
            />
          ))
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-game-heading text-base leading-none tracking-wide text-[var(--foreground)]">
          {title}
        </div>
        <div className="mt-1 font-game-mono text-[11px] leading-tight text-slate-500">{desc}</div>
      </div>

      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform ${
          isSelected ? 'scale-100' : 'scale-0'
        }`}
      >
        <Check size={13} strokeWidth={3} />
      </div>
    </button>
  );
}
