'use client';

import { X, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { formatLargeNumber } from '@/lib/formatters';
import { getLocalizedValue } from '@/lib/i18n-utils';
import { Country } from '@/types';

interface MapSidebarProps {
  type: 'continent' | 'country';
  title: string;
  data?: Country;
}

export default function MapSidebar({ type, title, data }: MapSidebarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('CountryDetails');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-in slide-in-from-right fade-in duration-300 absolute bottom-0 right-0 z-40 flex h-[40vh] w-full flex-col overflow-hidden rounded-t-lg border-t-2 border-dashed border-[#8d99ae] bg-[var(--card-bg)] p-6 shadow-2xl backdrop-blur-md lg:bottom-auto lg:top-24 lg:right-4 lg:h-[80vh] lg:w-96 lg:rounded-lg lg:border-2 lg:border-l-2">
      {/* Perforated edge effect */}
      <div className="absolute -left-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-r-2 border-dashed border-[#8d99ae] hidden lg:block" />
      <div className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-l-2 border-dashed border-[#8d99ae] hidden lg:block" />

      <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-[#8d99ae] pb-4">
        <h2 className="font-bebas text-4xl tracking-wider text-[var(--color-primary)] dark:text-[#00a8b5]">
          {title}
        </h2>
        <button
          onClick={() => router.push('/map')}
          className="rounded-full bg-gray-200 dark:bg-gray-700 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-sm text-[var(--foreground)] pr-2">
        {type === 'country' && data && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Image 
                src={data.flagUrl} 
                alt={`${title} flag`} 
                width={128}
                height={128}
                className="h-32 w-auto object-contain shadow-md rounded border border-gray-200"
              />
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex w-full flex-col gap-2 rounded-xl border border-dashed border-[#8d99ae] bg-[var(--primary)]/5 p-4 text-left transition-all hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]"
            >
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <BookOpen size={16} />
                <span className="font-bebas text-lg tracking-wider uppercase">{t('descriptionTitle')}</span>
              </div>
              <p className="line-clamp-2 text-xs italic text-slate-600 dark:text-slate-300">
                {getLocalizedValue(data.description, locale)}
              </p>
              <div className="mt-1 text-[10px] font-bold text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-tighter">
                {t('readMore')}
              </div>
            </button>
            
            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
              <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#ffcd42]">QUICK FACTS</h3>
              <div className="space-y-3">
                {[
                  { label: t('labels.capital'), value: getLocalizedValue(data.capital, locale) },
                  { label: t('labels.largestCity'), value: getLocalizedValue(data.largestCity, locale) },
                  { label: t('labels.languages'), value: getLocalizedValue(data.officialLanguage, locale) },
                  { label: t('labels.demonym'), value: getLocalizedValue(data.demonym, locale) },
                  { label: t('labels.government'), value: getLocalizedValue(data.government, locale) },
                  { label: t('labels.area'), value: data.areaKm2 ? data.areaKm2.toLocaleString(locale) + ' km²' : 'N/A' },
                  { label: t('labels.population'), value: data.population ? data.population.toLocaleString(locale) : 'N/A' },
                  { label: t('labels.gdp'), value: data.gdp ? '$' + formatLargeNumber(data.gdp, locale) : 'N/A' },
                  { label: t('labels.hdi'), value: data.hdi ? data.hdi.toFixed(3) : 'N/A' },
                  { label: t('labels.currency'), value: getLocalizedValue(data.currency, locale) },
                  { label: t('labels.timeZone'), value: getLocalizedValue(data.timeZone, locale) },
                  { label: t('labels.callingCode'), value: getLocalizedValue(data.callingCode, locale) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                    <span className="font-bebas text-slate-500">{row.label}:</span>
                    <span className="font-mono text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {type === 'country' && data && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-2xl bg-[var(--card-bg)] border-2 border-[var(--card-border)] rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col"
            showCloseButton={true}
          >
            <DialogHeader className="flex items-center justify-between border-b-2 border-dashed border-[var(--card-border)] p-6 space-y-0">
              <DialogTitle className="font-bebas text-3xl tracking-wider text-[var(--color-primary)] dark:text-[#00a8b5]">
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 font-game-mono text-sm leading-relaxed text-[var(--foreground)]">
              <div className="flex flex-col gap-6">
                <div className="flex justify-center">
                  <Image 
                    src={data.flagUrl} 
                    alt={`${title} flag`} 
                    width={96}
                    height={96}
                    className="h-24 w-auto object-contain shadow-sm rounded border border-gray-100"
                  />
                </div>
                <div className="whitespace-pre-wrap first-letter:text-4xl first-letter:font-bebas first-letter:mr-1 first-letter:float-left first-letter:text-[var(--primary)]">
                  {getLocalizedValue(data.description, locale)}
                </div>
              </div>
            </div>

            <div className="h-4 bg-[var(--primary)]/10" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
