import { notFound } from 'next/navigation';

import CountryDetailsClient from './CountryDetailsClient';

import { countryService } from '@/lib/countryService';

export async function generateStaticParams() {
  const countries = await countryService.getAllCountries();
  return countries.map((country) => ({
    id: country.ISO_code,
  }));
}

export default async function CountryInfo({ params }: { params: { id: string } }) {
  const { id } = await params;
  const country = await countryService.getCountryByIso(id);

  if (!country) {
    notFound();
  }

  return <CountryDetailsClient country={country} />;
}
