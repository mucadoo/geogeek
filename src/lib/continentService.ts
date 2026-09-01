import 'server-only';
import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';

import { installedSdkIsAtLeast } from '@/lib/sdkVersion';
import { Continent, LocalizedString } from '@/types';

// The six continents this dataset's sovereign states fall into. Same
// "remote SDK if new enough, else bundled local snapshot" strategy as
// countryService / subdivisionService: the published @mucadoo/wiki-geo-data
// (0.1.17) and its GitHub Pages API both predate the continents dataset, so
// until MIN_CONTINENT_SDK_VERSION is on the registry we read the bundled
// public/data/fallback-continents.json snapshot.
const MIN_CONTINENT_SDK_VERSION = [0, 1, 18] as const;

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de', 'ja', 'zh', 'ru'] as const;

interface RawLocalized { [locale: string]: string | null | undefined }
interface RawContinent {
  code: string;
  wikidataId?: string | null;
  name?: RawLocalized | null;
  description?: RawLocalized | null;
  coordinates?: { lat: number; lng: number } | null;
  population?: number | null;
  populationYear?: number | null;
  areaKm2?: number | null;
  densityKm2?: number | null;
  countryCount?: number | null;
  countryIsoCodes?: string[] | null;
}
interface ContinentCapableClient {
  getFullContinents(): Promise<{ data: RawContinent[]; source: 'remote' | 'local'; timestamp: string }>;
}

const client = new WikiGeoClient({ dataSource: 'remote' }) as unknown as ContinentCapableClient;

function localize(raw: RawLocalized | null | undefined): LocalizedString {
  const en = raw?.en || '';
  const out = {} as LocalizedString;
  for (const l of LOCALES) out[l] = raw?.[l] || en;
  return out;
}

/** Normalizes one wiki-geo-data continent record into the flat, locale-keyed
 *  `Continent` shape the app consumes. */
function buildContinent(raw: RawContinent): Continent {
  const population = raw.population ?? null;
  const areaKm2 = raw.areaKm2 ?? null;
  return {
    code: (raw.code || '').toUpperCase(),
    wikidataId: raw.wikidataId ?? null,
    name: localize(raw.name),
    description: localize(raw.description),
    coordinates: raw.coordinates ?? null,
    population,
    populationYear: raw.populationYear ?? null,
    areaKm2,
    densityKm2: raw.densityKm2 ?? (population && areaKm2 ? population / areaKm2 : null),
    countryCount: raw.countryCount ?? (raw.countryIsoCodes?.length ?? 0),
    countryIsoCodes: (raw.countryIsoCodes ?? []).map((c) => c.toUpperCase()),
  };
}

async function readFallbackContinents(): Promise<Continent[]> {
  const fallbackPath = path.join(process.cwd(), 'public/data/fallback-continents.json');
  try {
    const data = await fs.readFile(fallbackPath, 'utf-8');
    const json = JSON.parse(data);
    const raw: RawContinent[] = json.data || json;
    return raw.map(buildContinent);
  } catch (err) {
    console.error('Failed to read fallback continents file:', err);
    return [];
  }
}

const getContinentsData = unstable_cache(
  async (): Promise<Continent[]> => {
    if (!(await installedSdkIsAtLeast(MIN_CONTINENT_SDK_VERSION))) {
      return readFallbackContinents();
    }
    try {
      const response = await client.getFullContinents();
      const raw = response.data || [];
      if (raw.length === 0) return readFallbackContinents();
      return raw.map(buildContinent);
    } catch (error) {
      console.error('Error fetching continent data, using bundled fallback file:', error);
      return readFallbackContinents();
    }
  },
  // v2: Antarctica added to the dataset (2026-09) — bump so a warm Data Cache
  // doesn't keep serving the 6-continent snapshot.
  ['continents-data-v2'],
  { revalidate: 3600 }
);

export const continentService = {
  getAllContinents: async (): Promise<Continent[]> => {
    return getContinentsData();
  },

  getContinentByCode: async (code: string): Promise<Continent | undefined> => {
    const target = code.toUpperCase();
    const all = await getContinentsData();
    return all.find((c) => c.code === target);
  },
};
