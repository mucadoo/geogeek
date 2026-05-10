import fallbackData from '../../public/data/fallback-countries.json';

import { Country, RankingType } from '@/types';

let cachedCountries: Country[] | null = null;

async function fetchCountries(): Promise<Country[]> {
  if (cachedCountries) return cachedCountries;

  // During SSR/Build, use the imported fallback data
  if (typeof window === 'undefined') {
    cachedCountries = (fallbackData as unknown) as Country[];
    return cachedCountries;
  }

  // At runtime, use the internal API proxy
  const response = await fetch('/api/countries');
  if (!response.ok) throw new Error('Failed to fetch country data');
  
  cachedCountries = await response.json();
  return cachedCountries!;
}

export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    return await fetchCountries();
  },

  getCountryByIso: async (isoCode: string): Promise<Country | undefined> => {
    const countries = await fetchCountries();
    return countries.find(c => c.ISO_code.toUpperCase() === isoCode.toUpperCase());
  },

  getNeighbors: async (countryName: string): Promise<Country[]> => {
    const countries = await fetchCountries();
    const country = countries.find(c => c.name === countryName);
    if (!country) return [];

    // Simple heuristic: check if other countries are mentioned in the description
    // This is a naive approach; a better one would require a structured borders API
    const neighbors = countries.filter(c => 
      c.name !== country.name && 
      country.description.toLowerCase().includes(c.name.toLowerCase())
    );
    return neighbors;
  },

  getRankings: async (type: RankingType): Promise<{ country: string; value: number; isoCode: string; rank: number }[]> => {
    const countries = await fetchCountries();

    let prop: keyof Country;

    switch (type) {
      case 'Population': prop = 'population'; break;
      case 'Area': prop = 'area_km2'; break;
      case 'Density': prop = 'density_km2'; break;
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
        country: c.name,
        value: value,
        isoCode: c.ISO_code,
        rank: currentRank
      };
    });
  }
};
