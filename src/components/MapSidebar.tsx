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
      className="animate-in slide-in-from-right fade-in duration-300 absolute bottom-0 right-0 z-40 flex h-[40vh] w-full flex-col overflow-hidden rounded-t-lg border-t-2 border-dashed border-[#8d99ae] bg-[var(--card-bg)] p-6 shadow-2xl backdrop-blur-md lg:bottom-auto lg:top-24 lg:right-4 lg:h-[80vh] lg:w-96 lg:rounded-lg lg:border-2 lg:border-l-2"
    >
      {/* Decorative Swipe Drag Handle (only visible on mobile) */}
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 lg:hidden" />

      {/* Perforated edge effect */}
      <div className="absolute -left-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-r-2 border-dashed border-[#8d99ae] hidden lg:block" />
      <div className="absolute -right-3 top-10 h-6 w-6 rounded-full bg-[var(--background)] border-l-2 border-dashed border-[#8d99ae] hidden lg:block" />

      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={() => setMasteryMode(!masteryMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-dashed transition-all font-bebas tracking-widest text-xs ${
            masteryMode ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-slate-400 grayscale'
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
          className="rounded-full bg-gray-200 dark:bg-gray-700 p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between border-b-2 border-dashed border-[#8d99ae] pb-4">
        <h2 className="font-bebas text-4xl tracking-wider text-[var(--color-primary)] dark:text-[#00a8b5]">
          {displayTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-sm text-[var(--foreground)] pr-2">
        {type === 'country' && data && (
          <div className="space-y-6">
            <div className="flex justify-center">
              {data.flagUrl ? (
                <Image 
                  src={data.flagUrl} 
                  alt={`${title} flag`} 
                  width={128}
                  height={128}
                  className="h-32 w-auto object-contain shadow-md rounded border border-gray-200"
                />
              ) : (
                <div className="h-32 w-48 bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded border border-dashed border-[#8d99ae] text-slate-400">
                  No Flag
                </div>
              )}
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

            {/* NEIGHBORING COUNTRIES SECTION */}
            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
              <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#00d4ff]">NEIGHBORS</h3>
              {loadingNeighbors ? (
                <div className="flex gap-2 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 w-14 bg-slate-200 dark:bg-slate-700 rounded-md" />)}
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
                          className="h-8 w-12 rounded border border-gray-200 object-cover shadow-sm" 
                        />
                      ) : (
                        <div className="flex h-8 w-12 items-center justify-center rounded border border-dashed border-gray-200 bg-slate-100 text-[8px]">
                          {neighbor.isoCode}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        ➔
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No direct land neighbors found.</p>
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
                    width={128}
                    height={128}
                    className="h-24 w-auto object-contain shadow-md rounded border border-gray-200 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Back to Country</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 w-36 bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded border border-dashed border-[#8d99ae] text-slate-400">
                  No Flag
                </div>
              )}
              <span className="text-xs text-slate-400 font-game-mono mt-1">
                Region of {getLocalizedValue(data.name, locale)}
              </span>
            </div>

            <div className="border border-dashed border-[#8d99ae] p-4 rounded-md">
              <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#ffcd42]">QUICK FACTS</h3>
              <div className="space-y-3">
                {[
                  { label: "Parent Country", value: getLocalizedValue(data.name, locale), onClick: () => router.push(`/map/${data.isoCode?.toLowerCase()}`) },
                  { label: "Region ID", value: activeRegionId || 'N/A' },
                  { label: "Country Capital", value: getLocalizedValue(data.capital, locale) },
                  { label: "Official Language", value: getLocalizedValue(data.officialLanguage, locale) },
                  { label: "Currency", value: getLocalizedValue(data.currency, locale) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-dashed border-slate-300 pb-2">
                    <span className="font-bebas text-slate-500">{row.label}:</span>
                    {row.onClick ? (
                      <button 
                        onClick={row.onClick}
                        className="font-mono text-right text-[var(--primary)] hover:underline cursor-pointer"
                      >
                        {row.value}
                      </button>
                    ) : (
                      <span className="font-mono text-right">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {regionsList && regionsList.length > 0 && (
              <div className="border border-[#8d99ae]/60 p-4 rounded-md bg-[var(--input-bg)]/20">
                <h3 className="mb-4 font-bebas text-2xl tracking-wider text-[var(--color-primary)] dark:text-[#00d4ff]">
                  EXPLORE REGIONS ({regionsList.length})
                </h3>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {regionsList.map((region) => {
                    const isCurrent = region.id === activeRegionId;
                    return (
                      <button
                        key={region.id}
                        onClick={() => router.push(`/map/${data.isoCode?.toLowerCase()}/${region.id}`)}
                        className={`px-3 py-1 rounded-full text-xs transition-all border ${
                          isCurrent 
                            ? 'bg-primary border-primary text-white font-bold scale-105'
                            : 'bg-[var(--card-bg)] text-slate-600 dark:text-slate-300 border-[#8d99ae]/40 hover:border-primary hover:text-primary'
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
                  {data.flagUrl ? (
                    <Image 
                      src={data.flagUrl} 
                      alt={`${title} flag`} 
                      width={96}
                      height={96}
                      className="h-24 w-auto object-contain shadow-sm rounded border border-gray-100"
                    />
                  ) : (
                    <div className="h-24 w-36 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded border border-dashed border-gray-200 text-slate-400">
                      No Flag
                    </div>
                  )}
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
