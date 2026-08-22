'use client';

import { Play, Search, Star, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useMemo } from 'react';

import { games, mechanics, GameListEntry } from '@/config/gamesList';
import { Link } from '@/i18n/routing';
import { useGameStore } from '@/store/useGameStore';

function GameCard({ game, highScore, t, compact }: {
  game: GameListEntry;
  highScore: number;
  t: ReturnType<typeof useTranslations>;
  compact?: boolean;
}) {
  const Icon = game.icon;

  return (
    <Link
      href={game.href as any}
      className={`group flex flex-col rounded-3xl bg-[var(--card-bg)]/80 backdrop-blur-md border-2 border-dashed border-[var(--card-border)] hover:border-primary hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(0,168,181,0.15)] active:scale-[0.98] transition-all duration-300 relative overflow-hidden ${compact ? 'p-5' : 'p-6'}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 text-[10px] font-game-mono font-bold text-slate-400 uppercase tracking-wider">
          {t('itemsCount', { count: game.count })}
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3].map((star) => (
            <Star key={star} size={12} className={star <= game.difficulty ? "text-accent fill-accent" : "text-slate-300"} />
          ))}
        </div>
      </div>

      <div className="flex flex-grow flex-col">
        <div className={`mb-6 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}>
          <Icon size={compact ? 24 : 32} />
        </div>
        <h2 className={`mb-2 font-game-heading tracking-widest text-[var(--foreground)] uppercase ${compact ? 'text-xl' : 'text-2xl'}`}>{t(`gameData.${game.id}.title`)}</h2>
        <p className="mb-6 flex-grow leading-relaxed font-game-mono text-sm text-slate-500 dark:text-slate-400">
          {t(`gameData.${game.id}.description`)}
        </p>

        {highScore > 0 && (
          <div className="mb-6 flex items-center gap-1.5 font-game-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-3 py-1.5 rounded-lg w-fit">
            <Trophy size={14} className="text-teal-500" />
            Best: {highScore} / {game.count}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between rounded-xl bg-[var(--input-bg)]/50 border border-[var(--card-border)]/50 px-4 py-3 group-hover:bg-primary/10 group-hover:border-primary/25 transition-all duration-300">
          <span className="font-game-heading uppercase tracking-widest text-sm text-slate-500 group-hover:text-primary transition-colors">{t('startQuiz')}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--card-bg)] text-slate-400 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
            <Play size={14} fill="currentColor" className="ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GamesClient() {
  const t = useTranslations('Games');
  const [searchQuery, setSearchQuery] = useState('');
  const highScores = useGameStore((state) => state.highScores);
  const savedGames = useGameStore((state) => state.savedGames);

  const inProgressGames = useMemo(() => {
    return Object.keys(savedGames)
      .map((gameKey) => games.find((g) => g.id === gameKey))
      .filter((g): g is GameListEntry => !!g);
  }, [savedGames]);

  const searchedGames = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return games.filter((game) => {
      const title = t(`gameData.${game.id}.title`);
      const description = t(`gameData.${game.id}.description`);
      return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, t]);

  return (
    <main className="container-custom animate-in fade-in flex-grow py-12 duration-1000 relative z-10">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-game-mono font-bold text-primary uppercase tracking-widest border border-primary/20">
          <Sparkles size={16} /> {t('subtitle')}
        </div>
        <h1 className="mb-6 text-6xl md:text-8xl font-game-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] via-[#00d2ff] to-[var(--accent)] drop-shadow-sm uppercase leading-none pb-2">
          {t('title')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-game-mono text-[var(--foreground)] opacity-70 leading-relaxed">
          {t('description')}
        </p>
      </header>

      <div className="mx-auto mb-14 flex w-full max-w-xl flex-col items-center gap-6">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/80 backdrop-blur-md py-3 pr-4 pl-11 text-sm font-game-mono outline-none shadow-lg transition-all focus:border-primary focus:bg-[var(--card-bg)]"
          />
        </div>

        {!searchQuery && (
          <div className="flex flex-wrap justify-center gap-2">
            {mechanics.map((m) => (
              <a
                key={m.id}
                href={`#mechanic-${m.id}`}
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-game-heading tracking-widest uppercase border bg-[var(--card-bg)]/50 backdrop-blur-sm text-slate-500 border-[var(--card-border)] hover:border-primary/50 hover:text-primary transition-all"
              >
                <m.icon size={13} /> {m.label}
              </a>
            ))}
          </div>
        )}
      </div>

      {searchedGames ? (
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {searchedGames.length > 0 ? (
            searchedGames.map((game) => (
              <GameCard key={game.id} game={game} highScore={highScores[game.id] || 0} t={t} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] text-slate-400">
                <Search size={32} />
              </div>
              <h3 className="mb-2 text-xl font-game-heading uppercase text-[var(--foreground)]">{t('noGamesFound')}</h3>
              <p className="font-game-mono text-slate-500">{t('noGamesDescription')}</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 font-game-heading text-primary uppercase tracking-widest hover:underline"
              >
                {t('clearFilters')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-16">
          {inProgressGames.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
                <RotateCcw className="text-primary" size={22} /> Continue Playing
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inProgressGames.map((game) => (
                  <GameCard key={game.id} game={game} highScore={highScores[game.id] || 0} t={t} compact />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 flex items-center gap-3 text-2xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
              <Sparkles className="text-accent" size={22} /> New &amp; Different
            </h2>
            <p className="mb-6 font-game-mono text-sm text-slate-500 max-w-2xl">
              Not another reskin — genuinely different ways to play.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.filter((g) => g.featured).map((game) => (
                <GameCard key={game.id} game={game} highScore={highScores[game.id] || 0} t={t} />
              ))}
            </div>
          </section>

          {mechanics.map((mechanic) => {
            const mechanicGames = games.filter((g) => g.mechanic === mechanic.id);
            if (mechanicGames.length === 0) return null;

            return (
              <section key={mechanic.id} id={`mechanic-${mechanic.id}`} className="scroll-mt-28">
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <mechanic.icon size={18} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-game-heading tracking-widest text-[var(--foreground)] uppercase leading-none mb-1">
                      {mechanic.label}
                    </h2>
                    <p className="font-game-mono text-sm text-slate-500">{mechanic.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {mechanicGames.map((game) => (
                    <GameCard key={game.id} game={game} highScore={highScores[game.id] || 0} t={t} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
