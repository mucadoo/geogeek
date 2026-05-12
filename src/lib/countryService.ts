import 'server-only';
import { WikiGeoClient, Country } from '@mucadoo/wiki-geo-data';

import { RankingType } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    const response = await client.getFullDatabase();
    return response.data;
  },

  getCountryByIso: async (isoCode: string): Promise<Country | undefined> => {
    const response = await client.getCountry(isoCode);
    return response?.data;
  },

  getNeighbors: async (countryName: string, locale: string = 'en'): Promise<Country[]> => {
    const response = await client.getFullDatabase();
    const countries = response.data;
    const country = countries.find(c => 
      c.name[locale as keyof Country['name']] === countryName || 
      c.name.en === countryName
    );
    if (!country || !country.description) return [];

    const description = (country.description[locale as keyof Country['description']] || country.description.en || '').toLowerCase();
    
    return countries.filter(c => {
      const name = ((c.name && (c.name[locale as keyof Country['name']] || c.name.en)) || '').toLowerCase();
      return name !== ((country.name && (country.name[locale as keyof Country['name']] || country.name.en)) || '').toLowerCase() && 
             description.includes(name);
    });
  },

  getRankings: async (type: RankingType, locale: string = 'en'): Promise<{ country: string; value: number; isoCode: string; rank: number }[]> => {
    const response = await client.getFullDatabase();
    const countries = response.data;

    const propMap: Record<RankingType, keyof Country> = {
      'Population': 'population',
      'Area': 'areaKm2',
      'Density': 'densityKm2',
      'HDI': 'hdi',
      'GDP': 'gdp'
    };

    const prop = propMap[type] || 'population';

    const sorted = [...countries].sort((a, b) => {
      const valA = Number(a[prop]);
      const valB = Number(b[prop]);

      if (isNaN(valA) && isNaN(valB)) return 0;
      if (isNaN(valA)) return 1;
      if (isNaN(valB)) return -1;

      return valB - valA;
    });

    let currentRank = 1;
    let previousValue: number | undefined = undefined;

    return sorted.map((c, index) => {
      const value = Number(c[prop]);

      if (index > 0 && value !== previousValue) {
        currentRank = index + 1;
      }
      previousValue = value;

      return {
        country: ((c.name && (c.name[locale as keyof Country['name']] || c.name.en)) || '') as string,
        value: value,
        isoCode: c.isoCode || '',
        rank: currentRank
      };
    });
  }
};
