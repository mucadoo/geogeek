import 'server-only';
import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';

import { installedSdkIsAtLeast } from '@/lib/sdkVersion';
import { LocalizedString, Subdivision, SubdivisionBorder } from '@/types';

// First-level administrative subdivisions (states / provinces / regions / …),
// keyed by ISO 3166-2 code. Same "remote SDK if new enough, else bundled local
// snapshot" strategy as countryService: the published @mucadoo/wiki-geo-data
// (0.1.17) and its GitHub Pages API predate the subdivisions dataset entirely,
// so until MIN_SUBDIVISION_SDK_VERSION is actually on the registry we read the
// public/data/fallback-subdivisions.json snapshot from a local scrape.
const MIN_SUBDIVISION_SDK_VERSION = [0, 1, 18] as const;

const LOCALES = ['en', 'pt', 'es', 'fr', 'it', 'de', 'ja', 'zh', 'ru'] as const;

// The installed SDK's .d.ts has no subdivision methods yet; describe the shape
// we expect once MIN_SUBDIVISION_SDK_VERSION ships so we can call it via a cast
// without `any` leaking everywhere.
interface RawLocalized { [locale: string]: string | null | undefined }
interface RawLink { articleId?: string | null; name?: RawLocalized | null }
interface RawSubdivision {
  code: string;
  wikidataId?: string | null;
  countryIsoCode: string;
  level?: 1 | 2 | null;
  parentCode?: string | null;
  name?: RawLocalized | null;
  type?: RawLocalized | null;
  typeEn?: string | null;
  flagUrl?: string | null;
  description?: RawLocalized | null;
  capital?: RawLink[] | null;
  capitalCoordinates?: { lat: number; lng: number } | null;
  coordinates?: { lat: number; lng: number } | null;
  population?: number | null;
  populationYear?: number | null;
  areaKm2?: number | null;
  densityKm2?: number | null;
  officialLanguage?: RawLink[] | null;
  borders?: (RawLink & { code?: string | null })[] | null;
}
interface SubdivisionCapableClient {
  getFullSubdivisions(): Promise<{ data: RawSubdivision[]; source: 'remote' | 'local'; timestamp: string }>;
}

const client = new WikiGeoClient({ dataSource: 'remote' }) as unknown as SubdivisionCapableClient;

/** Fills every supported locale from a raw (nullable) localized field,
 *  falling back to English and then to a blank string. */
function localize(raw: RawLocalized | null | undefined): LocalizedString {
  const en = raw?.en || '';
  const out = {} as LocalizedString;
  for (const l of LOCALES) out[l] = raw?.[l] || en;
  return out;
}

/** Joins the localized names of a link array into one string per locale. */
function localizeLinkList(links: RawLink[] | null | undefined): LocalizedString {
  const items = (links || []).map((l) => localize(l.name));
  const join = (l: keyof LocalizedString) => items.map((n) => n[l]).filter(Boolean).join(', ');
  const en = join('en');
  const out = {} as LocalizedString;
  for (const l of LOCALES) out[l] = join(l) || en;
  return out;
}

/** Normalizes one wiki-geo-data subdivision record into the flat, locale-keyed
 *  `Subdivision` shape the app consumes. */
function buildSubdivision(raw: RawSubdivision): Subdivision {
  const population = raw.population ?? null;
  const areaKm2 = raw.areaKm2 ?? null;
  const densityKm2 =
    raw.densityKm2 ?? (population && areaKm2 ? population / areaKm2 : null);

  const borders: SubdivisionBorder[] = (raw.borders || []).map((b) => ({
    code: b.code || null,
    name: localize(b.name),
  }));

  return {
    code: (raw.code || '').toUpperCase(),
    wikidataId: raw.wikidataId ?? null,
    countryIsoCode: (raw.countryIsoCode || '').toUpperCase(),
    level: raw.level === 2 ? 2 : 1,
    parentCode: raw.parentCode ? raw.parentCode.toUpperCase() : null,
    name: localize(raw.name),
    type: localize(raw.type),
    typeEn: raw.typeEn ?? null,
    flagUrl: raw.flagUrl ?? null,
    description: localize(raw.description),
    capital: localizeLinkList(raw.capital),
    capitalCoordinates: raw.capitalCoordinates ?? null,
    coordinates: raw.coordinates ?? null,
    population,
    populationYear: raw.populationYear ?? null,
    areaKm2,
    densityKm2,
    officialLanguage: {
      en:
        (raw.officialLanguage || [])
          .map((l) => l.name?.en)
          .filter(Boolean)
          .join(', ') || 'N/A',
    },
    borders,
  };
}

