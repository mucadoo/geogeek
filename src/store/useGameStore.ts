import { create } from 'zustand';
import * as d3 from 'd3';

export type GameStatus = 'idle' | 'playing' | 'finished';

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
  score: number;
  timeLeft: number;
  currentState: StateFeature | null;
  remainingStates: StateFeature[];
  missedStates: StateFeature[];
  correctlyGuessedIds: string[];
  userInput: string;
  lastGuessCorrect: boolean | null;
  totalToGuess: number;
  
  // Actions
  startGame: (states: StateFeature[], validNames: string[]) => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  resetGame: () => void;
}

const INITIAL_TIME = 300; // 5 minutes

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  score: 0,
  timeLeft: INITIAL_TIME,
  currentState: null,
  remainingStates: [],
  missedStates: [],
  correctlyGuessedIds: [],
  userInput: '',
  lastGuessCorrect: null,
  totalToGuess: 0,

  startGame: (states, validNames) => {
    const filtered = states.filter(s => 
      validNames.some(name => s.properties.name.toLowerCase() === name.toLowerCase())
    );
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    set({
      status: 'playing',
      score: 0,
      timeLeft: INITIAL_TIME,
      remainingStates: shuffled.slice(1),
      currentState: shuffled[0],
      missedStates: [],
      correctlyGuessedIds: [],
      userInput: '',
      lastGuessCorrect: null,
      totalToGuess: filtered.length,
    });
  },

  setUserInput: (userInput) => set({ userInput, lastGuessCorrect: null }),

  submitGuess: (guess) => {
    const { currentState, remainingStates, score, correctlyGuessedIds } = get();
    if (!currentState) return false;

    const isCorrect = guess.trim().toLowerCase() === currentState.properties.name.toLowerCase();

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
    const newMissed = currentState ? [...missedStates, currentState] : missedStates;
    
    if (remainingStates.length === 0) {
      set({ status: 'finished', currentState: null, userInput: '', missedStates: newMissed, lastGuessCorrect: null });
    } else {
      set({
        currentState: remainingStates[0],
        remainingStates: remainingStates.slice(1),
        userInput: '',
        missedStates: newMissed,
        lastGuessCorrect: null,
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
    timeLeft: INITIAL_TIME,
    currentState: null,
    remainingStates: [],
    userInput: '',
  }),
}));
