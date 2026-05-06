'use client';

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Timer, Trophy, SkipForward } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GameUI() {
  const { 
    status, score, timeLeft, userInput, lastGuessCorrect,
    remainingStates, currentState,
    setUserInput, submitGuess, skipState, tick 
  } = useGameStore();
  
  const inputRef = useRef<HTMLInputElement>(null);

  const totalStates = 50; // Standard for US states quiz
  const currentProgress = totalStates - (remainingStates.length + (currentState ? 1 : 0));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'playing') {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, tick]);

  useEffect(() => {
    if (status === 'playing') {
      inputRef.current?.focus();
    }
  }, [status, currentState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitGuess(userInput);
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto p-6 bg-white rounded-3xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold">
          <Timer size={18} />
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-bold">
          <Trophy size={18} />
          {score}
        </div>
      </div>

      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(currentProgress / totalStates) * 100}%` }}
        />
      </div>

      {status === 'playing' ? (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type state name..."
              className={cn(
                "w-full px-6 py-4 bg-gray-50 border-2 outline-none rounded-2xl text-lg font-medium transition-all",
                lastGuessCorrect === false ? "border-red-400 bg-red-50 shake" : "border-transparent focus:border-primary focus:bg-white"
              )}
            />
            {lastGuessCorrect === false && (
              <p className="absolute -bottom-6 left-2 text-xs text-red-500 font-semibold animate-in fade-in slide-in-from-top-1">
                Try again!
              </p>
            )}
          </div>
          <button
            onClick={skipState}
            className="flex items-center justify-center gap-2 py-3 px-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-semibold mt-2"
          >
            <SkipForward size={18} />
            Skip State
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Game Over!</h2>
          <p className="text-gray-500">Your final score: <span className="font-bold text-primary">{score}</span> / {totalStates}</p>
        </div>
      )}
      
      <style jsx>{`
        .shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
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
