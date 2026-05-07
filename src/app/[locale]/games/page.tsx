import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import GamesClient from './GamesClient';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function GamesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GamesClient />;
}
