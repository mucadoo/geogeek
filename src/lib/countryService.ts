import { WikiGeoClient, Country } from '@mucadoo/wiki-geo-data';

import { RankingType } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

let cachedCountries: Country[] | null = null;

async function fetchCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;
  cachedCountries = await client.listCountries();
  return cachedCountries;
}

export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    return await fetchCountries();
  },

  getCountryByIso: async (isoCode: string): Promise<Country | undefined> => {
    try {
      return await client.getCountry(isoCode);
    } catch {
      const countries = await fetchCountries();
      return countries.find(c => c.isoCode.toUpperCase() === isoCode.toUpperCase());
    }
  },

  getNeighbors: async (countryName: string, locale: string = 'en'): Promise<Country[]> => {
    const countries = await fetchCountries();
    const country = countries.find(c => 
      c.name[locale as keyof Country['name']] === countryName || 
      c.name.en === countryName
    );
    if (!country) return [];

    const description = (country.description[locale as keyof Country['description']] || country.description.en).toLowerCase();
    
    const neighbors = countries.filter(c => {
      const name = (c.name[locale as keyof Country['name']] || c.name.en).toLowerCase();
      return name !== (country.name[locale as keyof Country['name']] || country.name.en).toLowerCase() && 
             description.includes(name);
    });
    return neighbors;
  },

  getRankings: async (type: RankingType, locale: string = 'en'): Promise<{ country: string; value: number; isoCode: string; rank: number }[]> => {
    const countries = await fetchCountries();

    let prop: keyof Country;

    switch (type) {
      case 'Population': prop = 'population'; break;
      case 'Area': prop = 'areaKm2'; break;
      case 'Density': prop = 'densityKm2'; break;
      case 'HDI': prop = 'hdi'; break;
      case 'GDP': prop = 'gdp'; break;
      default: prop = 'population';
    }

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
        country: (c.name[locale as keyof Country['name']] || c.name.en) as string,
        value: value,
        isoCode: c.isoCode,
        rank: currentRank
      };
    });
  }
};
