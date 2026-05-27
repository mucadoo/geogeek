'use client';

import { X, BookOpen, Layers } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useState, useEffect, useRef } from 'react';

import { getNeighborsAction } from '@/app/actions';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { formatLargeNumber } from '@/lib/formatters';
import { getLocalizedValue } from '@/lib/i18n-utils';
import { useMapStore } from '@/store/useMapStore';
import { Country } from '@/types';

interface MapSidebarProps {
  type: 'continent' | 'country' | 'region';
  title: string;
  data?: Country;
  regionName?: string | null;
  regionsList?: { id: string; name: string }[];
  activeRegionId?: string | null;
}

export default function MapSidebar({ type, title, data, regionName, regionsList, activeRegionId }: MapSidebarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('CountryDetails');
  const tRegions = useTranslations('RegionNames');
  const { masteryMode, setMasteryMode } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [neighbors, setNeighbors] = useState<Country[]>([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  
  // Swipe-to-dismiss touch states
  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;

    // If swipe down exceeds 150px, dismiss the drawer
    if (diffY > 150) {
      if (type === 'region' && data?.isoCode) {
        router.push(`/map/${data.isoCode.toLowerCase()}`);
      } else {
        router.push('/map');
      }
    }
  };

  const getLocalizedRegionName = (name: string) => {
    try {
      return tRegions(name as any);
    } catch {
      return name;
    }
  };

  useEffect(() => {
    async function fetchNeighbors() {
      if (type === 'country' && data) {
        setLoadingNeighbors(true);
        const name = getLocalizedValue(data.name, 'en'); // Use English name for more reliable neighbor lookup
        const result = await getNeighborsAction(name, locale);
        setNeighbors(result);
        setLoadingNeighbors(false);
      } else {
        setNeighbors([]);
      }
    }
    fetchNeighbors();
  }, [data, type, locale]);

  const displayTitle = type === 'region' && regionName ? getLocalizedRegionName(regionName) : title;

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="animate-in slide-in-from-right fade-in duration-300 absolute bottom-0 right-0 z-40 flex h-[45vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-2xl backdrop-blur-xl lg:bottom-4 lg:top-24 lg:right-4 lg:h-[calc(100vh-8rem)] lg:w-96 lg:rounded-3xl lg:border"
    >
      {/* Decorative Swipe Drag Handle (only visible on mobile) */}
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-800 lg:hidden" />

      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={() => setMasteryMode(!masteryMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-bebas tracking-widest text-xs ${
            masteryMode ? 'border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,188,212,0.3)]' : 'border-[var(--card-border)] text-slate-400 grayscale'
          }`}
        >
          <Layers size={14} />
          {masteryMode ? 'Mastery: ON' : 'Mastery: OFF'}
        </button>
        <button
          onClick={() => {
            if (type === 'region' && data?.isoCode) {
              router.push(`/map/${data.isoCode.toLowerCase()}`);
            } else {
              router.push('/map');
            }
          }}
          className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-[var(--card-border)] pb-4">
        <h2 className="font-bebas text-4xl tracking-wider text-primary">
          {displayTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-sm text-[var(--foreground)] pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {type === 'country' && data && (
          <div className="space-y-6">
            <div className="flex justify-center">
              {data.flagUrl ? (
                <Image 
                  src={data.flagUrl} 
                  alt={`${title} flag`} 
                  width={160}
                  height={100}
                  className="h-28 w-auto object-contain shadow-xl rounded-lg border border-[var(--card-border)]"
                />
              ) : (
                <div className="h-28 w-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-lg border border-dashed border-[var(--card-border)] text-slate-400">
                  No Flag
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="group relative flex w-full flex-col gap-2 rounded-2xl border border-[var(--card-border)] bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 hover:border-primary"
            >
              <div className="flex items-center gap-2 text-primary">
                <BookOpen size={16} />
                <span className="font-bebas text-lg tracking-wider uppercase">{t('descriptionTitle')}</span>
              </div>
              <p className="line-clamp-3 text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed">
                {getLocalizedValue(data.description, locale)}
              </p>
              <div className="mt-1 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-widest">
                {t('readMore')} ➔
              </div>
            </button>
            
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80">QUICK FACTS</h3>
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
                  <div key={i} className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0">
                    <span className="font-bebas text-slate-400 text-xs tracking-wider uppercase">{row.label}</span>
                    <span className="font-mono text-[11px] text-right font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NEIGHBORING COUNTRIES SECTION */}
            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80">NEIGHBORS</h3>
              {loadingNeighbors ? (
                <div className="flex gap-2 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />)}
                </div>
              ) : neighbors.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {neighbors.map((neighbor) => (
                    <button
                      key={neighbor.isoCode}
                      onClick={() => router.push(`/map/${neighbor.isoCode?.toLowerCase()}`)}
                      className="group relative transition-transform hover:scale-110 active:scale-95"
                      title={getLocalizedValue(neighbor.name, locale)}
                    >
                      {neighbor.flagUrl ? (
                        <Image 
                          src={neighbor.flagUrl} 
                          alt="" 
                          width={48} 
                          height={32} 
                          className="h-8 w-12 rounded border border-[var(--card-border)] object-cover shadow-sm transition-shadow group-hover:shadow-md" 
                        />
                      ) : (
                        <div className="flex h-8 w-12 items-center justify-center rounded border border-[var(--card-border)] bg-slate-100 dark:bg-slate-800 text-[8px]">
                          {neighbor.isoCode}
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-sm">
                        ➔
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No direct land neighbors found.</p>
              )}
            </div>
          </div>
        )}

        {type === 'region' && data && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              {data.flagUrl ? (
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => router.push(`/map/${data.isoCode?.toLowerCase()}`)}
                  title={`Back to ${getLocalizedValue(data.name, locale)}`}
                >
                  <Image 
                    src={data.flagUrl} 
                    alt={`${getLocalizedValue(data.name, locale)} flag`} 
                    width={160}
                    height={100}
                    className="h-24 w-auto object-contain shadow-xl rounded-lg border border-[var(--card-border)] transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Back to Country</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 w-36 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-lg border border-dashed border-[var(--card-border)] text-slate-400">
                  No Flag
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-2">
                Region of {getLocalizedValue(data.name, locale)}
              </span>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80 uppercase">Quick Facts</h3>
              <div className="space-y-3">
                {[
                  { label: "Parent Country", value: getLocalizedValue(data.name, locale), onClick: () => router.push(`/map/${data.isoCode?.toLowerCase()}`) },
                  { label: "Region ID", value: activeRegionId || 'N/A' },
                  { label: "Country Capital", value: getLocalizedValue(data.capital, locale) },
                  { label: "Official Language", value: getLocalizedValue(data.officialLanguage, locale) },
                  { label: "Currency", value: getLocalizedValue(data.currency, locale) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0">
                    <span className="font-bebas text-slate-400 text-xs tracking-wider uppercase">{row.label}</span>
                    {row.onClick ? (
                      <button 
                        onClick={row.onClick}
                        className="font-mono text-[11px] text-right text-primary hover:underline cursor-pointer font-bold"
                      >
                        {row.value}
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] text-right font-medium">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {regionsList && regionsList.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary uppercase">
                  Explore Regions ({regionsList.length})
                </h3>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/20">
                  {regionsList.map((region) => {
                    const isCurrent = region.id === activeRegionId;
                    return (
                      <button
                        key={region.id}
                        onClick={() => router.push(`/map/${data.isoCode?.toLowerCase()}/${region.id}`)}
                        className={`px-3 py-1.5 rounded-full text-[10px] transition-all border font-bold uppercase tracking-tighter ${
                          isCurrent 
                            ? 'bg-primary border-primary text-white shadow-md scale-105'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-[var(--card-border)] hover:border-primary hover:text-primary'
                        }`}
                      >
                        {getLocalizedRegionName(region.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {type === 'country' && data && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent 
            className="max-w-2xl bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col backdrop-blur-2xl"
            showCloseButton={true}
          >
            <DialogHeader className="flex items-center justify-between border-b border-[var(--card-border)] p-8 space-y-0">
              <DialogTitle className="font-bebas text-4xl tracking-widest text-primary">
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-10 font-mono text-sm leading-relaxed text-[var(--foreground)] scrollbar-thin scrollbar-thumb-slate-800">
              <div className="flex flex-col gap-8">
                <div className="flex justify-center">
                  {data.flagUrl ? (
                    <Image 
                      src={data.flagUrl} 
                      alt={`${title} flag`} 
                      width={200}
                      height={120}
                      className="h-32 w-auto object-contain shadow-2xl rounded-xl border border-[var(--card-border)]"
                    />
                  ) : (
                    <div className="h-32 w-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-xl border border-dashed border-[var(--card-border)] text-slate-400">
                      No Flag
                    </div>
                  )}
                </div>
                <div className="whitespace-pre-wrap first-letter:text-6xl first-letter:font-bebas first-letter:mr-3 first-letter:float-left first-letter:text-primary first-letter:leading-[0.8]">
                  {getLocalizedValue(data.description, locale)}
                </div>
              </div>
            </div>

            <div className="h-2 bg-primary/20" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
