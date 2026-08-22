import { setRequestLocale } from 'next-intl/server';

import EuropeCapitalsClient from './EuropeCapitalsClient';

import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function EuropeCapitalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EuropeCapitalsClient />;
}
