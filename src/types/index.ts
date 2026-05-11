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
  iso_code: string;
  name: LocalizedString;
  flagUrl: string;
  description: LocalizedString;
  capital: LinkedValue[];
  largest_city: LinkedValue[];
  population: number;
  area_km2: number;
  density_km2: number;
  government: LinkedValue[];
  official_language: LinkedValue[];
  demonym: LinkedValue[];
  gdp: number;
  hdi: number;
  currency: LinkedValue[];
  time_zone: LinkedValue[];
  calling_code: string[];
  internet_TLD: string[];
}

export type RankingType = 'Population' | 'Area' | 'Density' | 'HDI' | 'GDP';

export interface RankingConfig {
  title: RankingType;
  slug: string;
}
