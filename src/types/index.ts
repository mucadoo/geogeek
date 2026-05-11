export enum GameCategory {
  ALL = 'all',
  CONTINENTS = 'continents',
  REGIONS = 'regions',
  CAPITALS = 'capitals'
}

export enum RankingCategory {
  POPULATION = 'population',
  AREA = 'area',
  DENSITY = 'density',
  HDI = 'hdi'
}

export interface LocalizedString {
  en: string;
  pt?: string;
  es?: string;
  fr?: string;
  it?: string;
}

export interface LinkedValue {
  articleId?: string;
  name: LocalizedString;
}

export interface Country {
  isoCode: string;
  name: LocalizedString;
  flagUrl: string;
  description: LocalizedString;
  capital: LinkedValue[];
  largestCity: LinkedValue[];
  population: number;
  areaKm2: number;
  densityKm2: number;
  government: LinkedValue[];
  officialLanguage: LinkedValue[];
  demonym: LinkedValue[];
  gdp: number;
  hdi: number;
  currency: LinkedValue[];
  timeZone: LinkedValue[];
  callingCode: string[];
  internetTld: string[];
}

export type RankingType = 'Population' | 'Area' | 'Density' | 'HDI' | 'GDP';

export interface RankingConfig {
  title: RankingType;
  slug: string;
}
