import fs from 'fs/promises';
import path from 'path';

import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

const EXTERNAL_URL = 'https://mucadoo.github.io/country-info-scraper/countries.min.json';

const getCountriesData = unstable_cache(
  async () => {
    try {
      const response = await fetch(EXTERNAL_URL, { next: { revalidate: 3600 } });
      if (!response.ok) throw new Error('Failed to fetch from external source');
      return await response.json();
    } catch (error) {
      console.error('Error fetching external data, using fallback:', error);
      const fallbackPath = path.join(process.cwd(), 'public/data/fallback-countries.json');
      const data = await fs.readFile(fallbackPath, 'utf-8');
      return JSON.parse(data);
    }
  },
  ['countries-data'],
  { revalidate: 3600 }
);

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getCountriesData();
  return NextResponse.json(data);
}
