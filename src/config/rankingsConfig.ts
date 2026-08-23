import { RankingConfig } from '@/types';

export const RANKING_CATEGORIES: RankingConfig[] = [
  { title: 'Population', slug: 'population' },
  { title: 'Area', slug: 'area' },
  { title: 'Density', slug: 'density' },
  { title: 'HDI', slug: 'hdi' },
  { title: 'GDP', slug: 'gdp' },
  { title: 'GDPPerCapita', slug: 'gdp-per-capita' },
  { title: 'LifeExpectancy', slug: 'life-expectancy' },
  { title: 'InternetUsage', slug: 'internet-usage' },
  { title: 'UnemploymentRate', slug: 'unemployment-rate' },
];

export const getRankingBySlug = (slug: string): RankingConfig | undefined => {
  return RANKING_CATEGORIES.find((cat) => cat.slug === slug);
};
