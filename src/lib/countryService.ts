import 'server-only';
import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';

import { Country, RankingType } from '@/types';

const client = new WikiGeoClient({ dataSource: 'remote' });

// @mucadoo/wiki-geo-data (Wikipedia-sourced) is the sole data source: no
// external API, no signup, no rate limit, and its client already falls back
// to its own bundled local snapshot on network failure. It now translates
// all 9 of the app's locales directly (en/pt/fr/it/es/de/ja/ru/zh); the
// runtime's built-in CLDR data via Intl.DisplayNames (same technique
// QuizLayout uses for region names without a wiki-geo-data entry) is kept
// only as a defensive fallback for a record missing one of those locales.
//
// The installed SDK version is checked against MIN_ENRICHED_SDK_VERSION
// below: older installs (and the 'remote' GitHub Pages snapshot they'd
// otherwise pull) predate the borders/capitalCoordinates/isoCode3 fields, so
// in that case - or if the network fetch itself fails - we read the bundled
// public/data/fallback-countries.json snapshot instead, which already has
// them from a local scrape.
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
    de: wiki.name?.de || regionDisplayName(iso2, 'de') || wiki.name?.en || '',
    ja: wiki.name?.ja || regionDisplayName(iso2, 'ja') || wiki.name?.en || '',
    zh: wiki.name?.zh || regionDisplayName(iso2, 'zh') || wiki.name?.en || '',
    ru: wiki.name?.ru || regionDisplayName(iso2, 'ru') || wiki.name?.en || '',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capitalNames = ((wiki.capital || []) as any[]).map((c) => c.name).filter(Boolean);
  const capitalFor = (locale: string) =>
    capitalNames.map((n) => n[locale]).filter(Boolean).join(', ') || capitalNames.map((n) => n.en).filter(Boolean).join(', ') || 'N/A';
  const capital = {
    en: capitalFor('en'), pt: capitalFor('pt'), es: capitalFor('es'), fr: capitalFor('fr'), it: capitalFor('it'),
    de: capitalFor('de'), ja: capitalFor('ja'), zh: capitalFor('zh'), ru: capitalFor('ru'),
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
    cca3: wiki.isoCode3 || '',
    continent: wiki.continent || null,
    isoNumeric: wiki.isoNumeric || null,
    borders: wiki.borders || [],
    name,
    capital,
    // GameMap already falls back to the region polygon's centroid when this is null.
    capitalCoordinates: wiki.capitalCoordinates || null,
    flagUrl: wiki.flagUrl || (iso2 ? `https://flagcdn.com/${iso2.toLowerCase()}.svg` : ''),
    areaKm2: area,
    population,
    populationYear: wiki.populationYear ?? null,
    officialLanguage,
    demonym,
    currency,
    timeZone,
    callingCode,
    internetTld: wiki.internetTld || [],
    densityKm2: area > 0 ? population / area : 0,
    gdp: wiki.gdp || null,
    gdpPerCapita: wiki.gdpPerCapita ?? null,
    gdpPpp: wiki.gdpPpp ?? null,
    gdpPerCapitaPpp: wiki.gdpPerCapitaPpp ?? null,
    gdpYear: wiki.gdpYear ?? null,
    hdi: wiki.hdi || null,
    lifeExpectancy: wiki.lifeExpectancy ?? null,
    internetUsagePercent: wiki.internetUsagePercent ?? null,
    unemploymentRate: wiki.unemploymentRate ?? null,
    drivingSide: wiki.drivingSide || null,
    motto: wiki.motto || null,
    anthem: wiki.anthem || null,
    description: wiki.description || { en: 'No description available.' },
    government: wiki.government || [],
    governmentLeaders: wiki.governmentLeaders || [],
    largestCity: wiki.largestCity || [],
  };
}

// First npm version of @mucadoo/wiki-geo-data expected to ship the enriched
// schema (borders resolved to isoCode, capitalCoordinates, isoCode3, etc.).
// The registry is still on 0.1.17, which predates it - bump this once a
// version containing that schema is actually published.
const MIN_ENRICHED_SDK_VERSION = [0, 1, 18] as const;

function isVersionAtLeast(version: string, min: readonly number[]): boolean {
  const parts = version.split('.').map((p) => parseInt(p, 10));
  for (let i = 0; i < min.length; i++) {
    const part = parts[i] || 0;
    if (part !== min[i]) return part > min[i];
  }
  return true;
}

async function installedSdkIsEnriched(): Promise<boolean> {
  try {
    const pkgPath = path.join(process.cwd(), 'node_modules/@mucadoo/wiki-geo-data/package.json');
    const raw = await fs.readFile(pkgPath, 'utf-8');
    const { version } = JSON.parse(raw) as { version: string };
    return isVersionAtLeast(version, MIN_ENRICHED_SDK_VERSION);
  } catch {
    // Can't verify the installed version - don't trust it.
    return false;
  }
}

async function readFallbackCountries(): Promise<Country[]> {
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

const getCountriesData = unstable_cache(
  async (): Promise<Country[]> => {
    if (!(await installedSdkIsEnriched())) {
      return readFallbackCountries();
    }

    try {
      // wiki-geo-data's client already falls back to its own bundled dataset
      // on network failure, so this virtually never throws.
      const wikiResponse = await client.getFullDatabase();
      const wikiCountries = wikiResponse.data || [];
      return wikiCountries.map((wiki) => buildCountry(wiki));
    } catch (error) {
      console.error('Error fetching country data, using bundled fallback file:', error);
      return readFallbackCountries();
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

    const borderIsoCodes = new Set(
      (country.borders || []).map((b) => b.isoCode?.toUpperCase()).filter(Boolean)
    );
    if (borderIsoCodes.size > 0) {
      return countries.filter(c => c.isoCode && borderIsoCodes.has(c.isoCode.toUpperCase()));
    }

    // Fallback for the rare case borders resolved to nothing (e.g. a bundled
    // snapshot from before the borders relation existed): match which other
    // countries' names appear in this one's own description text (e.g.
    // "...bordered by France to the north...").
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
      'HDI': 'hdi',
      'GDP': 'gdp',
      'GDPPerCapita': 'gdpPerCapita',
      'LifeExpectancy': 'lifeExpectancy',
      'InternetUsage': 'internetUsagePercent',
      'UnemploymentRate': 'unemploymentRate',
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
