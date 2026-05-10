'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React from 'react';
import { formatLargeNumber } from '@/lib/formatters';

interface MapSidebarProps {
  type: 'continent' | 'country';
  title: string;
  data?: any;
}

export default function MapSidebar({ type, title, data }: MapSidebarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('CountryDetails.labels');

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
            <div className="text-8xl text-center">{data.flag}</div>
            
            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
              <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#ffcd42]">QUICK FACTS</h3>
              <div className="space-y-3">
                {[
                  { label: t('capital'), value: data.capital },
                  { label: 'Largest City', value: data.largestCity },
                  { label: t('languages'), value: data.languages },
                  { label: t('demonym'), value: data.demonym },
                  { label: t('government'), value: data.government },
                  { label: t('area'), value: data.area ? data.area.toLocaleString(locale) + ' km²' : 'N/A' },
                  { label: 'Population', value: data.population ? data.population.toLocaleString(locale) : 'N/A' },
                  { label: t('gdp'), value: data.gdp ? '$' + formatLargeNumber(data.gdp, locale) : 'N/A' },
                  { label: t('hdi'), value: data.hdi ? data.hdi.toFixed(3) : 'N/A' },
                  { label: t('currency'), value: data.currency },
                  { label: t('timeZone'), value: data.timeZone },
                  { label: t('callingCode'), value: data.callingCode },
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
    </div>
  );
}
