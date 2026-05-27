import * as d3 from 'd3';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { ALIASES } from '@/config/aliases';
import { DIFFICULTY_MULTIPLIERS } from '@/config/gameConstants';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'name' | 'capital' | 'flag';
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
  strictMode: boolean;
  gameMode: GameMode;
  gameType: GameType;
  isMultipleChoice: boolean;
  options: string[];
  currentGameKey: string;
  capitalMap: Record<string, string>;
  score: number;
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
    duration: number, 
    difficulty: Difficulty,
    gameKey: string,
    gameMode?: GameMode,
    capitalMap?: Record<string, string>,
    gameType?: GameType,
    isMultipleChoice?: boolean
  ) => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  setStrictMode: (enabled: boolean) => void;
  setAutoZoom: (enabled: boolean) => void;
  resetGame: () => void;
}

const INITIAL_TIME = 300;
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
      strictMode: false,
      gameMode: 'name',
      gameType: 'standard',
      isMultipleChoice: false,
      options: [],
      currentGameKey: '',
      capitalMap: {},
      score: 0,
      timeLeft: INITIAL_TIME,
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

      startGame: (states, validNames, duration, difficulty, gameKey, gameMode = 'name', capitalMap = {}, gameType = 'standard', isMultipleChoice = false) => {
        const filtered = states.filter(s => {
          if (!s.properties.name) return false;
          return validNames.some(name => normalizeString(s.properties.name) === normalizeString(name));
        });

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
        
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
          strictMode: difficulty === 'hard',
          gameMode,
          gameType,
          isMultipleChoice,
          options: initialOptions,
          currentGameKey: gameKey,
          capitalMap,
          score: 0,
          timeLeft: gameType === 'survival' ? SURVIVAL_START_TIME : Math.floor(duration * difficultyMultiplier),
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
      setStrictMode: (strictMode) => set({ strictMode }),
      setAutoZoom: (autoZoom) => set({ autoZoom }),

      submitGuess: (guess) => {
        const { currentState, remainingStates, score, correctlyGuessedIds, gameMode, capitalMap, strictMode, currentGameKey, highScores, gameType, timeLeft, isMultipleChoice } = get();
        if (!currentState) return false;

        const regionName = currentState.properties.name;
        const targetAnswer = gameMode === 'capital' ? (capitalMap[regionName] || regionName) : regionName;

        const normalizedGuess = normalizeString(guess);
        const normalizedTarget = normalizeString(targetAnswer);
        const targetAliases = (ALIASES[normalizedTarget] || []).map(normalizeString);

        const checkMatch = (target: string) => {
          if (strictMode) return normalizedGuess === target;
          return normalizedGuess === target || isFuzzyMatch(normalizedGuess, target);
        };

        const isCorrect = checkMatch(normalizedTarget) || targetAliases.some(checkMatch);

        if (isCorrect) {
          const newCorrectIds = [...correctlyGuessedIds, currentState.id];
          const newScore = score + 1;
          const isFinished = remainingStates.length === 0;
          const newTime = gameType === 'survival' ? timeLeft + SURVIVAL_BONUS : timeLeft;

          if (isFinished) {
            const oldHighScore = highScores[currentGameKey] || 0;
            const isHighScore = newScore > oldHighScore;
            set({ 
              status: 'finished', 
              score: newScore, 
              currentState: null, 
              userInput: '', 
              lastGuessCorrect: true, 
              lastSkippedState: null, 
              correctlyGuessedIds: newCorrectIds,
              highScores: isHighScore ? { ...highScores, [currentGameKey]: newScore } : highScores,
              isNewHighScore: isHighScore,
              timeLeft: newTime
            });
          } else {
            const nextState = remainingStates[0];
            let nextOptions: string[] = [];
            
            if (isMultipleChoice) {
              const correct = gameMode === 'capital' ? (capitalMap[nextState.properties.name] || nextState.properties.name) : nextState.properties.name;
              // Mix from remaining and correct to ensure unique options
              const allPossibleOptions = [...remainingStates.map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name), 
                                          ...correctlyGuessedIds.map(_id => {
                                            // This is a bit inefficient but for small sets it's fine
                                            return ""; // Fallback
                                          })].filter(o => o && normalizeString(o) !== normalizeString(correct));
              
              nextOptions = [correct, ...allPossibleOptions.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
            }

            set({
              score: newScore,
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
        const { currentState, remainingStates, missedStates, gameType, timeLeft, isMultipleChoice, gameMode, capitalMap } = get();
        if (!currentState) return;
        
        const updatedRemaining =[...remainingStates, currentState];
        const newMissed = [...new Set([...missedStates, currentState])];
        const newTime = gameType === 'survival' ? Math.max(0, timeLeft - SURVIVAL_PENALTY) : timeLeft;

        if (newTime === 0 && gameType === 'survival') {
          set({ status: 'finished', timeLeft: 0, missedStates: newMissed });
          return;
        }
        
        const nextState = updatedRemaining[0];
        let nextOptions: string[] = [];
        if (isMultipleChoice) {
          const correct = gameMode === 'capital' ? (capitalMap[nextState.properties.name] || nextState.properties.name) : nextState.properties.name;
          const others = updatedRemaining.filter(s => s.id !== nextState.id)
            .map(s => gameMode === 'capital' ? (capitalMap[s.properties.name] || s.properties.name) : s.properties.name);
          nextOptions = [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
        }

        if (updatedRemaining.length === 0) {
          set({ status: 'finished', currentState: null, userInput: '', lastGuessCorrect: null, lastSkippedState: null, missedStates: newMissed, timeLeft: newTime });
        } else {
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
        }
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
      partialize: (state) => ({ highScores: state.highScores }),
    }
  )
);
