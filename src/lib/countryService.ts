import 'server-only';
import { Country, RankingType } from '@/types';

const fetchInternalCountries = async (): Promise<Country[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/countries`, { next: { revalidate: 3600 } });
  if (!response.ok) return [];
  return response.json();
};

export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    return await fetchInternalCountries();
  },

  getCountryByIso: async (isoCode: string): Promise<Country | undefined> => {
    const countries = await fetchInternalCountries();
    return countries.find(c => c.isoCode?.toUpperCase() === isoCode.toUpperCase());
  },

  getNeighbors: async (countryName: string, locale: string = 'en'): Promise<Country[]> => {
    const countries = await fetchInternalCountries();
    
    // Find our focus country
    const country = countries.find(c => 
      c.name[locale as keyof Country['name']] === countryName || 
      c.name.en === countryName
    );
    if (!country) return [];

    // Map CCA3 codes in memory for rapid lookup
    const cca3ToCca2Map = countries.reduce((acc, c) => {
      if ((c as any).cca3 && c.isoCode) {
        acc[(c as any).cca3.toUpperCase()] = c.isoCode.toUpperCase();
      }
      return acc;
    }, {} as Record<string, string>);

    // If borders array is empty, fallback safely to descriptive matching
    const borders = (country as any).borders || [];
    if (borders.length > 0) {
      return borders
        .map((borderCode: string) => {
          const matchedIso = cca3ToCca2Map[borderCode.toUpperCase()];
          return countries.find(c => c.isoCode === matchedIso);
        })
        .filter(Boolean) as Country[];
    }

    // Secondary fallback matching (string checking description)
    const description = (country.description[locale as keyof Country['description']] || country.description.en || '').toLowerCase();
    return countries.filter(c => {
      const name = ((c.name && (c.name[locale as keyof Country['name']] || c.name.en)) || '').toLowerCase();
      return name !== ((country.name && (country.name[locale as keyof Country['name']] || country.name.en)) || '').toLowerCase() && 
             description.includes(name);
    });
  },

  getRankings: async (type: RankingType, locale: string = 'en'): Promise<{ country: string; value: number; isoCode: string; rank: number }[]> => {
    const countries = await fetchInternalCountries();

    const propMap: Record<RankingType, keyof Country> = {
      'Population': 'population',
      'Area': 'areaKm2',
      'Density': 'densityKm2',
      'HDI': 'hdi' as any,
      'GDP': 'gdp' as any
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
