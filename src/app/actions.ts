'use server';
import { WikiGeoClient, Country } from '@mucadoo/wiki-geo-data';

import { countryService } from '@/lib/countryService';
import { RankingType } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

export async function getCountryByIsoAction(isoCode: string): Promise<Country | null> {
  try {
    const response = await client.getCountry(isoCode);
    return response.data;
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
