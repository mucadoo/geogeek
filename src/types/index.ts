import { Country as SDKCountry } from '@mucadoo/wiki-geo-data';

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

export type LocalizedString = SDKCountry['name'];

export interface LinkedValue {
  articleId: string | null;
  name: LocalizedString;
}

export type Country = SDKCountry;

export type RankingType = 'Population' | 'Area' | 'Density' | 'HDI' | 'GDP';

export interface RankingConfig {
  title: RankingType;
  slug: string;
}
