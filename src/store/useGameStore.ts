import { create } from 'zustand';
import * as d3 from 'd3';
import { DIFFICULTY_MULTIPLIERS } from '@/config/gameConstants';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type Difficulty = 'easy' | 'medium' | 'hard';

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
  score: number;
  timeLeft: number;
  currentState: StateFeature | null;
  remainingStates: StateFeature[];
  missedStates: StateFeature[];
  correctlyGuessedIds: string[];
  userInput: string;
  lastGuessCorrect: boolean | null;
  totalToGuess: number;
  
  startGame: (states: StateFeature[], validNames: string[], duration: number, difficulty: Difficulty) => void;
  submitGuess: (guess: string) => boolean;
  skipState: () => void;
  tick: () => void;
  setUserInput: (input: string) => void;
  resetGame: () => void;
}

const INITIAL_TIME = 300;

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export const getFeedback = (score: number, total: number): string => {
  if (total === 0) return "Keep practicing!";
  const percentage = (score / total) * 100;
  if (percentage === 100) return "Perfect! You're a geography master!";
  if (percentage > 80) return "Amazing job! Almost perfect!";
  if (percentage > 50) return "Good work! You know your way around!";
  return "Keep practicing, you'll get there!";
};

const ALIASES: Record<string, string[]> = {
  "sardegna": ["sardinia"],
  "sicilia": ["sicily"],
  "toscana": ["tuscany"],
  "piemonte": ["piedmont"],
  "lombardia": ["lombardy"],
  "puglia": ["apulia"],
  "valle d'aosta": ["aosta valley", "aosta"],
  "trentino-alto adige": ["south tyrol", "trentino"],
  "provence-alpes-cote d'azur": ["cote dazur", "paca", "provence"],
  "distrito federal": ["df"],
  "friuli-venezia giulia": ["friuli"],
  "emilia-romagna": ["emilia", "romagna"],
  "corse": ["corsica"],
  "bretagne":["brittany"],
  "bourgogne-franche-comte":["bourgogne", "burgundy", "franche-comte"],
  "centre-val de loire": ["centre", "val de loire"],
  "nouvelle-aquitaine": ["aquitaine"],
  "grand est":["alsace-champagne-ardenne-lorraine"],
  "hauts-de-france":["nord-pas-de-calais-picardie"],
  "washington dc": ["dc", "district of columbia"],
  "australian capital territory": ["act"],
  "northern territory": ["nt"],
  "newfoundland and labrador": ["newfoundland", "labrador"],
  "british columbia": ["bc"],
  "prince edward island": ["pei"],
  "northwest territories": ["nwt"]
};

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  difficulty: 'medium',
  score: 0,
  timeLeft: INITIAL_TIME,
  currentState: null,
  remainingStates: [],
  missedStates:[],
  correctlyGuessedIds:[],
  userInput: '',
  lastGuessCorrect: null,
  totalToGuess: 0,

  startGame: (states, validNames, duration, difficulty) => {
    const filtered = states
      .map(s => {
        // Highcharts maps sometimes put the name in 'name' or 'Name' 
        // or a specific property like 'woe-name'
        const properties = s.properties as Record<string, string>;
        const name = properties.name || properties.Name || properties['hc-a2'] || "";
        
        return {
          ...s,
          id: s.id ? String(s.id) : name, // Use name as ID if ID is missing
          properties: {
            ...s.properties,
            name: name // Normalize name location
          }
        };
      })
      .filter(s => {
        if (!s.properties.name) return false;
        return validNames.some(name => normalizeString(s.properties.name) === normalizeString(name));
      });
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
    set({
      status: 'playing',
      difficulty,
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
    const { currentState, remainingStates, score, correctlyGuessedIds } = get();
    if (!currentState) return false;

    const normalizedGuess = normalizeString(guess);
    const targetName = currentState.properties.name;
    const normalizedTarget = normalizeString(targetName);
    
    const targetAliases = ALIASES[normalizedTarget] || [];

    if (
      normalizedGuess === normalizedTarget || 
      targetAliases.includes(normalizedGuess)
    ) {
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
