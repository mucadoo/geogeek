'use client';

import { clsx, type ClassValue } from 'clsx';
import { Home, Globe, BarChart3, Gamepad2, Languages } from 'lucide-react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { Link, usePathname, useRouter } from '@/i18n/routing';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems =[
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
  const router = useRouter();
  
  // Determine if the current route should be fullscreen
  const isFullscreen = pathname === '/map' || (pathname.startsWith('/games/') && pathname !== '/games');

  // If in a game session (or game screen), hide the header entirely
  if (isFullscreen) return null;

  const onLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="relative mx-auto flex h-[90px] w-full max-w-[1400px] items-center">
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1400px] items-center justify-between px-4">
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
                      href={item.href as any}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] tracking-widest uppercase transition-all duration-300 shadow-sm",
                        isActive 
                          ? "bg-white text-[#2c3e50] border border-gray-100" 
                          : "bg-white/70 backdrop-blur-md text-[#2c3e50]/75 hover:text-primary hover:bg-white"
                      )}
                    >
                      <Icon size={15} className={isActive ? "text-primary" : "text-[#2c3e50]/50"} />
                      <span className="hidden md:inline">{item.labelKey === 'HOME' ? 'HOME' : t(item.labelKey.toLowerCase())}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-full font-semibold text-[13px] text-[#2c3e50]/75 hover:bg-white transition-all shadow-sm">
              <Languages size={15} className="text-[#2c3e50]/50" />
              <span className="uppercase">{locale}</span>
            </button>
            <div className="absolute right-0 mt-2 w-24 bg-white rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border border-gray-100 p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange(lang.code)}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl text-[12px] font-bold transition-colors",
                    locale === lang.code 
                      ? "bg-gray-100 text-primary" 
                      : "text-[#2c3e50]/70 hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
