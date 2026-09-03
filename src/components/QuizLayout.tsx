'use client';

import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { Trophy, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, AlertCircle, Maximize2, Minimize2, Copy, Volume2, VolumeX, Lightbulb, Globe2, Map as MapIcon } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { getAllCountriesAction } from '@/app/actions';
import DifficultyTicket from '@/components/DifficultyTicket';
import { GameHUD } from '@/components/GameHUD';
import GameMap from '@/components/GameMap';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { PRESETS, AdvancedSettings, Difficulty } from '@/config/gameConstants';
import { games } from '@/config/gamesList';
import { Link } from '@/i18n/routing';
import getFeedback from '@/lib/getFeedback';
import { getHintLetterClue, getHintFact } from '@/lib/hints';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { playCorrect, playFinish, playStreak, playWrong } from '@/lib/sounds';
import { useGameStore, StateFeature, GameMode } from '@/store/useGameStore';
import { useUserStore } from '@/store/useUserStore';
import { Country } from '@/types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Quiz.difficulty / Quiz.difficultyDesc message keys are camelCase; the
// Difficulty type's own values are kebab-case (matches PRESETS in gameConstants.ts).
const DIFFICULTY_MESSAGE_KEY: Record<Difficulty, string> = {
  'very-easy': 'veryEasy', easy: 'easy', medium: 'medium', hard: 'hard', blazing: 'blazing', blitz: 'blitz', custom: 'custom',
};

// Drives the little signal-bar meter on each difficulty row: 1 (calm) to 5
// (brutal). Blitz is a 60s sprint rather than a point on the ramp, so it sits
// mid-scale; custom (0) shows a settings glyph instead of bars.
const DIFFICULTY_INTENSITY: Record<Difficulty, number> = {
  'very-easy': 1, easy: 2, medium: 3, hard: 4, blazing: 5, blitz: 3, custom: 0,
};

interface QuizLayoutProps {
  gameKey: string;
  title: string;
  description: string;
  mapData: Topology | undefined;
  mapStatus: 'pending' | 'success' | 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projection: any;
  /** Whether `projection` is the draggable orthographic globe. */
  isGlobe?: boolean;
  /** Whether this game's dataset supports a globe view at all (real lng/lat). */
  globeAvailable?: boolean;
  validNames: string[];
  duration: number;
  gameMode?: GameMode;
  capitalMap?: Record<string, string>;
  showOnlyValid?: boolean;
  capitalCoordinates?: Record<string, [number, number]>;
  /** Raw region/country name -> every one of its translations across all 9
   *  supported locales, so answer-checking accepts a guess typed in any of
   *  them, not just the current UI locale. */
  localizedNames?: Record<string, string[]>;
  /** Daily Challenge etc: adds a "Copy Results" share button to the finish screen. */
  shareResults?: boolean;
}

