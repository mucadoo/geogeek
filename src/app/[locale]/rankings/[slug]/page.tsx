import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import RankingDetailClient from './RankingDetailClient';

import { RANKING_CATEGORIES, getRankingBySlug } from '@/config/rankingsConfig';
import { routing } from '@/i18n/routing';
import { countryService } from '@/lib/countryService';

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  routing.locales.forEach(locale => {
    RANKING_CATEGORIES.forEach(category => {
      params.push({ locale, slug: category.slug });
    });
  });
  return params;
}

export default async function RankingDetail({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = getRankingBySlug(slug);

  if (!category) {
    notFound();
  }
  
  const rankings = await countryService.getRankings(category.title as any);
  const t = await getTranslations('Rankings');

  let valueLabel = t('table.value');
  if (slug === 'population') valueLabel = t('table.population');
  if (slug === 'area') valueLabel = t('table.area');
  if (slug === 'density') valueLabel = t('table.density');
  if (slug === 'hdi') valueLabel = t('table.hdi');
  if (slug === 'gdp') valueLabel = t('table.gdp');

  return (
    <RankingDetailClient 
      initialRankings={rankings}
      locale={locale}
      slug={slug}
      valueLabel={valueLabel}
    />
  );
}
