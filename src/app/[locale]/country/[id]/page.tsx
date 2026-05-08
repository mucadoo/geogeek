import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

import CountryDetailsClient from './CountryDetailsClient';

import { routing } from '@/i18n/routing';
import { countryService } from '@/lib/countryService';
import { getLocalizedCountryName } from '@/lib/i18n-utils';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const country = await countryService.getCountryByIso(id);
  if (!country) return {};

  const t = await getTranslations({locale, namespace: 'CountryDetails'});
  const countryName = getLocalizedCountryName(id, locale);
  const baseUrl = 'https://geogeek.com';
  
  const alternates: Record<string, string> = {};
  routing.locales.forEach(l => {
    alternates[l] = `${baseUrl}${l === routing.defaultLocale ? '' : `/${l}`}/country/${id.toLowerCase()}`;
  });

  return {
    title: `${countryName} | GeoGeek`,
    description: country.description.substring(0, 160),
    alternates: {
      canonical: `${baseUrl}${locale === routing.defaultLocale ? '' : `/${locale}`}/country/${id.toLowerCase()}`,
      languages: alternates,
    },
  };
}

export async function generateStaticParams() {
  const countries = await countryService.getAllCountries();
  const params: { locale: string; id: string }[] = [];
  
  routing.locales.forEach(locale => {
    countries.forEach(country => {
      params.push({ locale, id: country.ISO_code.toLowerCase() });
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
