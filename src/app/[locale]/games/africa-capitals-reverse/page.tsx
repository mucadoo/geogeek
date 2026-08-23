import { setRequestLocale } from 'next-intl/server';

import AfricaCapitalsReverseClient from './AfricaCapitalsReverseClient';

import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AfricaCapitalsReversePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AfricaCapitalsReverseClient />;
}
