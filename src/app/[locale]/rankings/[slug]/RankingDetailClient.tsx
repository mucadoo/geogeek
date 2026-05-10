'use client';

import { ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useMemo } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Link } from '@/i18n/routing';
import { getLocalizedCountryName } from '@/lib/i18n-utils';

interface RankingItem {
  country: string;
  value: string | number;
  isoCode: string;
}

interface RankingDetailClientProps {
  initialRankings: RankingItem[];
  locale: string;
  slug: string;
  valueLabel: string;
}

type SortConfig = {
  key: 'rank' | 'country' | 'value';
  direction: 'asc' | 'desc';
};

export default function RankingDetailClient({
  initialRankings,
  locale,
  slug,
  valueLabel,
}: RankingDetailClientProps) {
  const t = useTranslations('Rankings');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'rank', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate max value for progress bars
  const maxValue = useMemo(() => {
    return Math.max(...initialRankings.map(item => {
      const val = typeof item.value === 'string' ? parseFloat(item.value.replace(/,/g, '')) : item.value;
      return isNaN(val as number) ? 0 : (val as number);
    }));
  }, [initialRankings]);

  const filteredRankings = useMemo(() => {
    const itemsWithRank = initialRankings.map((item, index) => ({ ...item, defaultRank: index + 1 }));
    
    let filtered = itemsWithRank;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = itemsWithRank.filter(item => 
        getLocalizedCountryName(item.isoCode, locale).toLowerCase().includes(query) ||
        item.isoCode.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortConfig.key === 'rank') {
        valA = a.defaultRank;
        valB = b.defaultRank;
      } else if (sortConfig.key === 'country') {
        valA = getLocalizedCountryName(a.isoCode, locale);
        valB = getLocalizedCountryName(b.isoCode, locale);
      } else {
        valA = typeof a.value === 'string' ? parseFloat(a.value.replace(/,/g, '')) : a.value;
        valB = typeof b.value === 'string' ? parseFloat(b.value.replace(/,/g, '')) : b.value;
        if (isNaN(valA)) valA = -Infinity;
        if (isNaN(valB)) valB = -Infinity;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [initialRankings, sortConfig, locale, searchQuery]);

  const requestSort = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={14} className="ml-1 text-[var(--primary)]" /> 
      : <ArrowDown size={14} className="ml-1 text-[var(--primary)]" />;
  };

  const renderValue = (item: any) => {
    const val = typeof item.value === 'string' ? parseFloat(item.value.replace(/,/g, '')) : item.value;
    if (!item.value || val === -Infinity) return t('table.na');

    const percentage = maxValue > 0 ? (val / maxValue) * 100 : 0;
    
    let displayValue = item.value.toLocaleString(locale);
    if (slug === 'gdp') displayValue = '$' + item.value.toLocaleString(locale);
    if (slug === 'hdi') displayValue = item.value.toFixed(3);

    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="font-game-mono text-sm">
          {displayValue}
        </span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--card-border)]/30 md:w-32">
          <div 
            className="h-full bg-[var(--primary)] transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(2, percentage)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <main className="container-custom animate-in fade-in mt-10 mb-20 flex-grow duration-1000">
      <div className="relative mx-auto mb-12 w-full max-w-[900px]">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-6">
            <Link href="/rankings" className="hover:text-[var(--primary)] p-2 text-slate-500 transition-colors">
              <ArrowLeft size={28} strokeWidth={1.5} />
            </Link>
            <h1 className="text-4xl md:text-5xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
              {t(`categories.${slug as any}`)}
            </h1>
          </div>

          <div className="relative w-full max-w-md md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/50 py-3 pl-12 pr-6 font-game-mono text-sm outline-none transition-all focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] game-card shadow-none p-0 overflow-hidden border-none bg-transparent">
        <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-[var(--background)]/50">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead 
                  className="w-20 text-center cursor-pointer hover:text-[var(--primary)] transition-colors py-6"
                  onClick={() => requestSort('rank')}
                >
                  <div className="flex items-center justify-center">
                    {t('table.rank')} {getSortIcon('rank')}
                  </div>
                </TableHead>
                <TableHead 
                  className="pl-4 cursor-pointer hover:text-[var(--primary)] transition-colors py-6"
                  onClick={() => requestSort('country')}
                >
                  <div className="flex items-center">
                    {t('table.country')} {getSortIcon('country')}
                  </div>
                </TableHead>
                <TableHead 
                  className="pr-8 text-right cursor-pointer hover:text-[var(--primary)] transition-colors py-6"
                  onClick={() => requestSort('value')}
                >
                  <div className="flex items-center justify-end">
                    {valueLabel} {getSortIcon('value')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRankings.length > 0 ? (
                filteredRankings.map((item) => (
                  <TableRow key={item.isoCode} className="group">
                    <TableCell className="text-center font-semibold text-[var(--foreground)] opacity-30 group-hover:opacity-100 transition-opacity">
                      {item.defaultRank}
                    </TableCell>
                    <TableCell className="pl-4">
                      <Link 
                        href={`/map/${item.isoCode}` as any} 
                        className="flex items-center gap-4 hover:text-[var(--primary)] text-[17px] font-medium text-[var(--foreground)] transition-colors"
                      >
                        <img 
                          src={`https://flagcdn.com/w40/${item.isoCode.toLowerCase()}.png`}
                          alt=""
                          className="h-6 w-8 rounded-sm object-cover shadow-sm border border-[var(--card-border)]/50"
                        />
                        {getLocalizedCountryName(item.isoCode, locale)}
                      </Link>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      {renderValue(item)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-20 text-center text-slate-500 font-game-mono">
                    No countries found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
