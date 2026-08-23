import { Star, Trophy, Sparkles, Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

import { useGameStore } from '@/store/useGameStore';

interface GameHUDProps {
  score: number;
  total: number;
  timeLeft: number;
}

export function GameHUD({ score, total, timeLeft }: GameHUDProps) {
  const t = useTranslations('Quiz');
  const { masteryPoints, currentMultiplier, streak } = useGameStore();
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = total > 0 ? (score / total) * 100 : 0;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-96 flex flex-col items-center gap-2">
      {/* Timer & Points Container */}
      <div className="flex flex-col items-center">
        <div className="font-game-heading text-7xl text-[var(--foreground)] tabular-nums tracking-widest [text-shadow:0_2px_4px_rgba(0,0,0,0.2)]">
          {formatTime(timeLeft)}
        </div>
        
        {/* Real-time Mastery Points — key={masteryPoints} retriggers the
            pop-in animation on every score change, not just on mount. */}
        <div key={masteryPoints} className="flex items-center gap-2 bg-primary/20 border border-primary px-4 py-1.5 rounded-full -mt-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
          <Sparkles size={14} className="text-primary animate-pulse" />
          <span className="font-game-mono text-xs font-bold text-primary tracking-tighter uppercase">
            {masteryPoints.toLocaleString()} {t('pts')} ({currentMultiplier}x)
          </span>
        </div>

        {/* Streak / combo indicator — key={streak} remounts the badge on
            every increment so the pop-in animation retriggers each time. */}
        {streak >= 3 && (
          <div key={streak} className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500 px-3 py-1 rounded-full mt-2 animate-in zoom-in duration-300">
            <Flame size={12} className="text-amber-500" />
            <span className="font-game-mono text-[10px] font-bold text-amber-500 tracking-tighter uppercase">
              {streak} {t('streakLabel')}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-[var(--card-border)] rounded-full flex items-center px-1">
        <div 
          className="absolute left-1 h-1 bg-primary rounded-full transition-all duration-500" 
          style={{ width: `calc(${progress}% - 8px)` }} 
        />
        {[25, 50, 75].map((p) => (
          <Star key={p} size={14} className={`absolute text-slate-400 ${progress >= p ? 'fill-accent text-accent' : ''}`} style={{ left: `${p}%` }} />
        ))}
        <Trophy size={18} className="absolute right-0 text-slate-400" />
      </div>
    </div>
  );
}