async function readFallbackSubdivisions(): Promise<Subdivision[]> {
  const fallbackPath = path.join(process.cwd(), 'public/data/fallback-subdivisions.json');
  try {
    const data = await fs.readFile(fallbackPath, 'utf-8');
    const json = JSON.parse(data);
    const raw: RawSubdivision[] = json.data || json;
    return raw.map(buildSubdivision);
  } catch (err) {
    console.error('Failed to read fallback subdivisions file:', err);
    return [];
  }
}

async function loadSubdivisions(): Promise<Subdivision[]> {
  if (!(await installedSdkIsAtLeast(MIN_SUBDIVISION_SDK_VERSION))) {
    return readFallbackSubdivisions();
  }

  try {
    // The SDK client already falls back to its own bundled dataset on
    // network failure, so this virtually never throws.
    const response = await client.getFullSubdivisions();
    const raw = response.data || [];
    if (raw.length === 0) return readFallbackSubdivisions();
    return raw.map(buildSubdivision);
  } catch (error) {
    console.error('Error fetching subdivision data, using bundled fallback file:', error);
    return readFallbackSubdivisions();
  }
}

// The normalized dataset (~13 MB) is far over Next's 2 MB unstable_cache limit,
// so it's memoized in-process instead. Source is a bundled file (or the SDK's
// own snapshot), so a long TTL is fine.
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { data: Subdivision[]; at: number } | null = null;
let inflight: Promise<Subdivision[]> | null = null;

async function getSubdivisionsData(): Promise<Subdivision[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  if (!inflight) {
    inflight = loadSubdivisions()
      .then((data) => {
        cache = { data, at: Date.now() };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export const subdivisionService = {
  getAllSubdivisions: async (): Promise<Subdivision[]> => {
    return getSubdivisionsData();
  },

  getSubdivisionByCode: async (code: string): Promise<Subdivision | undefined> => {
    const target = code.toUpperCase();
    const all = await getSubdivisionsData();
    return all.find((s) => s.code === target);
  },

  getSubdivisionsByCodes: async (codes: string[]): Promise<Subdivision[]> => {
    const wanted = new Set(codes.map((c) => c.toUpperCase()));
    if (wanted.size === 0) return [];
    const all = await getSubdivisionsData();
    return all.filter((s) => wanted.has(s.code));
  },

  // First-level units only — the map geometry and the country sidebar's region
  // list are both first-level. Second-level units hang off a parent via
  // listChildSubdivisions().
  listSubdivisionsByCountry: async (isoCode: string): Promise<Subdivision[]> => {
    const target = isoCode.toUpperCase();
    const all = await getSubdivisionsData();
    return all
      .filter((s) => s.countryIsoCode === target && s.level === 1)
      .sort((a, b) => a.name.en.localeCompare(b.name.en));
  },

  // Second-level units contained by the given first-level subdivision, keyed by
  // its ISO 3166-2 code (e.g. "IT-82" -> the provinces of Sicily). Coverage
  // follows Wikidata and is uneven across countries.
  listChildSubdivisions: async (parentCode: string): Promise<Subdivision[]> => {
    const target = parentCode.toUpperCase();
    const all = await getSubdivisionsData();
    return all
      .filter((s) => s.level === 2 && s.parentCode === target)
      .sort((a, b) => a.name.en.localeCompare(b.name.en));
  },
};
