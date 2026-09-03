import * as d3 from 'd3';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { ALIASES } from '@/config/aliases';
import { BLITZ_DURATION_SECONDS, POINTS_MULTIPLIERS, AdvancedSettings, Difficulty as ConfigDifficulty } from '@/config/gameConstants';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type Difficulty = ConfigDifficulty;
export type GameMode = 'name' | 'capital' | 'flag' | 'reverse';
export type GameType = 'standard' | 'survival' | 'blitz';

export interface StateFeature {
  id: string;
  properties: { name: string; };
  geometry: d3.GeoGeometryObjects;
}

export interface LightweightState {
  id: string;
  properties: { name: string };
}

export interface SavedGame {
  difficulty: Difficulty;
  advancedSettings: AdvancedSettings;
  gameMode: GameMode;
  options: string[];
  capitalMap: Record<string, string>;
  localizedNames: Record<string, string[]>;
  capitalLocalizedNames: Record<string, string[]>;
  score: number;
  masteryPoints: number;
  currentMultiplier: number;
  timeLeft: number;
  currentState: LightweightState | null;
  remainingStates: LightweightState[];
  missedStates: LightweightState[];
  correctlyGuessedIds: string[];
  totalToGuess: number;
  streak: number;
}

interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  advancedSettings: AdvancedSettings;
  gameMode: GameMode;
  options: string[];
  currentGameKey: string;
  capitalMap: Record<string, string>;
  localizedNames: Record<string, string[]>;
  capitalLocalizedNames: Record<string, string[]>;
  score: number;
  masteryPoints: number;
  currentMultiplier: number;
  timeLeft: number;
  highScores: Record<string, number>;
  savedGames: Record<string, SavedGame>;
  currentState: LightweightState | null;
  remainingStates: LightweightState[];
  missedStates: LightweightState[];
  correctlyGuessedIds: string[];
  userInput: string;
  lastGuessCorrect: boolean | null;
  lastSkippedState: LightweightState | null;
  isNewHighScore: boolean;
  totalToGuess: number;
  autoZoom: boolean;
  soundEnabled: boolean;
  /** Map projection for the quiz map: a flat map or a draggable orthographic globe. */
  gameView: 'flat' | 'globe';
  /** Consecutive correct answers in the current run; resets on a wrong guess or a skip. */
  streak: number;
  /** Progressive hint ladder for the current target: 0 = none revealed, 1 = letter clue, 2 = fun fact. Resets on every new/skipped state. */
  hintLevel: number;

  startGame: (
    states: StateFeature[],
    validNames: string[],
    difficulty: Difficulty,
    advancedSettings: AdvancedSettings,
    gameKey: string,
    gameMode?: GameMode,
    capitalMap?: Record<string, string>,
    localizedNames?: Record<string, string[]>,
    capitalLocalizedNames?: Record<string, string[]>
  ) => void;
  resumeGame: (gameKey: string) => void;
  pauseGame: () => void;
  quitGame: () => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  setAutoZoom: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setGameView: (view: 'flat' | 'globe') => void;
  revealHint: () => void;
  resetGame: () => void;
}

const SURVIVAL_START_TIME = 15;
const SURVIVAL_BONUS = 3;
const SURVIVAL_PENALTY = 5;

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.,-]/g, "").trim();
};

