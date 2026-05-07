'use client';

import { clsx, type ClassValue } from 'clsx';
import { Trophy, RefreshCw, Play, ArrowLeft } from 'lucide-react';
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
    missedStates, correctlyGuessedIds, totalToGuess 
  } = useGameStore();
  
  const[difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    return () => resetGame();
  }, [resetGame]);

  const handleStartGame = () => {
    if (mapData) {
      // Safely prefer regions/countries over other objects
      const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = (feature(mapData, mapData.objects[objectKey]) as any).features as StateFeature[];
      startGame(states, validNames, duration, difficulty, gameMode, capitalMap);
    }
  };

  if (mapStatus === 'pending') {
    return (
      <main className="fixed inset-0 z-0 flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#f1f5f3]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="font-medium text-gray-500">Loading Map Data...</p>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#f1f5f3]">
      
      {/* Layer 1: The Fullscreen Map */}
      <div className="absolute inset-0 z-0">
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

      {/* Layer 2: The Idle Overlay (Start Screen) */}
      {gameStatus === 'idle' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-2xl">
            <Link href="/games" className="absolute top-6 left-6 text-gray-400 transition-colors hover:text-primary">
              <ArrowLeft size={24} />
            </Link>
            <div className="bg-primary/10 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
              <Trophy size={40} />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-800">{title}</h1>
            <p className="mb-8 text-gray-600">{description}</p>
            
            <div className="mb-8 flex justify-center gap-2">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} className={cn("px-4 py-2 rounded-lg font-bold capitalize transition-all", difficulty === d ? "bg-primary text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100")}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={handleStartGame} className="bg-primary shadow-primary/25 flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105">
              <Play fill="currentColor" /> START GAME
            </button>
          </div>
        </div>
      )}

      {/* Layer 3: The Playing UI HUD */}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 w-full -translate-x-1/2 px-4 md:bottom-12 md:max-w-md">
          <div className="pointer-events-auto">
            <GameUI />
          </div>
        </div>
      )}

      {/* Layer 4: The Finished Overlay (End Screen) */}
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-2xl">
            <Trophy size={64} className="mx-auto mb-4 text-amber-500" />
            <h2 className="mb-2 text-3xl font-bold text-gray-800">{getFeedback(score, totalToGuess)}</h2>
            <p className="mb-6 text-gray-600">You guessed <span className="text-primary text-xl font-bold">{score}</span> / {totalToGuess} correctly.</p>
            {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).length > 0 && (
              <div className="mt-4 text-left">
                <h3 className="mb-2 font-semibold text-gray-700">Skipped {gameMode === 'capital' ? 'Capitals' : 'Regions'}:</h3>
                <div className="flex flex-wrap gap-2">
                  {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).map(state => (
                    <span key={state.id} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                      {gameMode === 'capital' ? capitalMap[state.properties.name] : state.properties.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleStartGame} className="bg-primary mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-lg transition-all hover:bg-[#008c98]">
              <RefreshCw size={20} /> PLAY AGAIN
            </button>
            <button onClick={resetGame} className="hover:text-primary mt-4 w-full py-2 text-sm font-bold text-gray-400 transition-colors">
              Change Difficulty
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
