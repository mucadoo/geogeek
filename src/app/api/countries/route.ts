import fs from 'fs/promises';
import path from 'path';

import { WikiGeoClient } from '@mucadoo/wiki-geo-data';
import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

const client = new WikiGeoClient({ dataSource: 'remote' });

const getCountriesData = unstable_cache(
  async () => {
    try {
      const response = await client.getFullDatabase();
      return response.data;
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

export async function GET() {
  const data = await getCountriesData();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400', // Cache on edge CDN for 1 hour, serve stale up to 24 hrs
    }
  });
}
