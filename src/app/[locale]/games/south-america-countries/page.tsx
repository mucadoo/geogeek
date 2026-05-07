import { setRequestLocale } from 'next-intl/server';

import SouthAmericaCountriesClient from './SouthAmericaCountriesClient';

import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function SouthAmericaCountriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SouthAmericaCountriesClient />;
}
