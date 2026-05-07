'use client';

import { clsx, type ClassValue } from 'clsx';
import { Trophy, Timer, Play, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import GameMap from '@/components/GameMap';
import GameUI from '@/components/GameUI';
import { useGameStore, StateFeature, getFeedback, GameMode } from '@/store/useGameStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuizLayoutProps {
  title: string;
  description: string;
  mapData: Topology | undefined;
  mapStatus: 'pending' | 'success' | 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projection: any; 
  validNames: string[];
  duration: number;
  gameMode?: GameMode;
  capitalMap?: Record<string, string>;
  
  // NEW PROPS
  showOnlyValid?: boolean;
  capitalCoordinates?: Record<string, [number, number]>;
}

export default function QuizLayout({
  title, description, mapData, mapStatus, projection, validNames, duration, gameMode = 'name', capitalMap = {},
  showOnlyValid = false, capitalCoordinates = {}
}: QuizLayoutProps) {
  const { 
    status: gameStatus, startGame, resetGame, currentState, score, 
    totalToGuess, timeLeft, tick
  } = useGameStore();
  
  // Handle Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [gameStatus, tick]);

  useEffect(() => { return () => resetGame(); }, [resetGame]);

  const handleStartGame = () => {
    if (mapData) {
      const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = (feature(mapData, mapData.objects[objectKey]) as any).features as StateFeature[];
      startGame(states, validNames, duration, 'medium', gameMode, capitalMap);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (mapStatus === 'pending') {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#f1f5f3]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#f8faf9]">
      
      {/* LAYER 1: THE FULLSCREEN MAP (No padding, maximum scale) */}
      <div className="absolute inset-0 z-0 h-full w-full">
        {mapData && (
          <GameMap 
            mapData={mapData} 
            highlightedStateId={currentState?.id || null} 
            projection={projection} 
            validNames={validNames}
            gameMode={gameMode}
            capitalMap={capitalMap}
            capitalCoordinates={capitalCoordinates}
            showOnlyValid={showOnlyValid}
          />
        )}
      </div>

      {/* LAYER 2: HUD - TOP BAR (Stats & Progress) */}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute top-24 left-0 right-0 z-10 px-6 md:top-6 md:px-10">
          <div className="mx-auto flex max-w-[1400px] items-start justify-between">
            
            {/* Top Left: Game Info & Progress */}
            <div className="pointer-events-auto flex flex-col gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-xl backdrop-blur-md">
                <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">{title}</h2>
                <div className="mt-2 flex items-center gap-4">
                   <div className="flex items-center gap-2 font-black text-[#2c3e50]">
                      <span className="text-2xl">{score}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-lg text-gray-400">{totalToGuess}</span>
                   </div>
                   <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${totalToGuess > 0 ? (score/totalToGuess)*100 : 0}%` }} />
                   </div>
                </div>
              </div>
            </div>

            {/* Top Right: Timer */}
            <div className="pointer-events-auto">
               <div className={cn(
                 "flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-xl backdrop-blur-md transition-colors",
                 timeLeft < 30 ? "bg-red-50 border-red-100 text-red-500" : "bg-white/80 border-gray-100 text-primary"
               )}>
                  <Timer size={24} className={timeLeft < 30 ? "animate-pulse" : ""} />
                  <span className="text-3xl font-black tabular-nums">{formatTime(timeLeft)}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYER 3: HUD - BOTTOM CENTER (The Input Area) */}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
            
            {/* The Actual Input Component */}
            <div className="pointer-events-auto w-full">
               <GameUI />
            </div>

          </div>
        </div>
      )}

      {/* OVERLAYS (Start and Finish Screens) */}
      {(gameStatus === 'idle' || gameStatus === 'finished') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2c3e50]/20 p-4 backdrop-blur-sm">
           {gameStatus === 'idle' ? (
              <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
                 <h1 className="text-3xl font-bold mb-4">{title}</h1>
                 <p className="text-gray-500 mb-8">{description}</p>
                 <button onClick={handleStartGame} className="bg-primary w-full py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 transition-all">START GAME</button>
              </div>
           ) : (
              <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">
                 <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
                 <h2 className="text-3xl font-bold mb-6">{getFeedback(score, totalToGuess)}</h2>
                 <button onClick={handleStartGame} className="bg-primary w-full py-4 rounded-2xl text-white font-bold mb-4">PLAY AGAIN</button>
                 <button onClick={resetGame} className="text-gray-400 font-bold">Menu</button>
              </div>
           )}
        </div>
      )}
    </main>
  );
}
