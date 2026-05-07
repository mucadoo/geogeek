import { setRequestLocale } from 'next-intl/server';

import FranceRegionsClient from './FranceRegionsClient';

import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function FranceRegionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FranceRegionsClient />;
}
