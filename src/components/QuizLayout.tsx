'use client';

import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import DifficultyTicket from '@/components/DifficultyTicket';
import { GameHUD } from '@/components/GameHUD';
import GameMap from '@/components/GameMap';
import { RegionCounter } from '@/components/RegionCounter';
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
  showOnlyValid?: boolean;
  capitalCoordinates?: Record<string,[number, number]>;
}

export default function QuizLayout({
  title, description, mapData, mapStatus, projection, validNames, duration, gameMode = 'name', capitalMap = {},
  showOnlyValid = false, capitalCoordinates = {}
}: QuizLayoutProps) {
  const t = useTranslations('Quiz');
  const tRegions = useTranslations('RegionNames');
  
  const { 
    status: gameStatus, startGame, resetGame, currentState, score, 
    totalToGuess, timeLeft, tick, isNewHighScore,
    userInput, setUserInput, submitGuess, skipState, lastGuessCorrect
  } = useGameStore();

  const getLocalizedName = (name: string) => {
    try {
      return tRegions(name);
    } catch {
      return name;
    }
  };

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
      startGame(states, validNames, duration, difficulty, 'QUIZ_KEY', gameMode, capitalMap);
    }
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
      
      {/* LAYER 1: THE FULLSCREEN MAP */}
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

      {/* LAYER 3: HUD - BOTTOM CENTER UI W/ ACTIONS*/}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
            
            {/* Target Hint Display */}
            {gameMode === 'capital' && currentState && (
              <div className="pointer-events-auto animate-in slide-in-from-bottom-2 rounded-xl bg-[var(--foreground)] px-6 py-2 text-sm font-bold text-[var(--background)] shadow-xl">
                {t('target', { name: getLocalizedName(currentState.properties.name) })}
              </div>
            )}

            <div className={cn(
              "pointer-events-auto w-full bg-[var(--card-bg)] rounded-full p-2 flex items-center shadow-2xl border transition-colors",
              lastGuessCorrect === false ? "border-red-400 bg-red-50 shake" : "border-[var(--card-border)]"
            )}>
               <input 
                 autoFocus
                 value={userInput}
                 onChange={(e) => setUserInput(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') submitGuess(userInput);
                 }}
                 className={cn(
                   "flex-grow bg-transparent px-6 py-3 outline-none font-game-mono text-[var(--foreground)] placeholder:text-slate-400",
                   lastGuessCorrect === false ? "text-red-500 placeholder:text-red-300" : ""
                 )} 
                 placeholder={gameMode === 'capital' ? t('typeCapital') : t('typeRegion')} 
               />
               <button 
                 onClick={() => submitGuess(userInput)}
                 className="bg-primary text-white px-8 py-3 rounded-full font-game-heading uppercase tracking-wider shadow-lg hover:bg-teal-600 transition-colors"
               >
                 Guess
               </button>
            </div>
            
            {lastGuessCorrect === false && (
              <span className="text-xs font-bold text-red-500 uppercase -mt-2 animate-pulse">{t('tryAgain')}</span>
            )}

            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={resetGame}
                className="bg-red-500 text-white px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-red-600 transition-colors"
              >
                Quit
              </button>
              <button 
                onClick={skipState}
                className="bg-[var(--card-bg)] text-slate-500 px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Skip
              </button>
            </div>
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
      )}

      {/* OVERLAYS (Start and Finish Screens) */}
      {(gameStatus === 'idle' || gameStatus === 'finished') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 p-4 backdrop-blur-sm">
           {gameStatus === 'idle' ? (
              <div className="w-full max-w-md rounded-3xl bg-[var(--card-bg)] p-10 text-center shadow-2xl border-2 border-dashed border-[var(--card-border)] relative">
                 <Link href="/games" className="absolute top-6 left-6 text-slate-400 transition-colors hover:text-primary">
                  <ArrowLeft size={24} />
                 </Link>
                 <div className="bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
                   <Trophy size={40} />
                 </div>
                 <h1 className="mb-4 text-4xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{title}</h1>
                 <p className="mb-8 font-game-mono text-slate-500">{description}</p>
                 
                 <div className="mb-8 flex flex-col items-center gap-6">
                    <div className="flex gap-4">
                      <DifficultyTicket 
                        title="Easy" 
                        description="10 min • 5 hints" 
                        isSelected={difficulty === 'easy'} 
                        onClick={() => setDifficulty('easy')} 
                      />
                      <DifficultyTicket 
                        title="Medium" 
                        description="5 min • 2 hints" 
                        isSelected={difficulty === 'medium'} 
                        onClick={() => setDifficulty('medium')} 
                      />
                      <DifficultyTicket 
                        title="Hard" 
                        description="2 min • 0 hints" 
                        isSelected={difficulty === 'hard'} 
                        onClick={() => setDifficulty('hard')} 
                      />
                    </div>
                 </div>
                 
                 <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl font-game-heading uppercase tracking-widest text-white text-lg hover:scale-105 transition-all shadow-lg">{t('start')}</button>
              </div>
           ) : (
              <div className="w-full max-w-lg rounded-3xl bg-[var(--card-bg)] p-10 text-center shadow-2xl border-2 border-dashed border-[var(--card-border)]">
                 <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
                 {isNewHighScore && (
                    <div className="mb-4 animate-bounce rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-slate-900 shadow-lg uppercase tracking-wider inline-block">
                      New High Score!
                    </div>
                  )}
                 <h2 className="mb-6 text-4xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{t(`feedback.${getFeedback(score, totalToGuess)}`)}</h2>
                 <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl text-white uppercase tracking-widest font-game-heading text-xl mb-4">{t('playAgain')}</button>
                 <button onClick={resetGame} className="text-slate-500 font-game-heading uppercase tracking-widest">{t('menu')}</button>
              </div>
           )}
        </div>
      )}
    </main>
  );
}
