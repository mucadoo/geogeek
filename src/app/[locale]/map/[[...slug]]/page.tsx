import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

import { getCountryByIsoAction } from '@/app/actions';
import Map from '@/components/Map';
import { CONTINENT_VIEWS } from '@/config/mapConstants';
import { routing } from '@/i18n/routing';
import { getLocalizedValue } from '@/lib/i18n-utils';

export function generateStaticParams() {
  const locales = routing.locales;
  const continents = Object.keys(CONTINENT_VIEWS).map((c) => c.toLowerCase().replace(' ', '-'));
  
  const params = [];
  for (const locale of locales) {
    params.push({ locale, slug: undefined }); // World
    for (const continent of continents) {
      params.push({ locale, slug: [continent] });
    }
    // Note: Countries would typically be generated based on dynamic data or a predefined list
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug?: string[] }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  if (slug && slug[0]) {
    const s = slug[0];
    
    // Check if it's a continent
    const continentName = s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (Object.keys(CONTINENT_VIEWS).includes(continentName)) {
      return { title: `${t('mapOf', { continent: continentName })} | GeoGeek` };
    }

    // Treat as country code
    const country = await getCountryByIsoAction(s.toUpperCase());
    if (country) {
      return { title: `${getLocalizedValue(country.name, locale)} | Info & Map | GeoGeek` };
    }
  }

  return { title: t('worldMapTitle') };
}

export default async function MapExplorer({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <main className="animate-in fade-in fixed inset-0 z-0 h-screen w-screen bg-[#f1f5f3] duration-1000">
      <Map slug={slug ? slug.join('/') : undefined} />
    </main>
  );
}
