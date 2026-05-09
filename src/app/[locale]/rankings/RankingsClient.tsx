'use client';
import { useTranslations } from 'next-intl';

import { RANKING_CATEGORIES } from '@/config/rankingsConfig';
import { Link } from '@/i18n/routing';
import { RankingCategory } from '@/types';

export default function RankingsClient() {
  const t = useTranslations('Rankings');

  return (
    <main className="container-custom animate-in fade-in mt-10 mb-20 flex-grow duration-1000">
      <h1 className="mb-16 text-center text-[48px] font-game-heading tracking-widest text-[var(--foreground)] uppercase">{t('title')}</h1>
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RANKING_CATEGORIES.map((category) => (
          <Link 
            key={category.slug}
            href={`/rankings/${category.slug}`}
            className="game-card group flex h-[140px] items-center justify-center text-center transition-all duration-300 hover:border-primary hover:bg-[var(--primary)]/10"
          >
            <h3 className="group-hover:text-primary text-[24px] font-game-heading uppercase tracking-wider text-[var(--foreground)] transition-colors">
              {t(`categories.${category.slug as any}`)}
            </h3>
          </Link>
        ))}
      </div>
    </main>
  );
}

