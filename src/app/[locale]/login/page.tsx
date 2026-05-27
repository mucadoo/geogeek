'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, UserCircle, KeyRound, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Link, useRouter } from '@/i18n/routing';
import { useUserStore } from '@/store/useUserStore';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const { login, currentUser } = useUserStore();
  
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // If already logged in, redirect to home
  useEffect(() => {
    if (currentUser) {
      router.push('/');
    }
  }, [currentUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    const result = login(username.trim());
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-[var(--primary)] mb-8 transition-colors font-game-mono text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] rounded-3xl p-10 shadow-2xl backdrop-blur-xl relative">
          <div className="bg-[var(--primary)]/10 text-[var(--primary)] mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl">
            <UserCircle size={40} />
          </div>

          <h1 className="text-4xl font-game-heading tracking-widest text-[var(--foreground)] uppercase text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-center font-game-mono text-xs text-slate-500 uppercase tracking-tighter mb-10">
            Login to your explorer profile
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-bebas text-sm text-slate-400 tracking-widest uppercase ml-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  autoFocus
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-[var(--card-border)] rounded-2xl font-game-mono text-sm outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-in shake duration-300">
                <AlertCircle size={16} />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--primary)] text-white py-4 rounded-2xl font-game-heading text-xl tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--primary)]/20"
            >
              LOGIN
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--card-border)] text-center">
            <p className="font-game-mono text-[10px] text-slate-500 uppercase tracking-widest mb-4">
              Don't have an account?
            </p>
            <Link 
              href="/register" 
              className="text-[var(--primary)] font-bold font-game-mono text-xs hover:underline uppercase tracking-tighter"
            >
              Create an Explorer Profile ➔
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </main>
  );
}
