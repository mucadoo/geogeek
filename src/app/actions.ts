'use server';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';

const client = new WikiGeoClient({ dataSource: 'remote' });

export async function getCountryByIsoAction(isoCode: string) {
  try {
    return await client.getCountry(isoCode);
  } catch (error) {
    console.error('Error fetching country by ISO:', error);
    return null;
  }
}

export async function getAllCountriesAction() {
  try {
    return await client.listCountries();
  } catch (error) {
    console.error('Error fetching all countries:', error);
    return [];
  }
}

export async function getRankingsAction(type: any, locale: string = 'en') {
  try {
    const countries = await client.listCountries();
    // Replicating the logic from countryService.getRankings
    let prop: any;

    switch (type) {
      case 'Population': prop = 'population'; break;
      case 'Area': prop = 'areaKm2'; break;
      case 'Density': prop = 'densityKm2'; break;
      case 'HDI': prop = 'hdi'; break;
      case 'GDP': prop = 'gdp'; break;
      default: prop = 'population';
    }

    const sorted = [...countries].sort((a, b) => {
      const valA = Number((a as any)[prop]);
      const valB = Number((b as any)[prop]);

      if (isNaN(valA) && isNaN(valB)) return 0;
      if (isNaN(valA)) return 1;
      if (isNaN(valB)) return -1;

      return valB - valA;
    });

    let currentRank = 1;
    let previousValue: number | undefined = undefined;

    return sorted.map((c, index) => {
      const value = Number((c as any)[prop]);

      if (index > 0 && value !== previousValue) {
        currentRank = index + 1;
      }
      previousValue = value;

      return {
        country: (c.name[locale as keyof typeof c.name] || c.name.en) as string,
        value: value,
        isoCode: c.isoCode || '',
        rank: currentRank
      };
    });
  } catch (error) {
    console.error('Error calculating rankings:', error);
    return [];
  }
}
