import { setRequestLocale } from 'next-intl/server';
import EuropeFlagsClient from './EuropeFlagsClient';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function EuropeFlagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EuropeFlagsClient />;
}
