import { setRequestLocale } from 'next-intl/server';

import Map from '@/components/Map';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function MapExplorer({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="animate-in fade-in fixed inset-0 z-0 h-screen w-screen bg-[#f1f5f3] duration-1000">
      <Map />
    </main>
  );
}
