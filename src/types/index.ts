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

export interface Country {
  ISO_code: string;
  name: string;
  flagUrl: string;
  description: string;
  capital: string;
  largest_city: string;
  population: number;
  area_km2: number;
  density_km2: number;
  government: string;
  official_language: string;
  demonym: string;
  GDP: number;
  HDI: number;
  currency: string;
  time_zone: string;
  calling_code: string;
  internet_TLD: string;
}

export type RankingType = 'Population' | 'Area' | 'Density' | 'HDI';

export interface RankingConfig {
  title: RankingType;
  slug: string;
}
