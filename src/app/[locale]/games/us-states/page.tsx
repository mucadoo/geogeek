import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import USStatesClient from './USStatesClient';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function USStatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <USStatesClient />;
}
