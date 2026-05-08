import { Country, RankingType } from '@/types';
import fallbackData from '../../public/data/fallback-countries.json';

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

  getRankings: async (type: RankingType): Promise<{ country: string; value: string | number; isoCode: string }[]> => {
    const countries = await fetchCountries();

    const parseValue = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? -Infinity : parsed;
      }
      return -Infinity;
    };

    let prop: keyof Country;
    let desc = true;

    switch (type) {
      case 'Most populous countries': prop = 'population'; break;
      case 'Less populous countries': prop = 'population'; desc = false; break;
      case 'Larger countries': prop = 'area_km2'; break;
      case 'Smaller countries': prop = 'area_km2'; desc = false; break;
      case 'Most populated countries': prop = 'density_km2'; break;
      case 'Less populated countries': prop = 'density_km2'; desc = false; break;
      case 'Highest HDI': prop = 'HDI'; break;
      case 'Lowest HDI': prop = 'HDI'; desc = false; break;
    }

    const sorted = [...countries].sort((a, b) => {
      const valA = parseValue(a[prop]);
      const valB = parseValue(b[prop]);

      // Move invalid values (-Infinity) to the bottom
      if (valA === -Infinity) return 1;
      if (valB === -Infinity) return -1;

      return desc ? valB - valA : valA - valB;
    });

    return sorted.slice(0, 10).map(c => ({
      country: c.name,
      value: c[prop] as string | number,
      isoCode: c.ISO_code
    }));
  }
};
