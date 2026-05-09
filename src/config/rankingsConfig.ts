import { RankingConfig } from '@/types';

export const RANKING_CATEGORIES: RankingConfig[] = [
  { title: 'Population', slug: 'population' },
  { title: 'Area', slug: 'area' },
  { title: 'Density', slug: 'density' },
  { title: 'HDI', slug: 'hdi' },
];

export const getRankingBySlug = (slug: string): RankingConfig | undefined => {
  return RANKING_CATEGORIES.find((cat) => cat.slug === slug);
};
