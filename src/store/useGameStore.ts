import * as d3 from 'd3';
import { create } from 'zustand';

import { DIFFICULTY_MULTIPLIERS } from '@/config/gameConstants';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'name' | 'capital';

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
  gameMode: GameMode;
  capitalMap: Record<string, string>;
  score: number;
  timeLeft: number;
  currentState: StateFeature | null;
  remainingStates: StateFeature[];
  missedStates: StateFeature[];
  correctlyGuessedIds: string[];
  userInput: string;
  lastGuessCorrect: boolean | null;
  totalToGuess: number;
  
  startGame: (
    states: StateFeature[], 
    validNames: string[], 
    duration: number, 
    difficulty: Difficulty,
    gameMode?: GameMode,
    capitalMap?: Record<string, string>
  ) => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  resetGame: () => void;
}

const INITIAL_TIME = 300;

// Upgraded to strip out punctuation (.,-) so "st. paul" and "st paul" both work
const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,-]/g, "")
    .trim();
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

const ALIASES: Record<string, string[]> = {
  // Region Aliases
  "washington dc":["dc", "district of columbia"],
  "czechia": ["czech republic"],
  "united kingdom":["uk", "great britain"],
  // Capital Aliases
  "saint paul": ["st paul"],
  "kyiv": ["kiev"],
};

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  difficulty: 'medium',
  gameMode: 'name',
  capitalMap: {},
  score: 0,
  timeLeft: INITIAL_TIME,
  currentState: null,
  remainingStates: [],
  missedStates: [],
  correctlyGuessedIds:[],
  userInput: '',
  lastGuessCorrect: null,
  totalToGuess: 0,

  startGame: (states, validNames, duration, difficulty, gameMode = 'name', capitalMap = {}) => {
    const filtered = states.filter(s => {
      if (!s.properties.name) return false;
      return validNames.some(name => normalizeString(s.properties.name) === normalizeString(name));
    });

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    
    set({
      status: 'playing',
      difficulty,
      gameMode,
      capitalMap,
      score: 0,
      timeLeft: Math.floor(duration * difficultyMultiplier),
      remainingStates: shuffled.slice(1),
      currentState: shuffled[0] || null,
      missedStates: [],
      correctlyGuessedIds:[],
      userInput: '',
      lastGuessCorrect: null,
      totalToGuess: filtered.length,
    });
  },
  
  setUserInput: (userInput) => set({ userInput, lastGuessCorrect: null }),

  submitGuess: (guess) => {
    const { currentState, remainingStates, score, correctlyGuessedIds, gameMode, capitalMap } = get();
    if (!currentState) return false;

    const regionName = currentState.properties.name;
    
    // Check if we are guessing the region or its capital
    const targetAnswer = gameMode === 'capital' ? (capitalMap[regionName] || regionName) : regionName;

    const normalizedGuess = normalizeString(guess);
    const normalizedTarget = normalizeString(targetAnswer);
    const targetAliases = ALIASES[normalizedTarget] ||[];

    // Check guess against target and aliases
    const isCorrect = normalizedGuess === normalizedTarget || 
                      targetAliases.some(alias => normalizeString(alias) === normalizedGuess);

    if (isCorrect) {
      const newCorrectIds = [...correctlyGuessedIds, currentState.id];
      if (remainingStates.length === 0) {
        set({ status: 'finished', score: score + 1, currentState: null, userInput: '', lastGuessCorrect: true, correctlyGuessedIds: newCorrectIds });
      } else {
        const nextState = remainingStates[0];
        set({
          score: score + 1,
          currentState: nextState,
          remainingStates: remainingStates.slice(1),
          userInput: '',
          lastGuessCorrect: true,
          correctlyGuessedIds: newCorrectIds,
        });
      }
      return true;
    } else {
      set({ lastGuessCorrect: false });
      return false;
    }
  },

  skipState: () => {
    const { currentState, remainingStates, missedStates } = get();
    if (!currentState) return;
    
    const updatedRemaining =[...remainingStates, currentState];
    const newMissed = [...new Set([...missedStates, currentState])];
    
    if (updatedRemaining.length === 0) {
      set({ status: 'finished', currentState: null, userInput: '', lastGuessCorrect: null, missedStates: newMissed });
    } else {
      set({
        currentState: updatedRemaining[0],
        remainingStates: updatedRemaining.slice(1),
        userInput: '',
        lastGuessCorrect: null,
        missedStates: newMissed,
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
    totalToGuess: 0,
  }),
}));
