'use client';

import { clsx, type ClassValue } from 'clsx';
import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { Trophy, RefreshCw, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';

import GameMap from '@/components/GameMap';
import GameUI from '@/components/GameUI';
import { AUSTRALIA_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useAustraliaMapData } from '@/hooks/useRegionMapData';
import { useGameStore, StateFeature, getFeedback } from '@/store/useGameStore';




function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AustraliaStatesGame() {
  const { data: mapData, status: mapStatus } = useAustraliaMapData();
  const { 
    status: gameStatus, startGame, resetGame, currentState, score, missedStates, correctlyGuessedIds, totalToGuess
  } = useGameStore();
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');

  const handleStartGame = () => {
    if (mapData) {
      const firstKey = Object.keys(mapData.objects)[0];
      const geo = feature(mapData, mapData.objects[firstKey]) as unknown as FeatureCollection;
      const states = geo.features as unknown as StateFeature[];
      startGame(states, AUSTRALIA_STATES, GAME_DURATIONS.AUSTRALIA_STATES, difficulty);
    }
  };

  useEffect(() => {
    return () => resetGame();
  }, [resetGame]);

  const projection = d3.geoMercator()
    .center([133, -27]) // Center of Australia
    .scale(600)
    .translate([960 / 2, 600 / 2]);

  if (mapStatus === 'pending') {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-4">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="font-medium text-gray-500">Loading Map Data...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="relative flex min-h-[600px] items-center justify-center overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:col-span-8">
          {gameStatus === 'idle' ? (
            <div className="max-w-md p-12 text-center">
              <Link href="/games" className="hover:text-primary absolute top-8 left-8 flex items-center gap-2 font-medium text-gray-400 transition-colors">
                <ArrowLeft size={20} /> Back to Games
              </Link>
              <div className="bg-primary/10 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
                <Trophy size={40} />
              </div>
              <h1 className="mb-4 text-3xl font-bold text-gray-800">Australia States Quiz</h1>
              <p className="mb-8 text-gray-600">
                Can you name all the states and territories of Australia? From Western Australia to Tasmania, give it a go!
              </p>
              
              <div className="mb-8 flex justify-center gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-bold capitalize transition-all",
                      difficulty === d ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleStartGame}
                className="bg-primary shadow-primary/25 flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <Play fill="currentColor" />
                START GAME
              </button>
            </div>
          ) : (
            <>
              {mapData && (
                <GameMap 
                  mapData={mapData} 
                  highlightedStateId={currentState?.id || null} 
                  projection={projection}
                  objectName={Object.keys(mapData.objects)[0]}
                  validNames={AUSTRALIA_STATES}
                />
              )}
              {gameStatus === 'finished' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm">
                  <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-2xl">
                    <Trophy size={64} className="mx-auto mb-4 text-amber-500" />
                    <h2 className="mb-2 text-3xl font-bold text-gray-800">{getFeedback(score, totalToGuess)}</h2>
                    <p className="mb-6 text-gray-600">You guessed <span className="text-primary text-xl font-bold">{score}</span> / {totalToGuess} regions correctly.</p>
                    {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).length > 0 && (
                      <div className="mt-4 text-left">
                        <h3 className="mb-2 font-semibold text-gray-700">Skipped States:</h3>
                        <div className="flex flex-wrap gap-2">
                          {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).map(state => (
                            <span key={state.id} className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                              {state.properties.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleStartGame}
                      className="bg-primary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white transition-all hover:bg-[#008c98]"
                    >
                      <RefreshCw size={20} />
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={resetGame}
                      className="hover:text-primary mt-4 w-full py-2 text-sm font-semibold text-gray-500 transition-colors"
                    >
                      Change Difficulty
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="lg:sticky lg:top-8 lg:col-span-4">
          <GameUI />
        </div>
      </div>
    </main>
  );
}
