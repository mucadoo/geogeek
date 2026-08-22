'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { games } from '@/config/gamesList';

interface LeaderboardEntry {
  username: string;
  masteryPoints: number;
  score: number;
  totalToGuess: number;
  difficulty: string;
  createdAt: number;
}

const medalColors = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

export default function LeaderboardClient() {
  const t = useTranslations('Games');
  const [gameKey, setGameKey] = useState(games[0].id);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', gameKey],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/${gameKey}`);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      return res.json() as Promise<{ entries: LeaderboardEntry[] }>;
    },
  });

  return (
    <main className="container-custom animate-in fade-in flex-grow py-12 duration-1000 relative z-10">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-game-mono font-bold text-primary uppercase tracking-widest border border-primary/20">
          <Trophy size={16} /> Global Rankings
        </div>
        <h1 className="mb-6 text-6xl md:text-7xl font-game-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] via-[#00d2ff] to-[var(--accent)] drop-shadow-sm uppercase leading-none pb-2">
          Leaderboard
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-game-mono text-[var(--foreground)] opacity-70 leading-relaxed">
          See how you stack up against explorers around the world.
        </p>
      </header>

      <div className="mx-auto mb-10 flex max-w-xl flex-wrap justify-center gap-2">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setGameKey(game.id)}
            className={`rounded-full px-4 py-2 text-xs font-game-heading tracking-widest uppercase transition-all border ${
              gameKey === game.id
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                : 'bg-[var(--card-bg)]/50 backdrop-blur-sm text-slate-500 border-[var(--card-border)] hover:border-primary/50 hover:text-[var(--foreground)]'
            }`}
          >
            {t(`gameData.${game.id}.title`)}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-2xl rounded-3xl bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] p-6 shadow-lg">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : data && data.entries.length > 0 ? (
          <div className="space-y-2">
            {data.entries.map((entry, i) => (
              <div
                key={`${entry.username}-${i}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--input-bg)]/50 border border-[var(--card-border)]/50 px-5 py-3"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 text-center font-game-heading text-lg ${i < 3 ? medalColors[i] : 'text-slate-400'}`}>
                    {i < 3 ? <Medal size={20} className="inline" /> : `#${i + 1}`}
                  </span>
                  <span className="font-game-heading uppercase tracking-widest text-[var(--foreground)]">{entry.username}</span>
                </div>
                <div className="flex items-center gap-2 font-game-mono text-primary font-bold">
                  <Sparkles size={14} /> {entry.masteryPoints.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Trophy size={32} className="mb-4 opacity-50" />
            <p className="font-game-mono text-sm">No scores saved for this game yet. Be the first!</p>
          </div>
        )}
      </div>
    </main>
  );
}
