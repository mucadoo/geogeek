'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useUserStore } from '@/store/useUserStore';
import { useGameStore } from '@/store/useGameStore';
import { UserCircle, Edit2, Trash2, Trophy, Sparkles, Check, X, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function ProfileClient() {
  const t = useTranslations('Games'); // Reusing Games translations for game titles
  const router = useRouter();
  
  const { currentUser, updateUsername, deleteAccount } = useUserStore();
  const { highScores } = useGameStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  // Redirect to home if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/');
    } else {
      setEditName(currentUser.username);
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const handleSaveName = () => {
    setError('');
    if (editName.trim() === currentUser.username) {
      setIsEditing(false);
      return;
    }
    if (editName.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    const result = updateUsername(editName.trim());
    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.error || 'Failed to update');
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your profile? This cannot be undone.")) {
      deleteAccount();
    }
  };

  // Convert highscores object to an array and sort by highest score
  const scoreEntries = Object.entries(highScores)
    .filter(([_, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <main className="container-custom flex-grow relative z-10 py-12 animate-in fade-in duration-1000">
      
      <header className="mb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
          Explorer Profile
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-game-mono text-slate-500 mt-4">
          View your stats, manage your account, and track your mastery.
        </p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: User Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="game-card flex flex-col items-center text-center p-8 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] rounded-3xl">
            <div className="relative mb-6">
              <div className="h-28 w-28 rounded-full bg-primary/10 text-primary flex items-center justify-center border-4 border-primary/20">
                <UserCircle size={64} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground h-10 w-10 rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--card-bg)]">
                <Trophy size={18} />
              </div>
            </div>

            {isEditing ? (
              <div className="w-full flex flex-col items-center gap-2 animate-in fade-in">
                <input 
                  autoFocus
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-primary text-center px-4 py-2 rounded-xl font-game-mono outline-none"
                />
                {error && <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">{error}</span>}
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={handleSaveName} className="flex-1 bg-primary text-white py-2 rounded-lg flex justify-center hover:bg-teal-500 transition-colors"><Check size={18} /></button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg flex justify-center hover:bg-red-500/20 transition-colors"><X size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
                  {currentUser.username}
                </h2>
                <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-primary transition-colors">
                  <Edit2 size={16} />
                </button>
              </div>
            )}

            <div className="w-full mt-8 pt-6 border-t border-[var(--card-border)] flex flex-col items-center">
              <span className="text-xs font-game-mono text-slate-500 uppercase tracking-widest mb-2">Total Mastery</span>
              <div className="flex items-center gap-2 text-primary font-bold text-2xl font-game-mono">
                <Sparkles size={20} className="animate-pulse" />
                {currentUser.totalMasteryPoints.toLocaleString()} PTS
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="game-card p-6 border-red-500/20 bg-red-500/5 rounded-3xl">
            <h3 className="font-bebas text-xl text-red-500 tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> Danger Zone
            </h3>
            <button 
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-game-mono text-xs uppercase font-bold tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </div>

        {/* Right Column: High Scores */}
        <div className="md:col-span-2">
          <div className="game-card h-full flex flex-col p-8 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] rounded-3xl">
            <h3 className="font-bebas text-3xl tracking-widest text-[var(--foreground)] uppercase mb-6 flex items-center gap-3">
              <Trophy className="text-accent" /> High Scores
            </h3>
            
            <div className="flex-grow">
              {scoreEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scoreEntries.map(([key, score]) => {
                    // Try to extract a clean title from your Games translation
                    let title = key;
                    try { title = t(`gameData.${key}.title` as any) || key; } catch { /* ignore */ }

                    return (
                      <div key={key} className="flex flex-col p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-primary/50 transition-colors">
                        <span className="font-game-mono text-[10px] text-slate-500 uppercase tracking-widest mb-1">{title}</span>
                        <div className="flex items-end justify-between">
                          <span className="font-game-heading text-2xl text-[var(--foreground)]">{score.toLocaleString()}</span>
                          <span className="font-game-mono text-xs text-primary font-bold">PTS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-4 py-12">
                  <div className="p-4 bg-[var(--input-bg)] rounded-full">
                    <Trophy size={32} className="opacity-50" />
                  </div>
                  <p className="font-game-mono text-sm max-w-[250px]">
                    You haven't completed any games yet. Start exploring to earn Mastery Points!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
