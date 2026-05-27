import { setRequestLocale } from 'next-intl/server';
import AsiaFlagsClient from './AsiaFlagsClient';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function AsiaFlagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AsiaFlagsClient />;
}
