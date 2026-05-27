'use client';

import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';
import { fetchCountries } from '@/lib/countryClient';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { Country } from '@/types';

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('Games');
  const locale = useLocale();

  // Load countries ONLY when the search box is toggled open
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: () => fetchCountries(),
    enabled: open, // <-- Performance Optimization: Saves massive initial load bandwidth
  });

  // Hotkey listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url as any);
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Search" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--card-border)]">
        <Command.Input 
            placeholder="Search countries or games..." 
            className="w-full px-4 py-4 text-lg bg-transparent text-[var(--foreground)] font-game-mono border-b border-[var(--card-border)] outline-none placeholder:text-slate-500" 
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="p-4 font-game-mono text-slate-500">No results found.</Command.Empty>
          
          <Command.Group heading="Countries" className="font-game-heading text-lg tracking-widest text-slate-500 px-2 py-2">
            {countries.map((c) => (
              <Command.Item
                key={c.isoCode || 'unknown'}
                onSelect={() => c.isoCode && handleSelect(`/map/${c.isoCode.toLowerCase()}`)}
                // Pass a composite string to make cmdk search across aliases, English name, and ISO codes
                value={`${getLocalizedCountryName(c.isoCode || '', locale)} ${c.isoCode} ${c.name.en || ''}`.toLowerCase()}
                className="px-4 py-2 cursor-pointer rounded-lg font-game-mono text-[var(--foreground)] aria-selected:bg-[var(--primary)]/10"
              >
                <div className="flex items-center gap-2">
                  {c.flagUrl ? (
                    <Image src={c.flagUrl} alt="" width={24} height={16} className="w-6 h-4 object-cover shadow-sm" />
                  ) : (
                    <div className="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                  )}
                  <span>{getLocalizedCountryName(c.isoCode || '', locale)}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Games" className="font-game-heading text-lg tracking-widest text-slate-500 px-2 py-2">
            {[
              { id: 'us-states', href: '/games/us-states' },
              { id: 'us-capitals', href: '/games/us-capitals' },
              { id: 'sa-countries', href: '/games/south-america-countries' },
              { id: 'sa-capitals', href: '/games/south-america-capitals' },
              { id: 'brazil-states', href: '/games/brazil-states' },
              { id: 'italy-regions', href: '/games/italy-regions' },
              { id: 'france-regions', href: '/games/france-regions' },
              { id: 'canada-provinces', href: '/games/canada-provinces' },
              { id: 'australia-states', href: '/games/australia-states' }
            ].map((game) => (
              <Command.Item
                key={game.id}
                onSelect={() => handleSelect(game.href)}
                className="px-4 py-2 cursor-pointer rounded-lg font-game-mono text-[var(--foreground)] aria-selected:bg-[var(--primary)]/10"
              >
                {t(`gameData.${game.id}.title`)}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
