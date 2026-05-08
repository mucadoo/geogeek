'use client';

import { clsx, type ClassValue } from 'clsx';
import { Home, Globe, BarChart3, Gamepad2, Languages, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

import { Link, usePathname, useRouter, routing } from '@/i18n/routing';
import { useGameStore } from '@/store/useGameStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  href: string;
  labelKey: 'HOME' | 'EXPLORER' | 'RANKINGS' | 'GAMES';
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'HOME', icon: Home },
  { href: '/map', labelKey: 'EXPLORER', icon: Globe },
  { href: '/rankings', labelKey: 'RANKINGS', icon: BarChart3 },
  { href: '/games', labelKey: 'GAMES', icon: Gamepad2 },
];

const languages = [
  { code: 'en', name: 'EN' },
  { code: 'pt', name: 'PT' },
  { code: 'es', name: 'ES' },
  { code: 'fr', name: 'FR' },
  { code: 'it', name: 'IT' },
];

export default function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { status } = useGameStore();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'playing') return null;

  const isMapPage = pathname === '/map';

  const onLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};max-age=31536000;path=/;SameSite=Lax`;

    const path = window.location.pathname;
    const locales = routing.locales;
    
    const isPrefixed = locales.some(locale => path.startsWith(`/${locale}/`) || path === `/${locale}`);

    if (isPrefixed) {
      const segments = path.split('/');
      segments[1] = newLocale;
      const newPath = segments.join('/');
      window.location.href = `${newPath}${window.location.search}${window.location.hash}`;
    } else {
      window.location.reload();
    }
  };

  return (
    <header className={cn(
      "z-50 w-full flex h-[90px] items-center",
      isMapPage ? "fixed top-0 left-0" : "relative mx-auto max-w-[1400px]"
    )}>
      <div className={cn(
        "mx-auto flex w-full items-center justify-between px-4",
        isMapPage ? "max-w-none backdrop-blur-md bg-white/50 dark:bg-black/50 py-4 shadow-sm" : "max-w-[1400px]"
      )}>
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image 
            src="/media/logo.png" 
            alt="Geogeek logo" 
            width={140} 
            height={40}
            className="h-auto w-auto object-contain drop-shadow-md" 
            priority
          />      
        </Link>
        <div className="flex items-center gap-4">
          <nav>
            <ul className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href as "/"}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] tracking-widest uppercase transition-all duration-300 shadow-sm",
                        isActive 
                          ? "bg-white dark:bg-slate-800 text-[#2c3e50] dark:text-white border border-gray-100 dark:border-slate-700" 
                          : "bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-[#2c3e50]/75 dark:text-slate-300 hover:text-primary dark:hover:text-primary hover:bg-white dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon size={15} className={isActive ? "text-primary" : "text-[#2c3e50]/50 dark:text-slate-400"} />
                      <span className="hidden md:inline">{item.labelKey === 'HOME' ? 'HOME' : t(item.labelKey.toLowerCase() as any)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center p-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-full text-[#2c3e50]/75 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-[var(--color-accent)]" /> : <Moon size={18} className="text-[var(--color-primary)]" />}
              </button>
            )}

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-full font-semibold text-[13px] text-[#2c3e50]/75 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <Languages size={15} className="text-[#2c3e50]/50 dark:text-slate-400" />
                <span className="uppercase">{locale}</span>
              </button>
              <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-slate-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100 dark:border-slate-700 p-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-xl text-[12px] font-bold transition-colors",
                      locale === lang.code 
                        ? "bg-gray-100 dark:bg-slate-700 text-primary" 
                        : "text-[#2c3e50]/70 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary"
                    )}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