export default function QuizLayout({
  gameKey, title, description, mapData, mapStatus, projection, isGlobe = false, globeAvailable = false,
  validNames, gameMode = 'name', capitalMap = {},
  showOnlyValid = false, capitalCoordinates = {}, localizedNames = {}, shareResults = false
}: QuizLayoutProps) {
  const t = useTranslations('Quiz');
  const tRegions = useTranslations('RegionNames');
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    status: gameStatus, startGame, resetGame, currentState, score,
    totalToGuess, timeLeft, tick, isNewHighScore,
    userInput, setUserInput, submitGuess, skipState, lastGuessCorrect,
    correctlyGuessedIds, missedStates, options,
    autoZoom, setAutoZoom, soundEnabled, setSoundEnabled, gameView, setGameView, streak,
    pauseGame, resumeGame, quitGame, savedGames, currentGameKey,
    hintLevel, revealHint
  } = useGameStore();
  
  const savedGame = savedGames[gameKey];
  const gameMeta = games.find((g) => g.id === gameKey);
  const GameIcon = gameMeta?.icon ?? Globe2;
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [adv, setAdv] = useState<AdvancedSettings>(PRESETS['medium']);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    if (newDifficulty !== 'custom') {
      setAdv(PRESETS[newDifficulty]);
    }
  };

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [isScoreRegistered, setIsScoreRegistered] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [resultsCopied, setResultsCopied] = useState(false);

  const handleCopyResults = async () => {
    const points = useGameStore.getState().masteryPoints;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `GeoGeek — ${title}\n${score}/${totalToGuess} correct · ${points.toLocaleString()} pts\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      setResultsCopied(true);
      setTimeout(() => setResultsCopied(false), 2000);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — silently no-op */
    }
  };

  const { currentUser, submitScore } = useUserStore();

  useEffect(() => {
    if (gameStatus === 'playing') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [gameStatus]);

  const handleRegisterScore = async () => {
    if (!currentUser) return;
    const finalPoints = useGameStore.getState().masteryPoints;
    setSubmitError('');
    setIsSubmittingScore(true);
    const result = await submitScore({
      gameKey,
      score,
      totalToGuess,
      masteryPoints: finalPoints,
      difficulty,
    });
    setIsSubmittingScore(false);
    if (result.success) {
      setIsScoreRegistered(true);
    } else {
      setSubmitError(result.error || 'Failed to save score');
    }
  };

  useEffect(() => {
    async function loadCountries() {
      const countries = await getAllCountriesAction();
      setAllCountries(countries);
    }
    loadCountries();
  }, []);

  const getFlagUrl = (name: string) => {
    const country = allCountries.find(c =>
      c.name.en === name ||
      Object.values(c.name).some(v => v === name)
    );
    return country?.flagUrl;
  };

  // Sovereign-country games (World/Africa/Asia/Europe/Oceania/...) have no
  // RegionNames entries at all — those only cover the curated US/Brazil/
  // Italy/France/Canada/Australia/South-America lists. For everything else,
  // display uses the country dataset's own localized name, now translated
  // directly for all 9 locales by wiki-geo-data; the browser/runtime's
  // built-in CLDR data via Intl.DisplayNames is kept only as a defensive
  // fallback for a record missing one of them.
  const getLocalizedName = (name: string) => {
    const country = allCountries.find((c) => c.name.en === name);
    if (country) {
      const directTranslation = country.name[locale as keyof typeof country.name];
      const localized = directTranslation || (country.isoCode ? getLocalizedCountryName(country.isoCode, locale) : null);
      if (localized) return localized;
    }
    // next-intl doesn't throw for a missing key by default — it returns the
    // fully-qualified key path (e.g. "RegionNames.Pakistan") as the string,
    // so a try/catch never catches it.
    if (!tRegions.has(name)) return name;
    return tRegions(name);
  };

  // Every accepted spelling of a region/country name, across all 9 locales,
  // for answer-checking (not just the current UI locale's - see useGameStore
  // submitGuess). Sovereign countries come from wiki-geo-data (now natively
  // translated in all 9); sub-national regions (US states, Brazil states,
  // etc.) come in via the `localizedNames` prop, which BaseGameClient builds
  // from the static RegionNames catalog. The two key sets never overlap.
  const countryNameVariants = useMemo(() => {
    if (!allCountries.length) return {};
    const map: Record<string, string[]> = {};
    allCountries.forEach((c) => {
      const rawName = c.name.en;
      if (!rawName) return;
      const variants = new Set<string>();
      Object.values(c.name).forEach((v) => { if (v && v !== rawName) variants.add(v); });
      if (variants.size) map[rawName] = [...variants];
    });
    return map;
  }, [allCountries]);

  const allLocalizedNames = useMemo(
    () => ({ ...countryNameVariants, ...localizedNames }),
    [countryNameVariants, localizedNames]
  );

  // Same idea, but for capital names (name-mode has no equivalent - a
  // capital's translations only ever matter when guessing the capital
  // itself). Keyed by the capital's English name so it lines up with
  // whatever capitalMap (wiki-geo-data or a static config) already uses.
  const capitalLocalizedNames = useMemo(() => {
    if (!allCountries.length) return {};
    const map: Record<string, string[]> = {};
    allCountries.forEach((c) => {
      const rawCapital = c.capital.en;
      if (!rawCapital || rawCapital === 'N/A') return;
      const variants = new Set<string>();
      Object.values(c.capital).forEach((v) => { if (v && v !== rawCapital && v !== 'N/A') variants.add(v); });
      if (variants.size) map[rawCapital] = [...variants];
    });
    return map;
  }, [allCountries]);

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
    if (!soundEnabled) return;
    if (lastGuessCorrect === true) {
      if (streak > 0 && streak % 5 === 0) playStreak();
      else playCorrect();
    } else if (lastGuessCorrect === false) {
      playWrong();
    }
    // Only the guess result itself should trigger a sound, not every time
    // streak/soundEnabled happen to change for other reasons.
  }, [lastGuessCorrect]);

  useEffect(() => {
    if (soundEnabled && gameStatus === 'finished') playFinish();
  }, [gameStatus]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStatus === 'playing') interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [gameStatus, tick]);

  const handleStartGame = () => {
    if (mapData) {
      const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawStates = (feature(mapData, mapData.objects[objectKey]) as any).features as StateFeature[];
      // A few territories in the world-atlas topology (Kosovo, Somaliland,
      // Northern Cyprus) have no numeric `id` at all, so they'd all collide
      // on the string "undefined" downstream — fall back to the feature's
      // own name, which is unique across the dataset.
      const states = rawStates.map((s) => (s.id == null ? { ...s, id: s.properties.name } : s));

      if (savedGame) quitGame();
      
      startGame(states, validNames, difficulty, adv, gameKey, gameMode, capitalMap, allLocalizedNames, capitalLocalizedNames);
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
      // Match the id-fallback used when building game states (see handleStartGame).
      const feat = geo.features.find((f: any) => String(f.id ?? f.properties?.name) === id);
      return feat ? feat.properties.name : 'Unknown';
    });
  }, [mapData, correctlyGuessedIds]);

  // Hint ladder always describes the state currently being guessed
  // (currentState.properties.name) - even in 'reverse' mode, where the
  // capital is what's displayed, the region is still the answer the player
  // is looking for.
  const hintInfo = useMemo(() => {
    if (!currentState) return null;
    const rawName = currentState.properties.name;
    const localizedName = getLocalizedName(rawName);
    return {
      letterClue: getHintLetterClue(localizedName),
      fact: getHintFact(rawName, locale, allCountries),
    };
  }, [currentState, locale, allCountries]);

  if (mapStatus === 'pending') {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[var(--background)]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </main>
    );
  }

  return (
    <div className={cn("w-full bg-[var(--background)]", gameStatus === 'playing' ? "fixed inset-0 z-0" : "relative")}>

      <div className="fixed inset-0 z-0 h-full w-full">
        {mapData && (
          <GameMap 
            mapData={mapData} 
            highlightedStateId={currentState?.id || null} 
            projection={projection} 
            validNames={validNames}
            gameMode={gameMode as any}
            capitalMap={capitalMap}
            capitalCoordinates={capitalCoordinates}
            isGlobe={isGlobe}
            showOnlyValid={showOnlyValid}
            onRegionClick={handleRegionClick}
            hideBorders={adv.hideBorders}
            noMapHints={adv.noMapHints}
            showLabels={isLearning}
            getLabel={getLocalizedName}
          />
        )}
      </div>

      {gameStatus === 'playing' && (
        <>
          <GameHUD score={score} total={totalToGuess} timeLeft={timeLeft} />

          <div className="absolute top-6 right-10 z-20 flex gap-2 pointer-events-auto">
            {globeAvailable && (
              <SimpleTooltip label={gameView === 'globe' ? t('flatMap') : t('globeView')}>
                <button
                  onClick={() => setGameView(gameView === 'globe' ? 'flat' : 'globe')}
                  aria-label={gameView === 'globe' ? t('flatMap') : t('globeView')}
                  aria-pressed={gameView === 'globe'}
                  className={cn(
                    "p-3 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
                    gameView === 'globe' ? "bg-primary/20 border-primary text-primary" : "bg-[var(--card-bg)]/85 border-[var(--card-border)] text-slate-400"
                  )}
                >
                  {gameView === 'globe' ? <MapIcon size={24} /> : <Globe2 size={24} />}
                </button>
              </SimpleTooltip>
            )}
            <SimpleTooltip label={soundEnabled ? t('muteSound') : t('unmuteSound')}>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? t('muteSound') : t('unmuteSound')}
                className={cn(
                  "p-3 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
                  soundEnabled ? "bg-primary/20 border-primary text-primary" : "bg-[var(--card-bg)]/85 border-[var(--card-border)] text-slate-400"
                )}
              >
                {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
            </SimpleTooltip>
            <SimpleTooltip label={autoZoom ? t('disableAutoZoom') : t('enableAutoZoom')}>
              <button
                onClick={() => setAutoZoom(!autoZoom)}
                aria-label={autoZoom ? t('disableAutoZoom') : t('enableAutoZoom')}
                className={cn(
                  "p-3 rounded-2xl border backdrop-blur-md transition-all shadow-lg",
                  autoZoom ? "bg-primary/20 border-primary text-primary" : "bg-[var(--card-bg)]/85 border-[var(--card-border)] text-slate-400"
                )}
              >
                {autoZoom ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
              </button>
            </SimpleTooltip>
          </div>

          <div className="absolute top-24 left-10 hidden xl:flex flex-col gap-4 w-60 bg-[var(--card-bg)]/85 backdrop-blur-md p-5 rounded-2xl border border-[var(--card-border)] shadow-lg animate-in fade-in slide-in-from-left-4 duration-500">
            <h3 className="font-game-heading text-lg tracking-wider text-primary border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
              <CheckCircle2 size={16} /> {t('guessed').toUpperCase()} ({score})
            </h3>
            <div className="flex flex-col gap-2.5">
              {recentGuesses.length === 0 ? (
                <span className="text-xs font-game-mono text-slate-400 italic">{t('noneYet')}</span>
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
              <AlertCircle size={16} /> {t('skipped').toUpperCase()} ({missedStates.length})
            </h3>
            {/* Names intentionally withheld during play — skipping shouldn't
                reveal the answer. Full list appears in the end-of-run review. */}
            <p className="text-xs font-game-mono text-slate-400 italic">
              {missedStates.length === 0 ? t('noneYet') : t('revealAtEnd')}
            </p>
          </div>
        </>
      )}

      {gameStatus === 'playing' && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-10 px-6 md:bottom-12">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4">

            {(gameMode === 'capital' || gameMode === 'flag' || gameMode === 'reverse') && currentState && (
              <div className="pointer-events-auto animate-in slide-in-from-bottom-2 rounded-xl bg-[var(--foreground)] px-6 py-4 flex flex-col items-center gap-4 text-sm font-bold text-[var(--background)] shadow-xl">
                {gameMode === 'flag' ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-widest opacity-60">{t('locateFlag')}</span>
                    {getFlagUrl(currentState.properties.name) ? (
                      <Image
                        src={getFlagUrl(currentState.properties.name)!}
                        alt="Target flag"
                        width={160}
                        height={80}
                        className="h-20 w-auto rounded border border-white/20 shadow-md object-contain"
                      />
                    ) : (
                      <div className="h-20 w-32 bg-white/10 rounded flex items-center justify-center italic text-xs">{t('flagMissing')}</div>
                    )}
                  </div>
                ) : gameMode === 'reverse' ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs uppercase tracking-widest opacity-60">{t('findRegionWithCapital')}</span>
                    <span className="text-xl">{capitalMap[currentState.properties.name] || currentState.properties.name}</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  t('target', { name: getLocalizedName(currentState.properties.name) } as any)
                )}
              </div>
            )}

            {adv.hints && hintInfo && hintLevel > 0 && (
              <div className="pointer-events-auto flex max-w-md flex-col items-center gap-1.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-center animate-in fade-in slide-in-from-bottom-2">
                <span className="flex items-center gap-1.5 font-game-mono text-xs font-bold uppercase tracking-widest text-amber-500">
                  <Lightbulb size={14} />
                  {t('hintLetterClue', { letter: hintInfo.letterClue.letter, count: hintInfo.letterClue.count })}
                </span>
                {hintLevel > 1 && hintInfo.fact && (
                  <span className="font-game-mono text-xs text-amber-700 dark:text-amber-300">{hintInfo.fact}</span>
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
                   placeholder={gameMode === 'capital' ? t('typeCapital') : (gameMode === 'flag' ? t('flagPlaceholder') : t('typeRegion'))}
                 />
                 <button
                   onClick={() => submitGuess(userInput)}
                   className="bg-primary text-white px-8 py-3 rounded-full font-game-heading uppercase tracking-wider shadow-lg hover:bg-teal-600 transition-colors"
                 >
                   {t('guess')}
                 </button>
              </div>
            )}
            {lastGuessCorrect === false && options.length === 0 && (
              <span className="text-xs font-bold text-red-500 uppercase -mt-2 animate-pulse">{t('tryAgain')}</span>
            )}

            <div className="flex gap-2 pointer-events-auto">
              {adv.hints && hintInfo && (hintLevel === 0 || (hintLevel === 1 && hintInfo.fact)) && (
                <button
                  onClick={revealHint}
                  className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-amber-500/20 transition-colors"
                >
                  <Lightbulb size={14} /> {t('hint')}
                </button>
              )}
              <button
                onClick={quitGame}
                className="bg-red-500 text-white px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-red-600 transition-colors"
              >
                {t('quit')}
              </button>
              <button
                onClick={skipState}
                className="bg-[var(--card-bg)] text-slate-500 px-6 py-2 rounded-xl font-game-heading uppercase text-sm shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('skip')}
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

      {(gameStatus === 'idle' || gameStatus === 'finished') && !isLearning && (
        <>
          <div className="fixed inset-0 z-30 backdrop-blur-2xl pointer-events-none" />
          <div className="relative z-40 w-full">
            <div className="min-h-[calc(100vh-90px)] flex items-center justify-center p-4 py-12">
             {gameStatus === 'idle' ? (
                <div className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl md:p-9">
                   <div className="relative mb-7">
                     <Link
                       href="/games"
                       aria-label={t('menu')}
                       className="absolute -left-1 -top-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-[var(--background)] hover:text-primary"
                     >
                       <ArrowLeft size={20} />
                     </Link>
                     <div className="flex flex-col items-center text-center">
                       <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                         <GameIcon size={26} />
                       </div>
                       <h1 className="text-3xl font-game-heading uppercase tracking-widest text-[var(--foreground)] md:text-4xl">{title}</h1>
                       <p className="mt-2 max-w-sm font-game-mono text-[13px] leading-relaxed text-slate-500">{description}</p>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     {(Object.keys(PRESETS) as Difficulty[]).map((d) => (
                       <DifficultyTicket
                         key={d}
                         title={t(`difficulty.${DIFFICULTY_MESSAGE_KEY[d]}`)}
                         desc={t(`difficultyDesc.${DIFFICULTY_MESSAGE_KEY[d]}`)}
                         intensity={DIFFICULTY_INTENSITY[d]}
                         isSelected={difficulty === d}
                         onClick={() => handleDifficultyChange(d)}
                       />
                     ))}
                     <DifficultyTicket
                       title={t('difficulty.custom')}
                       desc={t('difficultyDesc.custom')}
                       intensity={DIFFICULTY_INTENSITY.custom}
                       isSelected={difficulty === 'custom'}
                       onClick={() => setDifficulty('custom')}
                     />
                   </div>

                   {difficulty === 'custom' && (
                    <section className="mt-3 rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/60 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <h3 className="font-game-heading text-primary uppercase tracking-widest text-xs mb-3">{t('advancedConfiguration')}</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs font-game-mono">
                        {([
                          ['isMultipleChoice', t('multipleChoice')],
                          ['strictMatching', t('strictMatching')],
                          ['noMapHints', t('noMapHints')],
                          ['hideBorders', t('hideBorders')],
                          ['hints', t('hints')],
                        ] as const).map(([key, label]) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] px-3 py-2.5 cursor-pointer transition-colors has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary text-[var(--foreground)]"
                          >
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={adv[key]}
                              onChange={(e) => setAdv({ ...adv, [key]: e.target.checked })}
                            />
                            {label}
                          </label>
                        ))}
                        <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] px-3 py-2.5">
                          <label className="text-slate-500 shrink-0">{t('timePerGuess')}</label>
                          <input
                            type="number"
                            min={1}
                            value={adv.timePerGuess}
                            onChange={(e) => setAdv({ ...adv, timePerGuess: parseInt(e.target.value) || 1 })}
                            className="w-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-right outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </section>
                   )}

                   <div className="mt-6 flex flex-col gap-3">
                     {savedGame ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button onClick={() => resumeGame(gameKey)} className="flex-1 rounded-2xl bg-primary py-3.5 font-game-heading text-lg uppercase tracking-widest text-white transition-colors hover:bg-teal-600">
                          {t('resume') || 'RESUME GAME'}
                        </button>
                        <button onClick={handleStartGame} className="flex-1 rounded-2xl border border-[var(--card-border)] py-3.5 font-game-heading text-lg uppercase tracking-widest text-slate-500 transition-colors hover:border-red-400 hover:text-red-500">
                          {t('newGame') || 'NEW GAME'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={handleStartGame} className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-game-heading text-lg uppercase tracking-widest text-white transition-colors hover:bg-teal-600">
                        {t('start')}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsLearning(true)}
                      className="flex items-center justify-center gap-2 py-1 font-game-mono text-xs uppercase tracking-widest text-slate-400 transition-colors hover:text-primary"
                    >
                      <BookOpen size={14} /> {t('studyMapFirst')}
                    </button>
                   </div>
                </div>
             ) : (
                <div className="flex flex-col w-full max-w-lg rounded-3xl bg-[var(--card-bg)] p-10 text-center shadow-2xl border-2 border-dashed border-[var(--card-border)] overflow-hidden">
                   <div className="flex-shrink-0">
                     <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
                     {isNewHighScore && (
                        <div className="mb-4 animate-bounce rounded-full bg-amber-400 px-6 py-2 text-sm font-bold text-slate-900 shadow-lg uppercase tracking-wider inline-block">
                          {t('newHighScore')}
                        </div>
                      )}
                     <h2 className="mb-6 text-4xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{t(`feedback.${getFeedback(score, totalToGuess)}`)}</h2>
                   </div>

                   <div className="flex-1 overflow-y-auto font-game-mono text-slate-500 space-y-2 pr-2">
                      <p className="text-xl font-bold text-primary">{t('masteryPoints')}: {useGameStore.getState().masteryPoints.toLocaleString()}</p>
                      <p className="text-sm">{t('accuracy')}: {score} / {totalToGuess} ({totalToGuess > 0 ? Math.round((score / totalToGuess) * 100) : 0}%)</p>

                      {missedStates.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-[var(--card-border)] text-left">
                          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                            <AlertCircle size={14} /> {t('missed')} ({missedStates.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {missedStates.map((state) => (
                              <span key={state.id} className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400">
                                {getLocalizedName(state.properties.name)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SCORE REGISTRATION */}
                      <div className="mt-8 pt-6 border-t border-[var(--card-border)]">
                        {isScoreRegistered ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold animate-in zoom-in">
                            <CheckCircle2 size={16} /> {t('savedToLeaderboard').toUpperCase()}
                          </div>
                        ) : currentUser ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleRegisterScore}
                              disabled={isSubmittingScore}
                              className="bg-primary/10 text-primary border border-primary/20 py-3 rounded-xl font-game-heading text-sm hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Trophy size={16} /> {isSubmittingScore ? t('saving').toUpperCase() : t('saveToLeaderboard', { username: currentUser.username }).toUpperCase()}
                            </button>
                            {submitError && (
                              <p className="text-[10px] text-red-500 uppercase tracking-widest text-center">{submitError}</p>
                            )}
                          </div>
                        ) : (
                          <Link
                            href="/login"
                            className="bg-primary/10 text-primary border border-primary/20 py-3 rounded-xl font-game-heading text-sm hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Trophy size={16} /> {t('loginToSave').toUpperCase()}
                          </Link>
                        )}
                      </div>
                   </div>

                   <div className="flex-shrink-0 mt-8">
                     {shareResults && (
                       <button
                         onClick={handleCopyResults}
                         className="mb-4 w-full flex items-center justify-center gap-2 bg-[var(--input-bg)] border border-[var(--card-border)] py-3 rounded-2xl font-game-heading uppercase tracking-widest text-sm text-[var(--foreground)] hover:border-primary hover:text-primary transition-all"
                       >
                         {resultsCopied ? <><CheckCircle2 size={16} /> {t('copied')}</> : <><Copy size={16} /> {t('copyResults')}</>}
                       </button>
                     )}
                     <button onClick={handleStartGame} className="bg-[var(--primary)] w-full py-4 rounded-2xl text-white uppercase tracking-widest font-game-heading text-xl mb-4">{t('playAgain')}</button>
                     <button onClick={resetGame} className="text-slate-500 font-game-heading uppercase tracking-widest">{t('menu')}</button>
                   </div>
                </div>
             )}
          </div>
        </div>
      </>
      )}

      {gameStatus === 'idle' && isLearning && (
        <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-30 flex justify-center px-6">
          <div className="pointer-events-auto flex items-center gap-4 rounded-2xl bg-[var(--card-bg)]/95 backdrop-blur-md border border-[var(--card-border)] px-6 py-4 shadow-2xl">
            <span className="hidden sm:block font-game-mono text-xs text-slate-500 max-w-[220px]">
              {t('studyMapHint')}
            </span>
            <button
              onClick={() => setIsLearning(false)}
              className="rounded-xl px-5 py-2.5 font-game-heading uppercase tracking-widest text-sm text-slate-500 border border-[var(--card-border)] hover:text-primary hover:border-primary transition-all"
            >
              {t('back')}
            </button>
            <button
              onClick={() => { setIsLearning(false); handleStartGame(); }}
              className="rounded-xl bg-[var(--primary)] px-6 py-2.5 font-game-heading uppercase tracking-widest text-sm text-white shadow-lg hover:scale-105 transition-all"
            >
              {t('startQuiz')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
