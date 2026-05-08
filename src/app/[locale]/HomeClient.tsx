'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';

export default function HomeClient() {
  const t = useTranslations('HomePage');
  
  return (
    <main className="container-custom animate-in fade-in flex flex-grow items-center justify-center duration-1000 py-12">
        <div className="flex w-full max-w-[1000px] flex-col items-center gap-16 md:flex-row">
          
          <div className="group relative w-full flex-1 game-card p-2 shadow-none">
            <Image 
              src="/media/main_argentina.png" 
              alt="Interactive Map Preview" 
              width={500} 
              height={400}
              className="h-auto w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>

          <div className="flex flex-1 flex-col items-start text-left">
            <h1 className="mb-6 text-[48px] font-game-heading leading-tight tracking-wider text-[var(--foreground)]">
              {t('title')}
            </h1>
            <div className="mb-8 p-6 bg-[var(--card-bg)] border-2 border-dashed border-[var(--card-border)] rounded-2xl">
                <p className="text-[16px] leading-relaxed font-game-mono text-gray-500 dark:text-gray-400">
                  {t.rich('description', {
                    brand: (chunks) => <strong className="font-bold text-[var(--foreground)]">{chunks}</strong>
                  })}
                </p>
            </div>
            <Link href="/map" className="flex items-center gap-2 font-game-heading tracking-widest text-primary transition-colors hover:text-teal-600">
              {t('cta')} <span className="transition-transform group-hover:translate-x-2">→</span>
            </Link>
          </div>

        </div>
    </main>
  );
}
