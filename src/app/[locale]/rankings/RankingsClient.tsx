'use client';

import { useTranslations } from 'next-intl';

import { RANKING_CATEGORIES } from '@/config/rankingsConfig';
import { Link } from '@/i18n/routing';

export default function RankingsClient() {
  const t = useTranslations('Rankings');

  return (
    <main className="container-custom animate-in fade-in mt-10 mb-20 flex-grow duration-1000">
      <h1 className="mb-16 text-center text-[36px] font-medium tracking-tight text-[#2c3e50]">{t('title')}</h1>
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RANKING_CATEGORIES.map((category) => (
          <Link 
            key={category.slug}
            href={`/rankings/${category.slug}` as any}
            className="hover:border-primary/20 group flex h-[140px] items-center justify-center rounded-2xl border border-gray-100 bg-white px-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,168,181,0.1)]"
          >
            <h3 className="group-hover:text-primary text-[16px] font-medium text-gray-700 transition-colors">
              {t(`categories.${category.slug}`)}
            </h3>
          </Link>
        ))}
      </div>
    </main>
  );
}
