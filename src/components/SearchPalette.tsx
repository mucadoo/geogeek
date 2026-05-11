'use client';

import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';
import { countryService } from '@/lib/countryService';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { Country } from '@/types';

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('Games');
  const locale = useLocale();

  // Load countries
  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: () => countryService.getAllCountries(),
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
                key={c.iso_code}
                onSelect={() => handleSelect(`/map/${c.iso_code.toLowerCase()}`)}
                className="px-4 py-2 cursor-pointer rounded-lg font-game-mono text-[var(--foreground)] aria-selected:bg-[var(--primary)]/10"
              >
                <div className="flex items-center gap-2">
                  <Image src={c.flagUrl} alt="" width={24} height={16} className="w-6 h-4 object-cover" />
                  <span>{getLocalizedCountryName(c.iso_code, locale)}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Games" className="font-game-heading text-lg tracking-widest text-slate-500 px-2 py-2">
            {/* Hardcoded based on GamesClient.tsx list */}
            {['us-states', 'us-capitals', 'sa-countries', 'sa-capitals', 'brazil-states', 'italy-regions', 'france-regions', 'canada-provinces', 'australia-states'].map((key) => (
              <Command.Item
                key={key}
                onSelect={() => handleSelect(`/games/${key}`)}
                className="px-4 py-2 cursor-pointer rounded-lg font-game-mono text-[var(--foreground)] aria-selected:bg-[var(--primary)]/10"
              >
                {t(`gameData.${key}.title`)}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
