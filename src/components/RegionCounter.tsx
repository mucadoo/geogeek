import React from 'react';

interface RegionCounterProps {
  label: string;
  count: number;
  total: number;
}

export function RegionCounter({ label, count, total }: RegionCounterProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white/50 backdrop-blur-sm relative">
        <div className="absolute inset-0 opacity-10 bg-slate-400 rounded-full" />
        <span className="font-mono text-lg font-bold text-slate-700">
          {count}/{total}
        </span>
      </div>
      <span className="font-heading text-xs text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
