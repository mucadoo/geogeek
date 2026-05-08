import React from 'react';
import { Timer, Star, Trophy } from 'lucide-react';

interface GameHUDProps {
  score: number;
  total: number;
  timeLeft: number;
}

export function GameHUD({ score, total, timeLeft }: GameHUDProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = total > 0 ? (score / total) * 100 : 0;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-96 flex flex-col items-center gap-2">
      {/* Timer */}
      <div className="font-heading text-6xl text-[#2c3e50] tabular-nums tracking-widest">
        {formatTime(timeLeft)}
      </div>
      
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-200 rounded-full flex items-center px-1">
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
