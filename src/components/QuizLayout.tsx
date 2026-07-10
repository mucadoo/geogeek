'use client';

import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { Trophy, ArrowLeft, CheckCircle2, AlertCircle, Maximize2, Minimize2, Sparkles, Settings2, Timer, EyeOff, Hash, Map as MapIcon } from 'lucide-react';
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
import { POINTS_MULTIPLIERS, PRESETS, AdvancedSettings, Difficulty } from '@/config/gameConstants';
import { Link } from '@/i18n/routing';
import { useGameStore, StateFeature, GameMode, GameType } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { Country } from '@/types';
import getFeedback from '@/lib/getFeedback';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuizLayoutProps {
  gameKey: string;
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
  gameKey, title, description, mapData, mapStatus, projection, validNames, gameMode = 'name', capitalMap = {},
  showOnlyValid = false, capitalCoordinates = {}
}: QuizLayoutProps) {
  const t = useTranslations('Quiz');
  const tRegions = useTranslations('RegionNames');
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    status: gameStatus, startGame, resetGame, currentState, score, 
    totalToGuess, timeLeft, tick, isNewHighScore,
    userInput, setUserInput, submitGuess, skipState, lastGuessCorrect,
    correctlyGuessedIds, missedStates, options,
    autoZoom, setAutoZoom,
    pauseGame, resumeGame, quitGame, savedGames, currentGameKey
  } = useGameStore();
  
  const savedGame = savedGames[gameKey];
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [adv, setAdv] = useState<AdvancedSettings>(PRESETS['medium']);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    if (newDifficulty !== 'custom') {
      setAdv(PRESETS[newDifficulty]);
    }
  };

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [isScoreRegistered, setIsScoreRegistered] = useState(false);

  const { currentUser, updateUserScore, registerGuestScore } = useUserStore();

  const handleRegisterScore = () => {
    const finalPoints = useGameStore.getState().masteryPoints;
    if (currentUser) {
      updateUserScore(currentUser.id, finalPoints);
      setIsScoreRegistered(true);
    } else if (guestName.trim()) {
      registerGuestScore(guestName.trim(), finalPoints);
      setIsScoreRegistered(true);
    }
  };

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

  useEffect(() => {
    if (gameStatus === 'playing' && currentGameKey !== gameKey) {
      pauseGame();
    }
  }, [gameStatus, currentGameKey, gameKey, pauseGame]);

  useEffect(() => {
    return () => {
      if (useGameStore.getState().status === 'playing') {
        useGameStore.getState().pauseGame();
      }
    };
  }, []);

  useEffect(() => {
    if (gameStatus === 'finished' && score > 0 && score === totalToGuess) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [gameStatus, score, totalToGuess]);

  useEffect(() => {
    if (gameStatus === 'playing' && inputRef.current && !adv.isMultipleChoice) {
      inputRef.current.focus();
    }
  }, [currentState, gameStatus, adv.isMultipleChoice]);

  useEffect(() => {
    if (lastGuessCorrect === false && inputRef.current && !adv.isMultipleChoice) {
      inputRef.current.select(); 
    }
  }, [lastGuessCorrect, adv.isMultipleChoice]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [gameStatus, tick]);

  const handleStartGame = () => {
    if (mapData) {
      const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const states = (feature(mapData, mapData.objects[objectKey]) as any).features as StateFeature[];
      
      if (savedGame) quitGame(); 
      
      startGame(states, validNames, difficulty, adv, gameKey, gameMode, capitalMap);
    }
  };

  const handleRegionClick = (id: string, name: string) => {
    if (gameStatus !== 'playing') return;

    if (gameMode === 'reverse' || gameMode === 'flag') {
        const success = submitGuess(name);
        if (!success) {
            skipState();
        }
    } else {
        submitGuess(name);
    }
  };

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
      <main className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[var(--background)]">

      <div className="absolute inset-0 z-0 h-full w-full">
        {mapData && (
          <GameMap 
            mapData={mapData} 
            highlightedStateId={currentState?.id || null} 
            projection={projection} 
            validNames={validNames}
            gameMode={gameMode as any}
            capitalMap={capitalMap}
            capitalCoordinates={capitalCoordinates}
            showOnlyValid={showOnlyValid}
            onRegionClick={handleRegionClick}
            hideBorders={adv.hideBorders}
            noMapHints={adv.noMapHints}
          />
        )}
      </div>

      {gameStatus === 'playing' && (
        <>
          <GameHUD score={score} total={totalToGuess} timeLeft={timeLeft} />

          <div className="absolute top-6 right-10 z-20 flex gap-2 pointer-events-auto">
            <button 
              onClick={() => setAutoZoom(!autoZoom)}
              className={cn(
                "p-3 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
                autoZoom ? "bg-primary/20 border-primary text-primary" : "bg-[var(--card-bg)]/85 border-[var(--card-border)] text-slate-400"
              )}
              title={autoZoom ? "Disable Auto-Zoom" : "Enable Auto-Zoom"}
            >
              {autoZoom ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>
          </div>

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

      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">

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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  t('target', { name: getLocalizedName(currentState.properties.name) } as any)
                )}
              </div>
            )}

            {options.length > 0 ? (
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
            {lastGuessCorrect === false && options.length === 0 && (
              <span className="text-xs font-bold text-red-500 uppercase -mt-2 animate-pulse">{t('tryAgain')}</span>
            )}

            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={quitGame}
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

      {(gameStatus === 'idle' || gameStatus === 'finished') && (
        <div className="fixed inset-0 z-[150] overflow-y-auto bg-[var(--background)]/80 backdrop-blur-sm p-4">
           <div className="flex min-h-full items-center justify-center">
             {gameStatus === 'idle' ? (
                <div className="w-full max-w-2xl rounded-3xl bg-[var(--card-bg)] p-8 md:p-10 text-center shadow-2xl border-2 border-dashed border-[var(--card-border)] relative">
                   <Link href="/games" className="absolute top-6 left-6 text-slate-400 transition-colors hover:text-primary">
                    <ArrowLeft size={24} />
                   </Link>
                   <div className="bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                     <Trophy size={32} />
                   </div>
                   <h1 className="mb-2 text-3xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{title}</h1>
                   <p className="mb-6 font-game-mono text-sm text-slate-500">{description}</p>
                   
                   <div className="text-left space-y-8">
                     <section>
                       <h3 className="text-xs font-game-heading text-slate-500 uppercase tracking-widest mb-4">Select Difficulty</h3>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {(Object.keys(PRESETS) as Difficulty[]).map((d) => (
                            <DifficultyTicket key={d} title={d} description={d} isSelected={difficulty === d} onClick={() => handleDifficultyChange(d)} />
                          ))}
                          <DifficultyTicket title="custom" description="custom" isSelected={difficulty === 'custom'} onClick={() => setDifficulty('custom')} />
                       </div>
                     </section>

                     {difficulty === 'custom' && (
                      <section className="border border-[var(--card-border)] rounded-2xl p-6 bg-[var(--background)]">
                        <h3 className="font-game-heading text-primary uppercase tracking-widest text-sm mb-4">Advanced Configuration</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm font-game-mono text-[var(--foreground)]">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-primary" checked={adv.isMultipleChoice} onChange={(e) => setAdv({...adv, isMultipleChoice: e.target.checked})} />
                            Multiple Choice
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-primary" checked={adv.strictMatching} onChange={(e) => setAdv({...adv, strictMatching: e.target.checked})} />
                            Strict Matching
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-primary" checked={adv.noMapHints} onChange={(e) => setAdv({...adv, noMapHints: e.target.checked})} />
                            No Map Hints
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="accent-primary" checked={adv.hideBorders} onChange={(e) => setAdv({...adv, hideBorders: e.target.checked})} />
                            Hide Borders
                          </label>
                          <div className="col-span-2">
                            <label className="block mb-1 text-xs text-slate-500">Time Per Guess (s)</label>
                            <input type="number" value={adv.timePerGuess} onChange={(e) => setAdv({...adv, timePerGuess: parseInt(e.target.value)})} className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 outline-none focus:border-primary" />
                          </div>
                        </div>
                      </section>
                     )}
                   </div>

                   {savedGame ? (
                    <div className="flex gap-3 mt-8 flex-col sm:flex-row">
                      <button onClick={() => resumeGame(gameKey)} className="bg-[var(--primary)] flex-1 py-4 rounded-2xl font-game-heading uppercase tracking-widest text-white text-lg hover:scale-105 transition-all shadow-lg">
                        {t('resume') || "RESUME GAME"}
                      </button>
                      <button onClick={handleStartGame} className="bg-[var(--card-bg)] text-slate-500 border-2 border-dashed border-[var(--card-border)] flex-1 py-4 rounded-2xl font-game-heading uppercase tracking-widest text-lg hover:scale-105 hover:border-red-500 hover:text-red-500 transition-all shadow-sm">
                        {t('newGame') || "NEW GAME"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl font-game-heading uppercase tracking-widest text-white text-lg hover:scale-105 transition-all shadow-lg mt-8">
                      {t('start')}
                    </button>
                  )}
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
                   <div className="mb-8 font-game-mono text-slate-500 space-y-2">
                      <p className="text-xl font-bold text-primary">Mastery Points: {useGameStore.getState().masteryPoints.toLocaleString()}</p>
                      <p className="text-sm">Accuracy: {score} / {totalToGuess} ({totalToGuess > 0 ? Math.round((score / totalToGuess) * 100) : 0}%)</p>
                      
                      {/* SCORE REGISTRATION */}
                      <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
                        {isScoreRegistered ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold animate-in zoom-in">
                            <CheckCircle2 size={16} /> RECORD REGISTERED
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {currentUser ? (
                              <button 
                                onClick={handleRegisterScore}
                                className="bg-primary/10 text-primary border border-primary/20 py-3 rounded-xl font-game-heading text-sm hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                              >
                                <Trophy size={16} /> REGISTER RECORD FOR {currentUser.username}
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400">Register as Guest</p>
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Your Name..."
                                    className="flex-grow bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] px-4 py-2 rounded-xl text-xs outline-none focus:border-primary"
                                  />
                                  <button 
                                    onClick={handleRegisterScore}
                                    disabled={!guestName.trim()}
                                    className="bg-primary text-white px-4 py-2 rounded-xl font-game-heading text-sm disabled:opacity-50"
                                  >
                                    SAVE
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                   </div>
                   <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl text-white uppercase tracking-widest font-game-heading text-xl mb-4">{t('playAgain')}</button>
                   <button onClick={resetGame} className="text-slate-500 font-game-heading uppercase tracking-widest">{t('menu')}</button>
                </div>
             )}
           </div>
        </div>
      )}
    </main>
  );
}
