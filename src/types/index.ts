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
  HDI = 'hdi',
  GDP = 'gdp',
  GDP_PER_CAPITA = 'gdp-per-capita',
  LIFE_EXPECTANCY = 'life-expectancy',
  INTERNET_USAGE = 'internet-usage',
  UNEMPLOYMENT_RATE = 'unemployment-rate'
}

export interface LocalizedString {
  en: string;
  pt: string;
  es: string;
  fr: string;
  it: string;
  de: string;
  ja: string;
  zh: string;
  ru: string;
}

export interface LinkedValue {
  articleId: string | null;
  name: LocalizedString;
  isoCode?: string | null;
}

export interface GovernmentLeader {
  title: string;
  name: string;
  articleId: string | null;
}

// Flat, locale-keyed shape countryService.buildCountry() normalizes every
// wiki-geo-data record into - the app never touches the SDK's raw Country
// type directly. See countryService.ts for how each field is derived.
export interface Country {
  isoCode: string;
  cca3: string;
  continent: string | null;
  isoNumeric: string | null;
  borders: LinkedValue[];
  subdivisionCodes: string[];
  name: LocalizedString;
  capital: LocalizedString;
  capitalCoordinates: { lat: number; lng: number } | null;
  flagUrl: string;
  areaKm2: number;
  population: number;
  populationYear: number | null;
  densityKm2: number;
  officialLanguage: { en: string };
  demonym: { en: string };
  currency: { en: string };
  timeZone: { en: string };
  callingCode: { en: string };
  internetTld: string[];
  gdp: number | null;
  gdpPerCapita: number | null;
  gdpPpp: number | null;
  gdpPerCapitaPpp: number | null;
  gdpYear: number | null;
  hdi: number | null;
  lifeExpectancy: number | null;
  internetUsagePercent: number | null;
  unemploymentRate: number | null;
  drivingSide: 'left' | 'right' | null;
  motto: string | null;
  anthem: string | null;
  description: LocalizedString;
  government: LinkedValue[];
  governmentLeaders: GovernmentLeader[];
  largestCity: LinkedValue[];
}

// Flat, locale-keyed shape subdivisionService.buildSubdivision() normalizes
// every wiki-geo-data subdivision record into. Mirrors how `Country` flattens
// the SDK's raw type. `code` is the ISO 3166-2 code (e.g. "US-CA").
export interface SubdivisionBorder {
  code: string | null;
  name: LocalizedString;
}

export interface Subdivision {
  code: string;
  wikidataId: string | null;
  countryIsoCode: string;
  name: LocalizedString;
  type: LocalizedString;
  typeEn: string | null;
  flagUrl: string | null;
  description: LocalizedString;
  capital: LocalizedString;
  capitalCoordinates: { lat: number; lng: number } | null;
  coordinates: { lat: number; lng: number } | null;
  population: number | null;
  populationYear: number | null;
  areaKm2: number | null;
  densityKm2: number | null;
  officialLanguage: { en: string };
  borders: SubdivisionBorder[];
}

export type RankingType =
  | 'Population' | 'Area' | 'Density' | 'HDI' | 'GDP'
  | 'GDPPerCapita' | 'LifeExpectancy' | 'InternetUsage' | 'UnemploymentRate';

export interface RankingConfig {
  title: RankingType;
  slug: string;
}
