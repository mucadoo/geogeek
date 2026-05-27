import { setRequestLocale } from 'next-intl/server';
import SouthAmericaFlagsClient from './SouthAmericaFlagsClient';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function SouthAmericaFlagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SouthAmericaFlagsClient />;
}
