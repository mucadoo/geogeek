import { Country } from '@/types';

export async function fetchCountries(): Promise<Country[]> {
  const response = await fetch('/api/countries');
  if (!response.ok) {
    throw new Error('Failed to fetch countries');
  }
  return response.json();
}
