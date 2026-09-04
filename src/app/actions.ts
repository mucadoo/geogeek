'use server';

import { continentService } from '@/lib/continentService';
import { countryService } from '@/lib/countryService';
import { subdivisionService } from '@/lib/subdivisionService';
import { Continent, Country, RankingType, Subdivision } from '@/types';

export async function getCountryByIsoAction(isoCode: string): Promise<Country | null> {
  try {
    const country = await countryService.getCountryByIso(isoCode);
    return country || null;
  } catch {
    return null;
  }
}

export async function getAllCountriesAction(): Promise<Country[]> {
  try {
    return await countryService.getAllCountries();
  } catch {
    return [];
  }
}

export async function getRankingsAction(type: RankingType, locale: string = 'en') {
  try {
    return await countryService.getRankings(type, locale);
  } catch {
    return [];
  }
}

export async function getNeighborsAction(countryName: string, locale: string = 'en') {
  try {
    return await countryService.getNeighbors(countryName, locale);
  } catch {
    return [];
  }
}

export async function getSubdivisionByCodeAction(code: string): Promise<Subdivision | null> {
  try {
    const subdivision = await subdivisionService.getSubdivisionByCode(code);
    return subdivision || null;
  } catch {
    return null;
  }
}

export async function getSubdivisionFlagsAction(
  codes: string[]
): Promise<Record<string, string | null>> {
  try {
    const subs = await subdivisionService.getSubdivisionsByCodes(codes);
    return Object.fromEntries(subs.map((s) => [s.code, s.flagUrl]));
  } catch {
    return {};
  }
}

export async function listSubdivisionsByCountryAction(isoCode: string): Promise<Subdivision[]> {
  try {
    return await subdivisionService.listSubdivisionsByCountry(isoCode);
  } catch {
    return [];
  }
}

export async function listChildSubdivisionsAction(parentCode: string): Promise<Subdivision[]> {
  try {
    return await subdivisionService.listChildSubdivisions(parentCode);
  } catch {
    return [];
  }
}

export async function getContinentByCodeAction(code: string): Promise<Continent | null> {
  try {
    const continent = await continentService.getContinentByCode(code);
    return continent || null;
  } catch {
    return null;
  }
}

export async function listContinentsAction(): Promise<Continent[]> {
  try {
    return await continentService.getAllContinents();
  } catch {
    return [];
  }
}
