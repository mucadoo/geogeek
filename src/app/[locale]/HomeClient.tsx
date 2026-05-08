'use client';

import { Search, Globe, Gamepad2, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

export default function HomeClient() {
  const t = useTranslations('HomePage');

  // Programmatically trigger the Cmd+K Search Palette
  const openSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };
  
  return (
    <main className="container-custom animate-in fade-in flex flex-col flex-grow items-center justify-center duration-1000 py-12 relative z-10">
      <div className="flex w-full max-w-[1000px] flex-col items-center gap-10 mt-4 md:mt-12 text-center">

        {/* 1. Interactive Search Pill */}
        <button 
          onClick={openSearch}
          className="group flex items-center gap-3 px-6 py-3 rounded-full bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] hover:border-primary transition-all shadow-sm"
        >
           <Search size={18} className="text-slate-500 group-hover:text-primary transition-colors" />
           <span className="text-sm font-game-mono text-slate-500 group-hover:text-[var(--foreground)] transition-colors">
             Search countries, regions, or games...
           </span>
           <kbd className="ml-2 font-game-mono bg-[var(--input-bg)] rounded-md px-2 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest border border-[var(--card-border)]">
             ⌘K
           </kbd>
        </button>

        {/* 2. Massive Cinematic Hero Text */}
        <div className="flex flex-col items-center gap-6 max-w-4xl">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-game-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] via-[#00d2ff] to-[var(--accent)] drop-shadow-sm uppercase leading-none pb-2">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl font-game-mono text-[var(--foreground)] opacity-70 leading-relaxed max-w-2xl">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* 3. Glowing CTA Button */}
        <Link 
          href="/map" 
          className="flex items-center gap-3 bg-[var(--primary)] text-white px-10 py-4 rounded-full font-game-heading tracking-widest text-xl hover:bg-teal-400 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,168,181,0.3)] hover:shadow-[0_0_40px_rgba(0,168,181,0.6)] active:scale-95"
        >
          <Globe size={24} />
          {t('cta')}
        </Link>

        {/* 4. Quick Action Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 md:mt-16">
          <Link href="/map" className="game-card flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
             <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Globe size={32} />
             </div>
             <div>
                <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('cards.map.title')}</h3>
                <p className="text-xs font-game-mono text-slate-500 mt-2">{t('cards.map.desc')}</p>
             </div>
          </Link>

          <Link href="/games" className="game-card flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
             <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Gamepad2 size={32} />
             </div>
             <div>
               <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('cards.games.title')}</h3>
               <p className="text-xs font-game-mono text-slate-500 mt-2">{t('cards.games.desc')}</p>
             </div>
          </Link>

          <Link href="/rankings" className="game-card flex flex-col items-center text-center gap-4 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
             <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Trophy size={32} />
             </div>
             <div>
               <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('cards.rankings.title')}</h3>
               <p className="text-xs font-game-mono text-slate-500 mt-2">{t('cards.rankings.desc')}</p>
             </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
