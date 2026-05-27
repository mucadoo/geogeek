import * as d3 from 'd3';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { ALIASES } from '@/config/aliases';
import { POINTS_MULTIPLIERS, AdvancedSettings, Difficulty as ConfigDifficulty } from '@/config/gameConstants';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type Difficulty = ConfigDifficulty;
export type GameMode = 'name' | 'capital' | 'flag' | 'reverse';
export type GameType = 'standard' | 'survival';

export interface StateFeature {
  id: string;
  properties: {
    name: string;
  };
  type: 'Feature';
  geometry: d3.GeoGeometryObjects;
}

interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  advancedSettings: AdvancedSettings;
  gameMode: GameMode;
  options: string[];
  currentGameKey: string;
  capitalMap: Record<string, string>;
  score: number;
  masteryPoints: number;
  currentMultiplier: number;
  timeLeft: number;
  highScores: Record<string, number>;
  currentState: StateFeature | null;
  remainingStates: StateFeature[];
  missedStates: StateFeature[];
  correctlyGuessedIds: string[];
  userInput: string;
  lastGuessCorrect: boolean | null;
  lastSkippedState: StateFeature | null;
  isNewHighScore: boolean;
  totalToGuess: number;
  autoZoom: boolean;
  
  startGame: (
    states: StateFeature[], 
    validNames: string[], 
    difficulty: Difficulty,
    advancedSettings: AdvancedSettings,
    gameKey: string,
    gameMode?: GameMode,
    capitalMap?: Record<string, string>
  ) => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  setAutoZoom: (enabled: boolean) => void;
  resetGame: () => void;
}

const SURVIVAL_START_TIME = 15;
const SURVIVAL_BONUS = 3;
const SURVIVAL_PENALTY = 5;

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,-]/g, "")
    .trim();
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

