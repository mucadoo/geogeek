'use client';

import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { Trophy, Timer, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import DifficultyTicket from '@/components/DifficultyTicket';
import GameMap from '@/components/GameMap';
import { GameHUD } from '@/components/GameHUD';
import { RegionCounter } from '@/components/RegionCounter';
import GameUI from '@/components/GameUI';
import { Link } from '@/i18n/routing';
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
  const t = useTranslations('Quiz');
  const { 
    status: gameStatus, startGame, resetGame, currentState, score, 
    totalToGuess, timeLeft, tick, isNewHighScore
  } = useGameStore();

  useEffect(() => {
    if (gameStatus === 'finished' && score > 0 && score === totalToGuess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameStatus, score, totalToGuess]);

  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');

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
      startGame(states, validNames, duration, difficulty, 'QUIZ_KEY', gameMode, capitalMap); // Added QUIZ_KEY
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

      {/* LAYER 2: HUD - TOP & SIDES */}
      {gameStatus === 'playing' && (
        <>
          <GameHUD score={score} total={totalToGuess} timeLeft={timeLeft} />
          
          <div className="absolute top-24 left-10 hidden xl:flex flex-col gap-6">
            <RegionCounter label="North" count={0} total={10} />
            <RegionCounter label="South" count={0} total={10} />
          </div>
          <div className="absolute top-24 right-10 hidden xl:flex flex-col gap-6">
            <RegionCounter label="East" count={0} total={10} />
            <RegionCounter label="West" count={0} total={10} />
          </div>
        </>
      )}

      {/* LAYER 3: HUD - BOTTOM CENTER (Redesigned Input) */}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
            <div className="pointer-events-auto w-full bg-[var(--card-bg)] rounded-full p-2 flex items-center shadow-2xl border border-[var(--card-border)]">
               <input className="flex-grow bg-transparent px-6 py-3 outline-none font-game-mono text-[var(--foreground)] placeholder:text-slate-400" placeholder="Type name..." />
               <button className="bg-primary text-white px-8 py-3 rounded-full font-game-heading uppercase tracking-wider shadow-lg hover:bg-teal-600 transition-colors">Guess</button>
            </div>
            <div className="flex gap-2">
              <button className="bg-accent text-slate-900 px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-yellow-400 transition-colors">Get Hint</button>
              <button className="bg-[var(--card-bg)] text-slate-500 px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAYS (Start and Finish Screens) */}
      {(gameStatus === 'idle' || gameStatus === 'finished') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#2c3e50]/20 p-4 backdrop-blur-sm">
           {gameStatus === 'idle' ? (
              <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
                 <Link href="/games" className="absolute top-6 left-6 text-gray-400 transition-colors hover:text-primary">
                  <ArrowLeft size={24} />
                 </Link>
                 <div className="bg-primary/10 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
                   <Trophy size={40} />
                 </div>
                 <h1 className="mb-4 text-3xl font-bold text-gray-800">{title}</h1>
                 <p className="mb-8 text-gray-600">{description}</p>
                 
                 <div className="mb-8 flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                      <DifficultyTicket 
                        title="Easy" 
                        description="10 minutes • 5 hints" 
                        isSelected={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')} 
                      />
                      <DifficultyTicket 
                        title="Medium" 
                        description="5 minutes • 2 hints" 
                        isSelected={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')} 
                      />
                      <DifficultyTicket 
                        title="Hard" 
                        description="2 minutes • 0 hints" 
                        isSelected={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')} 
                      />
                    </div>
                 </div>
                 
                 <button onClick={handleStartGame} className="bg-primary w-full py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 transition-all shadow-lg">{t('start')}</button>
              </div>
           ) : (
              <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">
                 <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
                 {isNewHighScore && (
                    <div className="mb-4 animate-bounce rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-white shadow-lg uppercase tracking-wider inline-block">
                      New High Score!
                    </div>
                  )}
                 <h2 className="text-3xl font-bold mb-6">{t(`feedback.${getFeedback(score, totalToGuess)}`)}</h2>
                 <button onClick={handleStartGame} className="bg-primary w-full py-4 rounded-2xl text-white font-bold mb-4">{t('playAgain')}</button>
                 <button onClick={resetGame} className="text-gray-400 font-bold">{t('menu')}</button>
              </div>
           )}
        </div>
      )}
    </main>
  );
}
