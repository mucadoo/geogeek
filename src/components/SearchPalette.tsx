'use client';

import { useQuery } from '@tanstack/react-query';
import { Command } from 'cmdk';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

import { useRouter } from '@/i18n/routing';
import { countryService } from '@/lib/countryService';
import { getLocalizedCountryName } from '@/lib/i18n-utils';

export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('Games');
  const locale = useLocale();

  // Load countries
  const { data: countries = [] } = useQuery({
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
      <div className="w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100">
        <Command.Input placeholder="Search countries or games..." className="w-full px-4 py-4 text-lg border-b border-gray-100 outline-none" />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty>No results found.</Command.Empty>
          
          <Command.Group heading="Countries">
            {countries.map((c) => (
              <Command.Item
                key={c.ISO_code}
                onSelect={() => handleSelect(`/country/${c.ISO_code.toLowerCase()}`)}
                className="px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-100 aria-selected:bg-primary/10"
              >
                {getLocalizedCountryName(c.ISO_code, locale)}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Games">
            {/* Hardcoded based on GamesClient.tsx list */}
            {['us-states', 'us-capitals', 'sa-countries', 'sa-capitals', 'brazil-states', 'italy-regions', 'france-regions', 'canada-provinces', 'australia-states'].map((key) => (
              <Command.Item
                key={key}
                onSelect={() => handleSelect(`/games/${key}`)}
                className="px-4 py-2 cursor-pointer rounded-lg hover:bg-gray-100 aria-selected:bg-primary/10"
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
