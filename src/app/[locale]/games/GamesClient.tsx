'use client';

import { Map, Play, MapPin, Globe, Search, Star, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useMemo } from 'react';

import { Link } from '@/i18n/routing';
import { useGameStore } from '@/store/useGameStore';
import { GameCategory } from '@/types';

const games = [
  {
    id: 'us-states',
    icon: Map,
    href: '/games/us-states',
    color: 'bg-blue-500',
    category: GameCategory.REGIONS,
    count: 50,
    difficulty: 2,
  },
  {
    id: 'us-capitals',
    icon: MapPin,
    href: '/games/us-capitals',
    color: 'bg-indigo-500',
    category: GameCategory.CAPITALS,
    count: 50,
    difficulty: 3,
  },
  {
    id: 'sa-countries',
    icon: Globe,
    href: '/games/south-america-countries',
    color: 'bg-green-500',
    category: GameCategory.CONTINENTS,
    count: 12,
    difficulty: 1,
  },
  {
    id: 'sa-capitals',
    icon: MapPin,
    href: '/games/south-america-capitals',
    color: 'bg-emerald-600',
    category: GameCategory.CAPITALS,
    count: 12,
    difficulty: 2,
  },
  {
    id: 'brazil-states',
    icon: Map,
    href: '/games/brazil-states',
    color: 'bg-green-600',
    category: GameCategory.REGIONS,
    count: 27,
    difficulty: 2,
  },
  {
    id: 'italy-regions',
    icon: Map,
    href: '/games/italy-regions',
    color: 'bg-red-500',
    category: GameCategory.REGIONS,
    count: 20,
    difficulty: 2,
  },
  {
    id: 'france-regions',
    icon: Map,
    href: '/games/france-regions',
    color: 'bg-blue-600',
    category: GameCategory.REGIONS,
    count: 18,
    difficulty: 2,
  },
  {
    id: 'canada-provinces',
    icon: Map,
    href: '/games/canada-provinces',
    color: 'bg-red-600',
    category: GameCategory.REGIONS,
    count: 13,
    difficulty: 1,
  },
  {
    id: 'australia-states',
    icon: Map,
    href: '/games/australia-states',
    color: 'bg-amber-600',
    category: GameCategory.REGIONS,
    count: 8,
    difficulty: 1,
  },
];

const categories: GameCategory[] = [GameCategory.ALL, GameCategory.CONTINENTS, GameCategory.REGIONS, GameCategory.CAPITALS];

export default function GamesClient() {
  const t = useTranslations('Games');
  const [activeCategory, setActiveCategory] = useState<GameCategory>(GameCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const { highScores } = useGameStore();

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const title = t(`gameData.${game.id}.title`);
      const description = t(`gameData.${game.id}.description`);
      const matchesCategory = activeCategory === GameCategory.ALL || game.category === activeCategory;
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, t]);

  return (
    <main className="container-custom animate-in fade-in flex-grow py-12 duration-1000">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-game-mono font-bold text-primary uppercase tracking-widest">
          <Sparkles size={16} /> {t('subtitle')}
        </div>
        <h1 className="mb-4 text-5xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
          {t('title')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-game-mono text-gray-500 dark:text-gray-400">
          {t('description')}
        </p>
      </header>

      <div className="mx-auto mb-10 flex w-full max-w-5xl flex-col items-center justify-between gap-6 game-card border-2 border-dashed border-[var(--card-border)] p-4 md:flex-row shadow-none">
        <div className="flex w-full flex-wrap gap-2 md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 rounded-full px-6 py-2.5 text-sm font-game-heading tracking-widest uppercase transition-all md:flex-none ${
                activeCategory === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-[var(--input-bg)] text-slate-500 hover:text-[var(--foreground)]'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-2 border-[var(--card-border)] bg-[var(--input-bg)] py-2.5 pr-4 pl-11 text-sm font-game-mono outline-none transition-all focus:border-primary"
          />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => {
            const Icon = game.icon;
            return (
              <Link 
                key={game.id} 
                href={game.href as any}
                className="game-card group flex flex-col border-2 border-dashed border-[var(--card-border)] hover:border-primary transition-all shadow-none"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-1.5 text-[10px] font-game-mono font-bold text-slate-400 uppercase tracking-wider">
                    {t(`categories.${game.category}` as `categories.${GameCategory}`)} • {t('itemsCount', { count: game.count })}
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((star) => (
                      <Star key={star} size={12} className={star <= game.difficulty ? "text-accent fill-accent" : "text-slate-300"} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-grow flex-col">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg transition-transform group-hover:rotate-6">
                    <Icon size={32} />
                  </div>
                  <h2 className="mb-2 text-2xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">{t(`gameData.${game.id}.title`)}</h2>
                  <p className="mb-8 flex-grow leading-relaxed font-game-mono text-slate-500 dark:text-slate-400">
                    {t(`gameData.${game.id}.description`)}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between rounded-xl bg-[var(--input-bg)] px-4 py-3 group-hover:bg-primary/10">
                    <span className="font-game-heading uppercase tracking-widest text-sm text-slate-500 group-hover:text-primary">{t('startQuiz')}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card-bg)] text-slate-400 shadow-sm group-hover:bg-primary group-hover:text-white">
                      <Play size={14} fill="currentColor" className="ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="mb-2 text-xl font-game-heading uppercase text-[var(--foreground)]">{t('noGamesFound')}</h3>
            <p className="font-game-mono text-slate-500">{t('noGamesDescription')}</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveCategory(GameCategory.ALL); }}
              className="mt-6 font-game-heading text-primary uppercase tracking-widest hover:underline"
            >
              {t('clearFilters')}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
