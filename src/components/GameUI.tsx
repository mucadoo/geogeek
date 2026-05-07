'use client';

import { clsx, type ClassValue } from 'clsx';
import { SkipForward, XCircle } from 'lucide-react';
import React, { useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

import { useGameStore } from '@/store/useGameStore';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function GameUI() {
  const { 
    userInput, lastGuessCorrect, currentState, gameMode,
    setUserInput, submitGuess, skipState, resetGame 
  } = useGameStore();
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [currentState]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitGuess(userInput);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      
      {gameMode === 'capital' && currentState && (
        <div className="animate-in slide-in-from-bottom-2 rounded-xl bg-[#2c3e50] px-6 py-2 text-sm font-bold text-white shadow-xl">
          Target: {currentState.properties.name}
        </div>
      )}

      <div className="flex w-full items-center gap-3">
        <div className="relative flex-grow">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={gameMode === 'capital' ? "Type capital..." : "Type region..."}
            className={cn(
              "w-full rounded-2xl border-2 bg-white/90 px-8 py-5 text-xl font-bold shadow-2xl outline-none backdrop-blur-md transition-all placeholder:text-gray-300",
              lastGuessCorrect === false ? "border-red-400 bg-red-50 text-red-600 shake" : "border-transparent focus:border-primary"
            )}
          />
          {lastGuessCorrect === false && (
            <span className="absolute -bottom-6 left-6 text-xs font-bold text-red-500 uppercase">Try again</span>
          )}
        </div>

        <button 
          onClick={skipState}
          className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-gray-400 shadow-xl backdrop-blur-md transition-all hover:bg-white hover:text-primary"
          title="Skip"
        >
          <SkipForward size={28} />
        </button>

        <button 
          onClick={resetGame}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-gray-400 shadow-xl backdrop-blur-md transition-all hover:bg-red-50 hover:text-red-500"
          title="Quit"
        >
          <XCircle size={28} />
        </button>
      </div>

      <style jsx>{`
        .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
