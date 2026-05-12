import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

const client = new WikiGeoClient({ dataSource: 'remote' });

const getCountriesData = unstable_cache(
  async () => {
    try {
      return await client.getFullDatabase();
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
  return NextResponse.json(data.data || data);
}
