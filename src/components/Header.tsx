'use client';

import { Home, Globe, BarChart3, Gamepad2, Languages, Sun, Moon, Info, Scale } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Link, usePathname, routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import UserMenu from '@/components/UserMenu';

interface NavItem {
  href: string;
  labelKey: 'HOME' | 'EXPLORER' | 'RANKINGS' | 'GAMES' | 'COMPARE' | 'ABOUT';
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'HOME', icon: Home },
  { href: '/map', labelKey: 'EXPLORER', icon: Globe },
  { href: '/rankings', labelKey: 'RANKINGS', icon: BarChart3 },
  { href: '/games', labelKey: 'GAMES', icon: Gamepad2 },
  { href: '/compare', labelKey: 'COMPARE', icon: Scale },
  { href: '/about', labelKey: 'ABOUT', icon: Info },
];

const languages = [
  { code: 'en', name: 'EN' },
  { code: 'de', name: 'DE' },
  { code: 'es', name: 'ES' },
  { code: 'fr', name: 'FR' },
  { code: 'it', name: 'IT' },
  { code: 'ja', name: 'JA' },
  { code: 'pt', name: 'PT' },
  { code: 'ru', name: 'RU' },
  { code: 'zh', name: 'ZH' },
];

export default function Header() {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const locale = useLocale();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { status } = useGameStore();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isGameRoute = pathname.includes('/games/') && status === 'playing';
  const isModalOpen = status === 'idle' || status === 'finished';

  if (isGameRoute) return null;

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
    <header className={cn("z-50 w-full flex h-[90px] items-center relative mx-auto max-w-[1400px]", isModalOpen ? "backdrop-blur-2xl" : "")}>
      <div className="mx-auto flex w-full items-center justify-between px-4 max-w-[1400px] transition-all duration-300">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Globe className="text-[var(--primary)]" size={32} strokeWidth={2.5} />
          <span className="font-game-heading text-3xl tracking-widest text-[var(--foreground)] uppercase mt-1">GeoGeek</span>
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
                        "flex items-center gap-2 px-5 py-2.5 rounded-full font-game-heading text-lg tracking-widest uppercase transition-all duration-300 shadow-sm border",
                        isActive 
                          ? "bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--card-border)]" 
                          : "bg-[var(--card-bg)]/70 backdrop-blur-md text-[var(--foreground)]/70 hover:text-[var(--primary)] hover:bg-[var(--card-bg)] border-transparent"
                      )}
                    >
                      <Icon size={18} className={isActive ? "text-[var(--primary)]" : "opacity-70"} />
                      <span className="hidden md:inline">{item.labelKey === 'HOME' ? 'HOME' : t(item.labelKey.toLowerCase() as Parameters<typeof t>[0])}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center p-2.5 bg-[var(--card-bg)]/70 backdrop-blur-md rounded-full text-[var(--foreground)]/70 hover:text-[var(--primary)] hover:bg-[var(--card-bg)] border border-transparent transition-all shadow-sm"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun size={18} className="text-[var(--primary)]" /> : <Moon size={18} className="text-[var(--primary)]" />}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--card-bg)]/70 backdrop-blur-md rounded-full font-game-heading text-lg text-[var(--foreground)]/70 hover:text-[var(--primary)] hover:bg-[var(--card-bg)] border border-transparent transition-all shadow-sm outline-none">
                  <Languages size={18} className="opacity-70" />
                  <span className="uppercase">{locale}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-24 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] p-1 z-[100]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => onLanguageChange(lang.code)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-xl font-game-mono text-sm transition-colors cursor-pointer outline-none",
                      locale === lang.code 
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] focus:bg-[var(--primary)]/15 focus:text-[var(--primary)]" 
                        : "text-[var(--foreground)] focus:bg-[var(--primary)]/10 focus:text-[var(--primary)]"
                    )}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}