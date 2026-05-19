import { BookOpen, Lightbulb, Users, Globe } from 'lucide-react';
import { SiGithub } from 'react-icons/si'; // Keep SiGithub for the project repo link
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/routing'; // Import Link for internal navigation

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('AboutPage');

  return (
    <main className="container-custom animate-in fade-in flex flex-col flex-grow items-center justify-center duration-1000 py-12 relative z-10">
      <div className="flex w-full max-w-[1000px] flex-col items-center gap-10 mt-4 md:mt-12 text-center">

        {/* Hero Section */}
        <div className="flex flex-col items-center gap-6 max-w-4xl">
          <h1 className="text-[48px] font-game-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary)] via-[#00d2ff] to-[var(--accent)] drop-shadow-sm uppercase leading-none pb-2">
            {t('title')}
          </h1>
          <p className="text-lg md:text-xl font-game-mono text-[var(--foreground)] opacity-70 leading-relaxed max-w-2xl">
            {t('intro')}
          </p>
        </div>

        {/* Creator and Project Info */}
        <div className="text-center mt-12 flex flex-col items-center gap-4">
          <p className="text-2xl font-game-heading tracking-wider text-[var(--foreground)]">{t('creatorName')}</p>
          <div className="flex gap-4">
            <Link href="https://mucadoo.dev" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--primary)] hover:underline font-game-mono text-md transition-colors">
              <Globe size={20} />
              {t('websiteProfile')}
            </Link>
            <Link href="https://github.com/mucadoo/geo-geek" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--primary)] hover:underline font-game-mono text-md transition-colors">
              <SiGithub size={20} />
              {t('projectGithub')}
            </Link>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 md:mt-16">
          {/* Passion Card */}
          <div className="game-card flex flex-col items-center text-center gap-4 p-6 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
            <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <div>
              <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('myPassion')}</h3>
              <p className="text-xs font-game-mono text-slate-500 mt-2">{t('passion')}</p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="game-card flex flex-col items-center text-center gap-4 p-6 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
            <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
              <Lightbulb size={32} />
            </div>
            <div>
              <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('myVision')}</h3>
              <p className="text-xs font-game-mono text-slate-500 mt-2">{t('vision')}</p>
            </div>
          </div>

          {/* Invitation Card */}
          <div className="game-card flex flex-col items-center text-center gap-4 p-6 hover:-translate-y-2 transition-all duration-300 hover:border-primary group">
            <div className="p-4 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <div>
              <h3 className="text-xl font-game-heading tracking-wider text-[var(--foreground)]">{t('joinJourney')}</h3>
              <p className="text-xs font-game-mono text-slate-500 mt-2">{t('invitation')}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}