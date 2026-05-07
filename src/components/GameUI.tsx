'use client';

import { clsx, type ClassValue } from 'clsx';
import { Timer, Trophy, SkipForward, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

import { useGameStore } from '@/store/useGameStore';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function GameUI() {
  const router = useRouter();
  const { 
    status, score, timeLeft, userInput, lastGuessCorrect,
    remainingStates, currentState, totalToGuess,
    setUserInput, submitGuess, skipState, tick, resetGame
  } = useGameStore();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const currentProgress = totalToGuess - (remainingStates.length + (currentState ? 1 : 0));

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

  const handleQuit = () => {
    resetGame();
    router.push('/games');
  };

  if (status === 'idle') return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 font-bold text-blue-700">
          <Timer size={18} />
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 font-bold text-amber-700">
          <Trophy size={18} />
          {score}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div 
          className="bg-primary h-full transition-all duration-500 ease-out"
          style={{ width: `${totalToGuess > 0 ? (currentProgress / totalToGuess) * 100 : 0}%` }}
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
              placeholder="Type region name..."
              className={cn(
                "w-full px-6 py-4 bg-gray-50 border-2 outline-none rounded-2xl text-lg font-medium transition-all",
                lastGuessCorrect === false ? "border-red-400 bg-red-50 shake" : "border-transparent focus:border-primary focus:bg-white"
              )}
            />
            {lastGuessCorrect === false && (
              <p className="animate-in fade-in slide-in-from-top-1 absolute -bottom-6 left-2 text-xs font-semibold text-red-500">
                Try again!
              </p>
            )}
          </div>
          <button
            onClick={skipState}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700"
          >
            <SkipForward size={18} />
            Skip Region
          </button>
        </div>
      ) : null}

      {/* Gameplay Navigation (Quit) */}
      <div className="flex justify-center border-t border-gray-100 pt-4">
        <button
          onClick={handleQuit}
          className="flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-red-500"
        >
          <XCircle size={16} /> Quit Game
        </button>
      </div>
      
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
