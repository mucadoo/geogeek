'use client';

import React, { useEffect } from 'react';
import { useBrazilMapData } from '@/hooks/useRegionMapData';
import { useGameStore, StateFeature } from '@/store/useGameStore';
import GameMap from '@/components/GameMap';
import GameUI from '@/components/GameUI';
import { feature } from 'topojson-client';
import { Trophy, RefreshCw, Play } from 'lucide-react';
import * as d3 from 'd3';
import { BRAZIL_STATES, GAME_DURATIONS }  from '@/config/gameConstants';

export default function BrazilStatesGame() {
  const { data: mapData, status: mapStatus } = useBrazilMapData();
  const { 
    status: gameStatus, startGame, resetGame, currentState, score, missedStates, correctlyGuessedIds 
  } = useGameStore();
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');

  const handleStartGame = () => {
    if (mapData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = (feature(mapData, mapData.objects.uf) as any).features as StateFeature[];
      startGame(states, BRAZIL_STATES, GAME_DURATIONS.BRAZIL_STATES, difficulty);
    }
  };

  useEffect(() => {
    return () => resetGame();
  },[resetGame]);

  // Center on Brazil [lng -55, lat -15]
  const projection = d3.geoMercator()
    .center([-55, -15])
    .scale(700)
    .translate([960 / 2, 600 / 2]);

  if (mapStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-gray-500 font-medium">Loading Map Data...</p>
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex items-center justify-center relative">
          {gameStatus === 'idle' ? (
            <div className="text-center p-12 max-w-md">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Brazil States Quiz</h1>
              <p className="text-gray-600 mb-8">
                How well do you know Brazil? A state will be highlighted, and you have 5 minutes to guess as many as you can!
              </p>

              <div className="flex gap-2 mb-8 justify-center">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${
                      difficulty === d ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <button
                onClick={handleStartGame}
                className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-primary/25"
              >
                <Play fill="currentColor" />
                START GAME
              </button>
            </div>
          ) : (
            <>
              <GameMap 
                mapData={mapData} 
                highlightedStateId={currentState?.id || null} 
                projection={projection}
                objectName="uf"
                validNames={BRAZIL_STATES}
              />
              {gameStatus === 'finished' && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 p-4">
                  <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-y-auto max-h-full">
                    <Trophy size={64} className="text-amber-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Well Done!</h2>
                    <p className="text-gray-600 mb-6">You guessed <span className="font-bold text-primary text-xl">{score}</span> states correctly.</p>
                    {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).length > 0 && (
                      <div className="mt-4 text-left">
                        <h3 className="font-semibold text-gray-700 mb-2">Skipped States:</h3>
                        <div className="flex flex-wrap gap-2">
                          {missedStates.filter(ms => !correctlyGuessedIds.includes(ms.id)).map(state => (
                            <span key={state.id} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                              {state.properties.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleStartGame}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-[#008c98] transition-all mt-6"
                    >
                      <RefreshCw size={20} />
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={resetGame}
                      className="w-full mt-4 py-2 text-gray-500 hover:text-primary transition-colors font-semibold text-sm"
                    >
                      Change Difficulty
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-8">
          <GameUI />
        </div>
      </div>
    </main>
  );
}
