import 'server-only';
import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';

import { Country, RankingType } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

// @mucadoo/wiki-geo-data (Wikipedia-sourced) is the sole data source: no
// external API, no signup, no rate limit, and its client already falls back
// to its own bundled local snapshot on network failure. Its directly
// supported locales are en/pt/fr/it/es; for de/ja/zh/ru, country *names*
// fall back to the runtime's built-in CLDR data via Intl.DisplayNames keyed
// off isoCode (same technique QuizLayout already uses for region names) —
// no hand-maintained translation content required. Other de/ja/zh/ru fields
// (capital, currency, etc.) fall back to the English value; wiki-geo-data
// has no cca3/borders relation at all, so getNeighbors() always uses its
// description-text fallback match below.
function regionDisplayName(isoCode: string, locale: string): string | null {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(isoCode.toUpperCase()) || null;
  } catch {
    return null;
  }
}

/** Normalizes one wiki-geo-data record into the flat, locale-keyed `Country`
 *  shape the rest of the app consumes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCountry(wiki: any): Country {
  const iso2 = (wiki.isoCode || '').toUpperCase();

  const name = {
    en: wiki.name?.en || '',
    pt: wiki.name?.pt || wiki.name?.en || '',
    es: wiki.name?.es || wiki.name?.en || '',
    fr: wiki.name?.fr || wiki.name?.en || '',
    it: wiki.name?.it || wiki.name?.en || '',
    de: regionDisplayName(iso2, 'de') || wiki.name?.en || '',
    ja: regionDisplayName(iso2, 'ja') || wiki.name?.en || '',
    zh: regionDisplayName(iso2, 'zh') || wiki.name?.en || '',
    ru: regionDisplayName(iso2, 'ru') || wiki.name?.en || '',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capitalNames = ((wiki.capital || []) as any[]).map((c) => c.name).filter(Boolean);
  const capitalFor = (locale: string) =>
    capitalNames.map((n) => n[locale]).filter(Boolean).join(', ') || capitalNames.map((n) => n.en).filter(Boolean).join(', ') || 'N/A';
  const capital = {
    en: capitalFor('en'), pt: capitalFor('pt'), es: capitalFor('es'), fr: capitalFor('fr'), it: capitalFor('it'),
    de: capitalFor('en'), ja: capitalFor('en'), zh: capitalFor('en'), ru: capitalFor('en'),
  };

  // The wiki scraper's currency/time-zone links include the bare
  // symbol/punctuation and connector words as their own separate entries
  // (e.g. currency: "U.S. dollar", "(", "$", ")"; time zone: "UTC", "to",
  // "−4", "−12" for a source string like "UTC−4 to UTC−12") — keep only
  // entries that read as an actual name (currency) or offset (time zone).
  const currencyText = ((wiki.currency || []) as { name?: { en?: string } }[])
    .map((c) => c.name?.en)
    .filter((n): n is string => !!n && /[A-Za-z]{2,}/.test(n))
    .join(', ');
  const currency = { en: currencyText || 'N/A' };

  const timeZoneOffsets = ((wiki.timeZone || []) as { name?: { en?: string } }[])
    .map((t) => t.name?.en)
    .filter((n): n is string => !!n && /\d/.test(n));
  const timeZone = { en: timeZoneOffsets.length ? `UTC ${timeZoneOffsets.join(', ')}` : 'N/A' };

  const callingCode = { en: ((wiki.callingCode || []) as string[]).join(', ') || 'N/A' };

  const officialLanguage = {
    en: ((wiki.officialLanguage || []) as { name?: { en?: string } }[]).map((l) => l.name?.en).filter(Boolean).join(', ') || 'N/A',
  };

  const demonym = { en: wiki.demonym?.[0]?.name?.en || 'N/A' };

  const area = wiki.areaKm2 || 0;
  const population = wiki.population || 0;

  return {
    isoCode: iso2,
    // wiki-geo-data has no cca3/land-border relation data.
    cca3: '',
    borders: [],
    name,
    capital,
    // wiki-geo-data has no capital-city coordinates; GameMap already falls
    // back to the region polygon's centroid when this is null.
    capitalCoordinates: null,
    flagUrl: wiki.flagUrl || (iso2 ? `https://flagcdn.com/${iso2.toLowerCase()}.svg` : ''),
    areaKm2: area,
    population,
    officialLanguage,
    demonym,
    currency,
    timeZone,
    callingCode,
    internetTld: wiki.internetTld || [],
    densityKm2: area > 0 ? population / area : 0,
    gdp: wiki.gdp || null,
    hdi: wiki.hdi || null,
    description: wiki.description || { en: 'No description available.' },
    government: wiki.government || [],
    largestCity: wiki.largestCity || [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const getCountriesData = unstable_cache(
  async (): Promise<Country[]> => {
    try {
      // wiki-geo-data's client already falls back to its own bundled dataset
      // on network failure, so this virtually never throws.
      const wikiResponse = await client.getFullDatabase();
      const wikiCountries = wikiResponse.data || [];
      return wikiCountries.map((wiki) => buildCountry(wiki));
    } catch (error) {
      console.error('Error fetching country data, using bundled fallback file:', error);
      const fallbackPath = path.join(process.cwd(), 'public/data/fallback-countries.json');
      try {
        const data = await fs.readFile(fallbackPath, 'utf-8');
        const json = JSON.parse(data);
        const fallbackCountries = json.data || json;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return fallbackCountries.map((wiki: any) => buildCountry(wiki));
      } catch (err) {
        console.error('Failed to read fallback countries file:', err);
        return [];
      }
    }
  },
  ['countries-data-wiki-only'],
  { revalidate: 3600 }
);

export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    return await getCountriesData();
  },

  getCountryByIso: async (isoCode: string): Promise<Country | undefined> => {
    const countries = await getCountriesData();
    return countries.find(c => c.isoCode?.toUpperCase() === isoCode.toUpperCase());
  },

  getNeighbors: async (countryName: string, locale: string = 'en'): Promise<Country[]> => {
    const countries = await getCountriesData();

    // Find our focus country
    const country = countries.find(c =>
      c.name[locale as keyof Country['name']] === countryName ||
      c.name.en === countryName
    );
    if (!country) return [];

    // wiki-geo-data has no land-border relation data, so this is matched by
    // checking which other countries' names appear in this one's own
    // description text (e.g. "...bordered by France to the north...").
    const description = (country.description[locale as keyof Country['description']] || country.description.en || '').toLowerCase();
    return countries.filter(c => {
      const name = ((c.name && (c.name[locale as keyof Country['name']] || c.name.en)) || '').toLowerCase();
      return name !== ((country.name && (country.name[locale as keyof Country['name']] || country.name.en)) || '').toLowerCase() && 
             description.includes(name);
    });
  },

  getRankings: async (type: RankingType, locale: string = 'en'): Promise<{ country: string; value: number; isoCode: string; rank: number }[]> => {
    const countries = await getCountriesData();

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