export const getFeedback = (score: number, total: number): string => {
  if (total === 0) return "practice";
  const percentage = (score / total) * 100;
  if (percentage === 100) return "perfect";
  if (percentage > 80) return "amazing";
  if (percentage > 50) return "great";
  if (percentage > 20) return "good";
  return "practice";
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      difficulty: 'medium',
      advancedSettings: {
        isMultipleChoice: false,
        gameType: 'standard',
        strictMatching: false,
        noMapHints: false,
        hideBorders: false,
        timePerGuess: 20,
      },
      gameMode: 'name',
      options: [],
      currentGameKey: '',
      capitalMap: {},
      score: 0,
      masteryPoints: 0,
      currentMultiplier: 1,
      timeLeft: 0,
      highScores: {},
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

      startGame: (states, validNames, difficulty, advancedSettings, gameKey, gameMode = 'name', capitalMap = {}) => {
        const filtered = states.filter(s => {
          if (!s.properties.name) return false;
          return validNames.some(name => normalizeString(s.properties.name) === normalizeString(name));
        });

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);

        // --- THE COMPLEX MULTIPLIER MATH ---
        const { isMultipleChoice, gameType, strictMatching, noMapHints, hideBorders, timePerGuess } = advancedSettings;
        
        let m = 1.0;
        m *= isMultipleChoice ? POINTS_MULTIPLIERS.input.choice : POINTS_MULTIPLIERS.input.typing;
        m *= (gameType === 'survival') ? POINTS_MULTIPLIERS.mode.survival : POINTS_MULTIPLIERS.mode.standard;
        
        if (!isMultipleChoice && strictMatching) m *= POINTS_MULTIPLIERS.settings.strictMatching;
        if (noMapHints) m *= POINTS_MULTIPLIERS.settings.noMapHints;
        if (hideBorders) m *= POINTS_MULTIPLIERS.settings.hideBorders;
        
        // Time pressure multiplier: 20s is base (1x). 
        // If 10s -> 2x. If 40s -> 0.5x.
        const timeFactor = 20 / timePerGuess;
        m *= timeFactor;

        const totalMultiplier = Number(m.toFixed(2));
        
        const firstState = shuffled[0] || null;
        let initialOptions: string[] = [];
        
        if (isMultipleChoice && firstState) {
          const correct = gameMode === 'capital' ? (capitalMap[firstState.properties.name] || firstState.properties.name) : firstState.properties.name;
          const others = shuffled.filter(s => s.id !== firstState.id)
            .map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name);
          
          initialOptions = [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
        }

        set({
          status: 'playing',
          difficulty,
          advancedSettings,
          gameMode,
          options: initialOptions,
          currentGameKey: gameKey,
          capitalMap,
          score: 0,
          masteryPoints: 0,
          currentMultiplier: totalMultiplier,
          timeLeft: gameType === 'survival' ? SURVIVAL_START_TIME : Math.floor(filtered.length * timePerGuess),
          remainingStates: shuffled.slice(1),
          currentState: firstState,
          missedStates: [],
          correctlyGuessedIds: [],
          userInput: '',
          lastGuessCorrect: null,
          lastSkippedState: null,
          isNewHighScore: false,
          totalToGuess: filtered.length,
        });
      },
      
      setUserInput: (userInput) => set({ userInput, lastGuessCorrect: null, lastSkippedState: null }),
      setAutoZoom: (autoZoom) => set({ autoZoom }),

      submitGuess: (guess) => {
        const { currentState, remainingStates, score, correctlyGuessedIds, gameMode, capitalMap, currentGameKey, highScores, timeLeft, currentMultiplier, advancedSettings } = get();
        if (!currentState) return false;

        const regionName = currentState.properties.name;
        const targetAnswer = gameMode === 'capital' ? (capitalMap[regionName] || regionName) : regionName;

        const normalizedGuess = normalizeString(guess);
        const normalizedTarget = normalizeString(targetAnswer);
        const targetAliases = (ALIASES[normalizedTarget] || []).map(normalizeString);

        const checkMatch = (target: string) => {
          if (advancedSettings.strictMatching) return normalizedGuess === target;
          return normalizedGuess === target || isFuzzyMatch(normalizedGuess, target);
        };

        const isCorrect = checkMatch(normalizedTarget) || targetAliases.some(checkMatch);

        if (isCorrect) {
          const newCorrectIds = [...correctlyGuessedIds, currentState.id];
          const newScore = score + 1;
          const newPoints = Math.round(newScore * currentMultiplier * 10); 
          
          const isFinished = remainingStates.length === 0;
          const newTime = advancedSettings.gameType === 'survival' ? timeLeft + SURVIVAL_BONUS : timeLeft;

          if (isFinished) {
            const oldHighScore = highScores[currentGameKey] || 0;
            const isHighScore = newPoints > oldHighScore;
            set({ 
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
              timeLeft: newTime
            });
          } else {
            const nextState = remainingStates[0];
            let nextOptions: string[] = [];
            
            if (advancedSettings.isMultipleChoice) {
              const correct = gameMode === 'capital' ? (capitalMap[nextState.properties.name] || nextState.properties.name) : nextState.properties.name;
              const allPossibleOptions = [...remainingStates.map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name)].filter(o => o && normalizeString(o) !== normalizeString(correct));
              nextOptions = [correct, ...allPossibleOptions.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
            }

            set({
              score: newScore,
              masteryPoints: newPoints,
              currentState: nextState,
              remainingStates: remainingStates.slice(1),
              userInput: '',
              lastGuessCorrect: true,
              lastSkippedState: null,
              correctlyGuessedIds: newCorrectIds,
              timeLeft: newTime,
              options: nextOptions
            });
          }
          return true;
        } else {
          set({ lastGuessCorrect: false, lastSkippedState: null });
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
          set({ status: 'finished', timeLeft: 0, missedStates: newMissed });
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

        set({
          currentState: nextState,
          remainingStates: updatedRemaining.slice(1),
          userInput: '',
          lastGuessCorrect: null,
          lastSkippedState: currentState,
          missedStates: newMissed,
          timeLeft: newTime,
          options: nextOptions
        });
      },

      tick: () => {
        const { timeLeft, status } = get();
        if (status !== 'playing') return;
        
        if (timeLeft <= 1) {
          set({ timeLeft: 0, status: 'finished' });
        } else {
          set({ timeLeft: timeLeft - 1 });
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
        options: []
      }),
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        highScores: state.highScores,
        difficulty: state.difficulty,
        advancedSettings: state.advancedSettings,
        autoZoom: state.autoZoom,
      }),
    }
  )
);
