import { NextResponse } from 'next/server';
import { countryService } from '@/lib/countryService';

export async function GET() {
  const data = await countryService.getAllCountries();
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }
  });
}
