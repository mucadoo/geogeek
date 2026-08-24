export const TIME_PER_STATE_SECONDS = 20;

// Blitz is a fixed-time sprint (see useGameStore's startGame/tick) rather
// than the per-item budget standard/survival modes use.
export const BLITZ_DURATION_SECONDS = 60;

export type Difficulty = 'very-easy' | 'easy' | 'medium' | 'hard' | 'blazing' | 'blitz' | 'custom';

export const POINTS_MULTIPLIERS = {
  input: {
    choice: 1,
    typing: 1.5,
  },
  mode: {
    standard: 1,
    survival: 1.3,
    blitz: 1.5,
  },
  settings: {
    strictMatching: 1.2,
    noMapHints: 1.5,
    hideBorders: 1.25,
  }
};

export interface AdvancedSettings {
  isMultipleChoice: boolean;
  gameType: 'standard' | 'survival' | 'blitz';
  strictMatching: boolean;
  noMapHints: boolean;
  hideBorders: boolean;
  timePerGuess: number; // in seconds
  /** Whether the in-game Hint button (progressive letter clue -> fun fact) is offered at all. */
  hints: boolean;
}

export const PRESETS: Record<Exclude<Difficulty, 'custom'>, AdvancedSettings> = {
  'very-easy': {
    isMultipleChoice: true,
    gameType: 'standard',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 60,
    hints: true,
  },
  easy: {
    isMultipleChoice: true,
    gameType: 'standard',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 30,
    hints: true,
  },
  medium: {
    isMultipleChoice: false,
    gameType: 'standard',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 20,
    hints: true,
  },
  hard: {
    isMultipleChoice: false,
    gameType: 'survival',
    strictMatching: true,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 15,
    hints: false,
  },
  blazing: {
    isMultipleChoice: false,
    gameType: 'survival',
    strictMatching: true,
    noMapHints: true,
    hideBorders: true,
    timePerGuess: 5,
    hints: false,
  },
  blitz: {
    isMultipleChoice: false,
    gameType: 'blitz',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 10,
    hints: false,
  },
};

export const GAME_DURATIONS: Record<string, number> = {
  US_STATES: 50 * TIME_PER_STATE_SECONDS,
  BRAZIL_STATES: 28 * TIME_PER_STATE_SECONDS,
  ITALY_REGIONS: 28 * TIME_PER_STATE_SECONDS,
  FRANCE_REGIONS: 23 * TIME_PER_STATE_SECONDS,
  CANADA_PROVINCES: 13 * TIME_PER_STATE_SECONDS,
  AUSTRALIA_STATES: 8 * TIME_PER_STATE_SECONDS,
};
