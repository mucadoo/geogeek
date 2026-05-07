import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

import CountryDetailsClient from './CountryDetailsClient';

import { countryService } from '@/lib/countryService';

export async function generateStaticParams() {
  const countries = await countryService.getAllCountries();
  const params: { locale: string; id: string }[] = [];
  
  routing.locales.forEach(locale => {
    countries.forEach(country => {
      params.push({ locale, id: country.ISO_code });
    });
  });
  
  return params;
}

export default async function CountryInfo({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const country = await countryService.getCountryByIso(id);

  if (!country) {
    notFound();
  }

  return <CountryDetailsClient country={country} />;
}
