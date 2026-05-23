'use server';

import { countryService } from '@/lib/countryService';
import { Country, RankingType } from '@/types';

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
