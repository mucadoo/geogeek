export const TIME_PER_STATE_SECONDS = 20;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';

export const POINTS_MULTIPLIERS = {
  input: {
    choice: 1,
    typing: 1.5,
  },
  mode: {
    standard: 1,
    survival: 1.3,
  },
  settings: {
    strictMatching: 1.2,
    noMapHints: 1.5,
    hideBorders: 1.25,
  }
};

export interface AdvancedSettings {
  isMultipleChoice: boolean;
  gameType: 'standard' | 'survival';
  strictMatching: boolean;
  noMapHints: boolean;
  hideBorders: boolean;
  timePerGuess: number; // in seconds
}

export const PRESETS: Record<'easy' | 'medium' | 'hard', AdvancedSettings> = {
  easy: {
    isMultipleChoice: true,
    gameType: 'standard',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 30,
  },
  medium: {
    isMultipleChoice: false,
    gameType: 'standard',
    strictMatching: false,
    noMapHints: false,
    hideBorders: false,
    timePerGuess: 20,
  },
  hard: {
    isMultipleChoice: false,
    gameType: 'survival',
    strictMatching: true,
    noMapHints: true,
    hideBorders: true,
    timePerGuess: 10,
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