const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const isFuzzyMatch = (guess: string, target: string): boolean => {
  if (guess.length <= 5) return guess === target;
  return getLevenshteinDistance(guess, target) <= 1;
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => {
      const updateAndSave = (updates: Partial<GameState>) => {
        set((state) => {
          const newState = { ...state, ...updates };
          
          if (newState.status === 'playing' && newState.currentGameKey) {
            newState.savedGames = {
              ...newState.savedGames,
              [newState.currentGameKey]: {
                difficulty: newState.difficulty,
                advancedSettings: newState.advancedSettings,
                gameMode: newState.gameMode,
                options: newState.options,
                capitalMap: newState.capitalMap,
                localizedNames: newState.localizedNames,
                capitalLocalizedNames: newState.capitalLocalizedNames,
                score: newState.score,
                masteryPoints: newState.masteryPoints,
                currentMultiplier: newState.currentMultiplier,
                timeLeft: newState.timeLeft,
                currentState: newState.currentState,
                remainingStates: newState.remainingStates,
                missedStates: newState.missedStates,
                correctlyGuessedIds: newState.correctlyGuessedIds,
                totalToGuess: newState.totalToGuess,
                streak: newState.streak,
              }
            };
          }

          if (newState.status === 'finished' && newState.currentGameKey && newState.savedGames[newState.currentGameKey]) {
            const newSavedGames = { ...newState.savedGames };
            delete newSavedGames[newState.currentGameKey];
            newState.savedGames = newSavedGames;
          }

          return newState;
        });
      };

      return {
        status: 'idle',
        difficulty: 'medium',
        advancedSettings: {
          isMultipleChoice: false,
          gameType: 'standard',
          strictMatching: false,
          noMapHints: false,
          hideBorders: false,
          timePerGuess: 20,
          hints: true,
        },
        gameMode: 'name',
        options: [],
        currentGameKey: '',
        capitalMap: {},
        localizedNames: {},
        capitalLocalizedNames: {},
        score: 0,
        masteryPoints: 0,
        currentMultiplier: 1,
        timeLeft: 0,
        highScores: {},
        savedGames: {},
        currentState: null,
        remainingStates: [],
        missedStates: [],
        correctlyGuessedIds: [],
        userInput: '',
        lastGuessCorrect: null,
        lastSkippedState: null,
        isNewHighScore: false,
        totalToGuess: 0,
        autoZoom: true,
        soundEnabled: true,
        gameView: 'flat',
        streak: 0,
        hintLevel: 0,

        startGame: (states, validNames, difficulty, advancedSettings, gameKey, gameMode = 'name', capitalMap = {}, localizedNames = {}, capitalLocalizedNames = {}) => {
          const filtered = states.filter(s => {
            if (!s.properties.name) return false;
            return validNames.some(name => normalizeString(s.properties.name) === normalizeString(name));
          });

          const shuffled = [...filtered].sort(() => Math.random() - 0.5);
          const lightStates: LightweightState[] = shuffled.map(s => ({ id: String(s.id), properties: { name: s.properties.name } }));

          const { isMultipleChoice, gameType, strictMatching, noMapHints, hideBorders, timePerGuess } = advancedSettings;
          
          let m = 1.0;
          m *= isMultipleChoice ? POINTS_MULTIPLIERS.input.choice : POINTS_MULTIPLIERS.input.typing;
          m *= gameType === 'survival' ? POINTS_MULTIPLIERS.mode.survival : gameType === 'blitz' ? POINTS_MULTIPLIERS.mode.blitz : POINTS_MULTIPLIERS.mode.standard;
          if (!isMultipleChoice && strictMatching) m *= POINTS_MULTIPLIERS.settings.strictMatching;
          if (noMapHints) m *= POINTS_MULTIPLIERS.settings.noMapHints;
          if (hideBorders) m *= POINTS_MULTIPLIERS.settings.hideBorders;
          const timeFactor = 20 / timePerGuess;
          m *= timeFactor;
          const totalMultiplier = Number(m.toFixed(2));
          
          const firstState = lightStates[0] || null;
          let initialOptions: string[] = [];
          
          if (isMultipleChoice && firstState) {
            const correct = gameMode === 'capital' ? (capitalMap[firstState.properties.name] || firstState.properties.name) : firstState.properties.name;
            const others = lightStates.filter(s => s.id !== firstState.id)
              .map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name);
            initialOptions = [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
          }

          updateAndSave({
            status: 'playing',
            difficulty,
            advancedSettings,
            gameMode,
            options: initialOptions,
            currentGameKey: gameKey,
            capitalMap,
            localizedNames,
            capitalLocalizedNames,
            score: 0,
            masteryPoints: 0,
            currentMultiplier: totalMultiplier,
            timeLeft: gameType === 'survival' ? SURVIVAL_START_TIME : gameType === 'blitz' ? BLITZ_DURATION_SECONDS : Math.floor(filtered.length * timePerGuess),
            remainingStates: lightStates.slice(1),
            currentState: firstState,
            missedStates: [],
            correctlyGuessedIds: [],
            userInput: '',
            lastGuessCorrect: null,
            lastSkippedState: null,
            isNewHighScore: false,
            totalToGuess: filtered.length,
            streak: 0,
            hintLevel: 0,
          });
        },

        resumeGame: (gameKey) => {
          const saved = get().savedGames[gameKey];
          if (saved) {
            set({
              status: 'playing',
              currentGameKey: gameKey,
              difficulty: saved.difficulty,
              advancedSettings: saved.advancedSettings,
              gameMode: saved.gameMode,
              options: saved.options,
              capitalMap: saved.capitalMap,
              localizedNames: saved.localizedNames || {},
              capitalLocalizedNames: saved.capitalLocalizedNames || {},
              score: saved.score,
              masteryPoints: saved.masteryPoints,
              currentMultiplier: saved.currentMultiplier,
              timeLeft: saved.timeLeft,
              currentState: saved.currentState,
              remainingStates: saved.remainingStates,
              missedStates: saved.missedStates,
              correctlyGuessedIds: saved.correctlyGuessedIds,
              totalToGuess: saved.totalToGuess,
              streak: saved.streak || 0,
              userInput: '',
              lastGuessCorrect: null,
              lastSkippedState: null,
              isNewHighScore: false,
              hintLevel: 0,
            });
          }
        },

        pauseGame: () => {
          set({ status: 'idle' });
        },

        quitGame: () => {
          const key = get().currentGameKey;
          set((state) => {
             const newSaved = { ...state.savedGames };
             if (key) delete newSaved[key];

             // Quitting mid-run should land on the same end-of-run results
             // screen as finishing or timing out — not silently reset to
             // the idle start screen with the score wiped.
             const oldHighScore = state.highScores[key] || 0;
             const isHighScore = state.masteryPoints > oldHighScore;

             return {
               status: 'finished',
               savedGames: newSaved,
               currentState: null,
               remainingStates: [],
               userInput: '',
               lastGuessCorrect: null,
               lastSkippedState: null,
               highScores: isHighScore ? { ...state.highScores, [key]: state.masteryPoints } : state.highScores,
               isNewHighScore: isHighScore,
               options: []
             };
          });
        },
        
        setUserInput: (userInput) => set({ userInput, lastGuessCorrect: null, lastSkippedState: null }),
        setAutoZoom: (autoZoom) => set({ autoZoom }),
        setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
        setGameView: (gameView) => set({ gameView }),
        revealHint: () => set((state) => ({ hintLevel: Math.min(state.hintLevel + 1, 2) })),

        submitGuess: (guess) => {
          const state = get();
          const { currentState, remainingStates, score, correctlyGuessedIds, gameMode, capitalMap, localizedNames, capitalLocalizedNames, currentGameKey, highScores, timeLeft, currentMultiplier, advancedSettings, streak } = state;
          if (!currentState) return false;

          const regionName = currentState.properties.name;
          const targetAnswer = gameMode === 'capital' ? (capitalMap[regionName] || regionName) : regionName;

          const normalizedGuess = normalizeString(guess);
          const normalizedTarget = normalizeString(targetAnswer);
          const targetAliases = (ALIASES[normalizedTarget] || []).map(normalizeString);
          // The guess is accepted in any of the 9 supported languages, not
          // just the raw (English) name baked into the map data: both the
          // country/region's name and, in capital mode, its capital's name
          // are looked up across every locale (wiki-geo-data for sovereign
          // countries and capitals, the static RegionNames catalog for
          // sub-national regions - see QuizLayout/BaseGameClient). A saved
          // game from before this map held plain strings, not arrays -
          // coerce defensively so resuming one doesn't crash.
          const localizedMap = gameMode === 'capital' ? capitalLocalizedNames : localizedNames;
          const rawLocalizedTargets = localizedMap?.[gameMode === 'capital' ? targetAnswer : regionName];
          const localizedTargets = Array.isArray(rawLocalizedTargets)
            ? rawLocalizedTargets
            : (rawLocalizedTargets ? [rawLocalizedTargets as unknown as string] : []);
          const normalizedLocalizedTargets = localizedTargets.map(normalizeString);

          const checkMatch = (target: string) => {
            if (advancedSettings.strictMatching) return normalizedGuess === target;
            return normalizedGuess === target || isFuzzyMatch(normalizedGuess, target);
          };

          const isCorrect = checkMatch(normalizedTarget)
            || targetAliases.some(checkMatch)
            || normalizedLocalizedTargets.some(checkMatch);

          if (isCorrect) {
            const newCorrectIds = [...correctlyGuessedIds, currentState.id];
            const newScore = score + 1;
            const newPoints = Math.round(newScore * currentMultiplier * 10);
            const newStreak = streak + 1;

            const isFinished = remainingStates.length === 0;
            const newTime = advancedSettings.gameType === 'survival' ? timeLeft + SURVIVAL_BONUS : timeLeft;

            if (isFinished) {
              const oldHighScore = highScores[currentGameKey] || 0;
              const isHighScore = newPoints > oldHighScore;
              updateAndSave({ 
                status: 'finished', 
                score: newScore,
                masteryPoints: newPoints,
                currentState: null, 
                userInput: '', 
                lastGuessCorrect: true, 
                lastSkippedState: null, 
                correctlyGuessedIds: newCorrectIds,
                highScores: isHighScore ? { ...highScores, [currentGameKey]: newPoints } : highScores,
                isNewHighScore: isHighScore,
                timeLeft: newTime,
                streak: newStreak,
                hintLevel: 0,
              });
            } else {
              const nextState = remainingStates[0];
              let nextOptions: string[] = [];
              
              if (advancedSettings.isMultipleChoice) {
                const correct = gameMode === 'capital' ? (capitalMap[nextState.properties.name] || nextState.properties.name) : nextState.properties.name;
                const allPossibleOptions = [...remainingStates.map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name)].filter(o => o && normalizeString(o) !== normalizeString(correct));
                nextOptions = [correct, ...allPossibleOptions.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
              }

              updateAndSave({
                score: newScore,
                masteryPoints: newPoints,
                currentState: nextState,
                remainingStates: remainingStates.slice(1),
                userInput: '',
                lastGuessCorrect: true,
                lastSkippedState: null,
                correctlyGuessedIds: newCorrectIds,
                timeLeft: newTime,
                options: nextOptions,
                streak: newStreak,
                hintLevel: 0,
              });
            }
            return true;
          } else {
            updateAndSave({ lastGuessCorrect: false, lastSkippedState: null, streak: 0 });
            return false;
          }
        },

        skipState: () => {
          const { currentState, remainingStates, missedStates, timeLeft, gameMode, capitalMap, advancedSettings } = get();
          if (!currentState) return;
          
          const updatedRemaining =[...remainingStates, currentState];
          const newMissed = [...new Set([...missedStates, currentState])];
          const newTime = advancedSettings.gameType === 'survival' ? Math.max(0, timeLeft - SURVIVAL_PENALTY) : timeLeft;

          if (newTime === 0 && advancedSettings.gameType === 'survival') {
            updateAndSave({ status: 'finished', timeLeft: 0, missedStates: newMissed, streak: 0, hintLevel: 0 });
            return;
          }
          
          const nextState = updatedRemaining[0];
          let nextOptions: string[] = [];
          if (advancedSettings.isMultipleChoice) {
            const correct = gameMode === 'capital' ? (capitalMap[nextState.properties.name] || nextState.properties.name) : nextState.properties.name;
            const others = updatedRemaining.filter(s => s.id !== nextState.id)
              .map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name);
            nextOptions = [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
          }

          updateAndSave({
            currentState: nextState,
            remainingStates: updatedRemaining.slice(1),
            userInput: '',
            lastGuessCorrect: null,
            lastSkippedState: currentState,
            missedStates: newMissed,
            timeLeft: newTime,
            options: nextOptions,
            streak: 0,
            hintLevel: 0,
          });
        },

        tick: () => {
          const { timeLeft, status } = get();
          if (status !== 'playing') return;
          
          if (timeLeft <= 1) {
            updateAndSave({ timeLeft: 0, status: 'finished' });
          } else {
            updateAndSave({ timeLeft: timeLeft - 1 });
          }
        },

        resetGame: () => set({
          status: 'idle',
          score: 0,
          masteryPoints: 0,
          currentState: null,
          remainingStates:[],
          missedStates: [],
          correctlyGuessedIds:[],
          userInput: '',
          lastGuessCorrect: null,
          lastSkippedState: null,
          totalToGuess: 0,
          isNewHighScore: false,
          streak: 0,
          options: [],
          hintLevel: 0,
        }),
      };
    },
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        highScores: state.highScores,
        savedGames: state.savedGames,
        difficulty: state.difficulty,
        advancedSettings: state.advancedSettings,
        autoZoom: state.autoZoom,
        soundEnabled: state.soundEnabled,
        gameView: state.gameView,
      }),
    }
  )
);
