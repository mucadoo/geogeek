'use client';

import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { Trophy, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { getAllCountriesAction } from '@/app/actions';
import DifficultyTicket from '@/components/DifficultyTicket';
import { GameHUD } from '@/components/GameHUD';
import GameMap from '@/components/GameMap';
import { Link } from '@/i18n/routing';
import { useGameStore, StateFeature, getFeedback, GameMode, GameType } from '@/store/useGameStore';
import { Country } from '@/types';

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
  capitalCoordinates?: Record<string, [number, number]>;
}

export default function QuizLayout({
  title, description, mapData, mapStatus, projection, validNames, duration, gameMode = 'name', capitalMap = {},
  showOnlyValid = false, capitalCoordinates = {}
}: QuizLayoutProps) {
  const t = useTranslations('Quiz');
  const tRegions = useTranslations('RegionNames');
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    status: gameStatus, startGame, resetGame, currentState, score, 
    totalToGuess, timeLeft, tick, isNewHighScore,
    userInput, setUserInput, submitGuess, skipState, lastGuessCorrect,
    correctlyGuessedIds, missedStates, gameType, isMultipleChoice, options
  } = useGameStore();

  const [allCountries, setAllCountries] = useState<Country[]>([]);

  useEffect(() => {
    async function loadCountries() {
      const countries = await getAllCountriesAction();
      setAllCountries(countries);
    }
    loadCountries();
  }, []);

  const getLocalizedName = (name: string) => {
    try {
      return tRegions(name);
    } catch {
      return name;
    }
  };

  const getFlagUrl = (name: string) => {
    const country = allCountries.find(c => 
      c.name.en === name || 
      Object.values(c.name).some(v => v === name)
    );
    return country?.flagUrl;
  };

  // High score effects
  useEffect(() => {
    if (gameStatus === 'finished' && score > 0 && score === totalToGuess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameStatus, score, totalToGuess]);

  // Handle auto-focus and auto-selection on incorrect guess for perfect UX
  useEffect(() => {
    if (gameStatus === 'playing' && inputRef.current && !isMultipleChoice) {
      inputRef.current.focus();
    }
  }, [currentState, gameStatus, isMultipleChoice]);

  useEffect(() => {
    if (lastGuessCorrect === false && inputRef.current && !isMultipleChoice) {
      inputRef.current.select(); // Highlight wrong answer so players can immediately overwrite it
    }
  }, [lastGuessCorrect, isMultipleChoice]);

  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedGameType, setSelectedGameType] = React.useState<GameType>('standard');
  const [selectedMultipleChoice, setSelectedMultipleChoice] = React.useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [gameStatus, tick]);

  useEffect(() => { return () => resetGame(); }, [resetGame]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        resetGame();
      }
      if (e.key === 'Tab' || (e.key === ' ' && e.ctrlKey)) {
        e.preventDefault();
        skipState();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [gameStatus, skipState, resetGame]);

  const handleStartGame = () => {
    if (mapData) {
      const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = (feature(mapData, mapData.objects[objectKey]) as any).features as StateFeature[];
      startGame(states, validNames, duration, difficulty, 'QUIZ_KEY', gameMode, capitalMap, selectedGameType, selectedMultipleChoice);
    }
  };

  const handleRegionClick = (id: string, name: string) => {
    if (gameStatus === 'playing') {
      submitGuess(name);
    }
  };

  // Helper to extract the list of recently guessed region names to display
  const recentGuesses = useMemo(() => {
    if (!mapData || !correctlyGuessedIds.length) return [];
    const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
    const geo = feature(mapData, mapData.objects[objectKey]) as any;

    return correctlyGuessedIds.slice(-4).reverse().map((id) => {
      const feat = geo.features.find((f: any) => String(f.id) === id);
      return feat ? feat.properties.name : 'Unknown';
    });
  }, [mapData, correctlyGuessedIds]);

  if (mapStatus === 'pending') {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#f1f5f3]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[var(--background)]">

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
            onRegionClick={handleRegionClick}
          />
        )}
      </div>

      {/* LAYER 2: INTERACTIVE SIDE HUD STATS */}
      {gameStatus === 'playing' && (
        <>
          <GameHUD score={score} total={totalToGuess} timeLeft={timeLeft} />

          {/* Left Side: Guesses Feed */}
          <div className="absolute top-24 left-10 hidden xl:flex flex-col gap-4 w-60 bg-[var(--card-bg)]/85 backdrop-blur-md p-5 rounded-2xl border border-[var(--card-border)] shadow-lg animate-in fade-in slide-in-from-left-4 duration-500">
            <h3 className="font-game-heading text-lg tracking-wider text-primary border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
              <CheckCircle2 size={16} /> GUESSED ({score})
            </h3>
            <div className="flex flex-col gap-2.5">
              {recentGuesses.length === 0 ? (
                <span className="text-xs font-game-mono text-slate-400 italic">None yet</span>
              ) : (
                recentGuesses.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-game-mono text-slate-600 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">✓</span> {getLocalizedName(name)}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side: Misses / Skips Feed */}
          <div className="absolute top-24 right-10 hidden xl:flex flex-col gap-4 w-60 bg-[var(--card-bg)]/85 backdrop-blur-md p-5 rounded-2xl border border-[var(--card-border)] shadow-lg animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="font-game-heading text-lg tracking-wider text-red-500 border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
              <AlertCircle size={16} /> SKIPPED ({missedStates.length})
            </h3>
            <div className="flex flex-col gap-2.5">
              {missedStates.length === 0 ? (
                <span className="text-xs font-game-mono text-slate-400 italic">None yet</span>
              ) : (
                missedStates.slice(-4).reverse().map((state) => (
                  <div key={state.id} className="flex items-center gap-2 text-xs font-game-mono text-slate-600 dark:text-slate-300">
                    <span className="text-amber-500 font-bold">➔</span> {getLocalizedName(state.properties.name)}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* LAYER 3: HUD - BOTTOM CENTER UI W/ ACTIONS */}
      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">

            {/* Target Hint Display */}
            {(gameMode === 'capital' || gameMode === 'flag') && currentState && (
              <div className="pointer-events-auto animate-in slide-in-from-bottom-2 rounded-xl bg-[var(--foreground)] px-6 py-4 flex flex-col items-center gap-4 text-sm font-bold text-[var(--background)] shadow-xl">
                {gameMode === 'flag' ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-widest opacity-60">Locate this flag:</span>
                    {getFlagUrl(currentState.properties.name) ? (
                      <Image 
                        src={getFlagUrl(currentState.properties.name)!} 
                        alt="Target flag" 
                        width={160}
                        height={80}
                        className="h-20 w-auto rounded border border-white/20 shadow-md object-contain" 
                      />
                    ) : (
                      <div className="h-20 w-32 bg-white/10 rounded flex items-center justify-center italic text-xs">Flag missing</div>
                    )}
                  </div>
                ) : (
                  t('target', { name: getLocalizedName(currentState.properties.name) })
                )}
              </div>
            )}

            {isMultipleChoice ? (
              <div className="pointer-events-auto grid grid-cols-2 gap-3 w-full max-w-md">
                {options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => submitGuess(option)}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-primary hover:bg-primary/5 py-4 px-6 rounded-2xl font-game-mono text-sm shadow-lg transition-all active:scale-95"
                  >
                    {getLocalizedName(option)}
                  </button>
                ))}
              </div>
            ) : (
              <div className={cn(
                "pointer-events-auto w-full bg-[var(--card-bg)] rounded-full p-2 flex items-center shadow-2xl border transition-all",
                lastGuessCorrect === false ? "border-red-400 bg-red-50/90 dark:bg-red-950/20 shake" : "border-[var(--card-border)]"
              )}>
                 <input 
                   ref={inputRef}
                   autoFocus
                   value={userInput}
                   onChange={(e) => setUserInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') submitGuess(userInput);
                   }}
                   className={cn(
                     "flex-grow bg-transparent px-6 py-3 outline-none font-game-mono text-[var(--foreground)] placeholder:text-slate-400",
                     lastGuessCorrect === false ? "text-red-600 placeholder:text-red-300" : ""
                   )} 
                   placeholder={gameMode === 'capital' ? t('typeCapital') : (gameMode === 'flag' ? "Click on map or type name..." : t('typeRegion'))} 
                 />
                 <button 
                   onClick={() => submitGuess(userInput)}
                   className="bg-primary text-white px-8 py-3 rounded-full font-game-heading uppercase tracking-wider shadow-lg hover:bg-teal-600 transition-colors"
                 >
                   Guess
                 </button>
              </div>
            )}
            {lastGuessCorrect === false && !isMultipleChoice && (
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
              <div className="w-full max-w-2xl rounded-3xl bg-[var(--card-bg)] p-10 text-center shadow-2xl border-2 border-dashed border-[var(--card-border)] relative">
                 <Link href="/games" className="absolute top-6 left-6 text-slate-400 transition-colors hover:text-primary">
                  <ArrowLeft size={24} />
                 </Link>
                 <div className="bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
                   <Trophy size={40} />
                 </div>
                 <h1 className="mb-4 text-4xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{title}</h1>
                 <p className="mb-8 font-game-mono text-slate-500">{description}</p>

                 <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                      <h3 className="font-bebas text-xl tracking-widest text-slate-400 text-left">Difficulty</h3>
                      <div className="flex gap-4">
                        <DifficultyTicket 
                          title="Easy" 
                          description="10 min" 
                          isSelected={difficulty === 'easy'} 
                          onClick={() => setDifficulty('easy')} 
                        />
                        <DifficultyTicket 
                          title="Med" 
                          description="5 min" 
                          isSelected={difficulty === 'medium'} 
                          onClick={() => setDifficulty('medium')} 
                        />
                        <DifficultyTicket 
                          title="Hard" 
                          description="2 min" 
                          isSelected={difficulty === 'hard'} 
                          onClick={() => setDifficulty('hard')} 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h3 className="font-bebas text-xl tracking-widest text-slate-400 text-left">Game Mode</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setSelectedGameType(selectedGameType === 'survival' ? 'standard' : 'survival')}
                          className={cn(
                            "py-3 px-4 rounded-xl border-2 border-dashed font-bebas text-lg tracking-widest transition-all",
                            selectedGameType === 'survival' ? "border-amber-500 bg-amber-50 text-amber-600" : "border-[var(--card-border)] text-slate-400"
                          )}
                        >
                          Survival
                        </button>
                        <button 
                          onClick={() => setSelectedMultipleChoice(!selectedMultipleChoice)}
                          className={cn(
                            "py-3 px-4 rounded-xl border-2 border-dashed font-bebas text-lg tracking-widest transition-all",
                            selectedMultipleChoice ? "border-primary bg-primary/5 text-primary" : "border-[var(--card-border)] text-slate-400"
                          )}
                        >
                          Choices
                        </button>
                      </div>
                      <p className="text-[10px] font-game-mono text-slate-400 text-left">
                        {selectedGameType === 'survival' ? "• Survival: Start with 15s. +3s correct, -5s skip." : "• Standard: Classic countdown timer."}
                        <br />
                        {selectedMultipleChoice ? "• Choices: Select from 4 options." : "• Type: Manual text entry."}
                      </p>
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
                 <div className="mb-8 font-game-mono text-slate-500">
                    <p>Score: {score} / {totalToGuess}</p>
                    {gameType === 'survival' && <p>Survival Time Bonus: +{score * 3}s</p>}
                 </div>
                 <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl text-white uppercase tracking-widest font-game-heading text-xl mb-4">{t('playAgain')}</button>
                 <button onClick={resetGame} className="text-slate-500 font-game-heading uppercase tracking-widest">{t('menu')}</button>
              </div>
           )}
        </div>
      )}
    </main>
  );
}
