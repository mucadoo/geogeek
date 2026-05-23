import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

import { Country } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

const getCountriesData = unstable_cache(
  async (): Promise<Country[]> => {
    try {
      // 1. Fetch from Wiki-Geo client dynamically
      const wikiResponse = await client.getFullDatabase();
      const wikiCountries = wikiResponse.data || [];
      
      const wikiMap = wikiCountries.reduce((acc: Record<string, any>, item: any) => {
        if (item.isoCode) acc[item.isoCode.toUpperCase()] = item;
        return acc;
      }, {});

      // 2. Fetch fresh geographical assets from REST Countries
      const restResponse = await fetch('https://restcountries.com/v3.1/all');
      if (!restResponse.ok) throw new Error('REST Countries API returned error');
      const restCountries = await restResponse.json();

      // 3. Merging in memory by ISO matching
      return restCountries.map((item: any) => {
        const iso2 = (item.cca2 || '').toUpperCase();
        const wiki = wikiMap[iso2] || {};

        // Localized Name mapping (prioritize REST Countries translations, fallback to wiki client)
        const name = {
          en: item.name?.common || wiki.name?.en || '',
          pt: item.translations?.por?.common || wiki.name?.pt || item.name?.common || '',
          es: item.translations?.spa?.common || wiki.name?.es || item.name?.common || '',
          fr: item.translations?.fra?.common || wiki.name?.fr || item.name?.common || '',
          it: item.translations?.ita?.common || wiki.name?.it || item.name?.common || '',
        };

        const capital = {
          en: item.capital ? item.capital.join(', ') : (wiki.capital?.en || 'N/A'),
          pt: item.capital ? item.capital.join(', ') : (wiki.capital?.pt || 'N/A'),
          es: item.capital ? item.capital.join(', ') : (wiki.capital?.es || 'N/A'),
          fr: item.capital ? item.capital.join(', ') : (wiki.capital?.fr || 'N/A'),
          it: item.capital ? item.capital.join(', ') : (wiki.capital?.it || 'N/A'),
        };

        const currency = {
          en: item.currencies 
            ? Object.values(item.currencies).map((c: any) => `${c.name} (${c.symbol || ''})`).join(', ') 
            : (wiki.currency?.en || 'N/A'),
        };

        const timeZone = {
          en: item.timezones ? item.timezones.join(', ') : (wiki.timeZone?.en || 'N/A'),
        };

        const callingCode = {
          en: item.idd && item.idd.root 
            ? `${item.idd.root}${item.idd.suffixes ? item.idd.suffixes[0] || '' : ''}` 
            : (wiki.callingCode?.en || 'N/A'),
        };

        const officialLanguage = {
          en: item.languages ? Object.values(item.languages).join(', ') : (wiki.officialLanguage?.en || 'N/A'),
        };

        const demonym = {
          en: item.demonyms?.eng ? item.demonyms.eng.m || item.demonyms.eng.f : (wiki.demonym?.en || 'N/A'),
        };

        // Standardize coordinates for map projections [longitude, latitude]
        const capitalCoordinates = item.capitalInfo?.latlng && item.capitalInfo.latlng.length === 2
          ? [item.capitalInfo.latlng[1], item.capitalInfo.latlng[0]] // Swap [lat, lng] to [lng, lat]
          : (wiki.capitalCoordinates || null);

        const area = item.area || wiki.areaKm2 || 0;
        const population = item.population || wiki.population || 0;

        return {
          isoCode: iso2,
          cca3: (item.cca3 || '').toUpperCase(), // Preserved for direct border relationship queries
          borders: item.borders || [],
          name,
          capital,
          flagUrl: item.flags?.svg || item.flags?.png || wiki.flagUrl || '',
          areaKm2: area,
          population: population,
          officialLanguage,
          demonym,
          currency,
          timeZone,
          callingCode,
          capitalCoordinates,
          densityKm2: area > 0 ? population / area : 0,
          
          // WikiGeoScraper properties loaded dynamically
          gdp: wiki.gdp || null,
          hdi: wiki.hdi || null,
          description: wiki.description || { en: 'No description available.' },
          government: wiki.government || { en: 'N/A' },
          largestCity: wiki.largestCity || { en: 'N/A' },
        };
      });
    } catch (error) {
      console.error('Error fetching hybrid country API metrics, using fallback file:', error);
      const fallbackPath = path.join(process.cwd(), 'public/data/fallback-countries.json');
      const data = await fs.readFile(fallbackPath, 'utf-8');
      const json = JSON.parse(data);
      return json.data || json;
    }
  },
  ['countries-data-rest-wiki'],
  { revalidate: 3600 }
);

export async function GET() {
  const data = await getCountriesData();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }
  });
}
