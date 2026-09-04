'use client';

import { X, BookOpen, Layers } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useState, useEffect, useRef } from 'react';

import { getNeighborsAction, getSubdivisionFlagsAction } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatLargeNumber } from '@/lib/formatters';
import { getLocalizedCountryName, getLocalizedValue } from '@/lib/i18n-utils';
import { useMapStore } from '@/store/useMapStore';
import { Continent, Country, Subdivision } from '@/types';

interface MapSidebarProps {
  type: 'continent' | 'country' | 'region';
  title: string;
  data?: Country;
  subdivision?: Subdivision | null;
  subdivisions?: Subdivision[];
  // Second-level units inside the focused first-level subdivision.
  childSubdivisions?: Subdivision[];
  // The containing first-level subdivision when a level-2 one is focused.
  parentSubdivision?: Subdivision | null;
  continent?: Continent | null;
  regionsList?: { code: string; name: string; flagUrl?: string | null }[];
  activeRegionCode?: string | null;
}

/**
 * A pill that shows a subdivision / country flag when one is available and falls
 * back to its name otherwise. The name is always reachable on hover (covers both
 * "which one is this flag?" and a clipped fallback label).
 */
function FlagPill({
  name,
  flagUrl,
  onClick,
  isCurrent = false,
}: {
  name: string;
  flagUrl?: string | null;
  onClick: () => void;
  isCurrent?: boolean;
}) {
  return (
    <SimpleTooltip label={name}>
      <button
        onClick={onClick}
        aria-label={name}
        aria-current={isCurrent || undefined}
        className={`flex items-center justify-center border transition-all font-bold uppercase tracking-tighter ${
          flagUrl ? 'overflow-hidden rounded-md p-0' : 'rounded-full px-3 py-1.5 text-[10px]'
        } ${
          isCurrent
            ? 'border-primary ring-2 ring-primary bg-primary text-white shadow-md scale-105'
            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-[var(--card-border)] hover:border-primary hover:text-primary hover:scale-105 active:scale-95'
        }`}
      >
        {flagUrl ? (
          <Image
            src={flagUrl}
            alt=""
            width={48}
            height={32}
            className="h-7 w-11 object-cover"
          />
        ) : (
          <span className="max-w-[10rem] truncate">{name}</span>
        )}
      </button>
    </SimpleTooltip>
  );
}

export default function MapSidebar({ type, title, data, subdivision, subdivisions = [], childSubdivisions = [], parentSubdivision = null, continent, regionsList = [], activeRegionCode }: MapSidebarProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('CountryDetails');
  const { masteryMode, setMasteryMode } = useMapStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [neighbors, setNeighbors] = useState<Country[]>([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  // ISO 3166-2 code -> flag URL for the focused region's neighbouring
  // subdivisions (the border list only carries code + name).
  const [borderFlags, setBorderFlags] = useState<Record<string, string | null>>({});

  // Swipe-to-dismiss touch states
  const touchStartY = useRef<number>(0);

  const countryPath = data?.isoCode ? `/map/${data.isoCode.toLowerCase()}` : '/map';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;

    // If swipe down exceeds 150px, dismiss the drawer
    if (diffY > 150) {
      router.push(type === 'region' ? countryPath : '/map');
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

  useEffect(() => {
    const codes = subdivision?.borders.map((b) => b.code).filter((c): c is string => !!c) ?? [];
    if (codes.length === 0) {
      setBorderFlags({});
      return;
    }
    let cancelled = false;
    getSubdivisionFlagsAction(codes).then((flags) => {
      if (!cancelled) setBorderFlags(flags);
    });
    return () => {
      cancelled = true;
    };
  }, [subdivision?.code]);

  // Plain JSX, not a nested component: MapSidebar re-renders on every map-store
  // change, and a component defined here would be a new type each render, so its
  // subtree (and every Radix tooltip hover timer in it) would remount and the
  // FlagPill tooltips would never get the chance to open.
  const regionPicker = (
    regionsList.length > 0 ? (
      <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
        <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary uppercase">
          {t('exploreRegions')} ({regionsList.length})
        </h3>
        {/* overflow-x-clip + p-1: a FlagPill's hover:scale would otherwise spill
            past the right edge, flip on a horizontal scrollbar, reflow the row and
            pull the flag out from under the cursor — an endless grow/shrink loop. */}
        <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto overflow-x-clip p-1 scrollbar-thin scrollbar-thumb-primary/20">
          {regionsList.map((region) => (
            <FlagPill
              key={region.code}
              name={region.name}
              flagUrl={region.flagUrl}
              isCurrent={region.code === activeRegionCode}
              onClick={() => router.push(`${countryPath}/${region.code}`)}
            />
          ))}
        </div>
      </div>
    ) : null
  );

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
          onClick={() => router.push(type === 'region' ? countryPath : '/map')}
          className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between border-b border-[var(--card-border)] pb-4">
        <h2 className="font-bebas text-4xl tracking-wider text-primary">
          {title}
        </h2>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mr-3 pr-3 font-mono text-sm text-[var(--foreground)] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
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
                {t('readMore')}
              </div>
            </button>

            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80">QUICK FACTS</h3>
              <div className="space-y-3">
                {[
                  { label: t('labels.capital'), value: getLocalizedValue(data.capital, locale) },
                  { label: t('labels.largestCity'), value: getLocalizedValue(data.largestCity, locale) },
                  { label: t('labels.continent'), value: data.continent || 'N/A' },
                  { label: t('labels.languages'), value: getLocalizedValue(data.officialLanguage, locale) },
                  { label: t('labels.demonym'), value: getLocalizedValue(data.demonym, locale) },
                  { label: t('labels.government'), value: getLocalizedValue(data.government, locale) },
                  { label: t('labels.area'), value: data.areaKm2 ? data.areaKm2.toLocaleString(locale) + ' km²' : 'N/A' },
                  { label: t('labels.population'), value: data.population ? data.population.toLocaleString(locale) : 'N/A' },
                  { label: t('labels.gdp'), value: data.gdp ? '$' + formatLargeNumber(data.gdp, locale) : 'N/A' },
                  { label: t('labels.gdpPerCapita'), value: data.gdpPerCapita ? '$' + formatLargeNumber(data.gdpPerCapita, locale) : 'N/A' },
                  { label: t('labels.hdi'), value: data.hdi ? data.hdi.toFixed(3) : 'N/A' },
                  { label: t('labels.lifeExpectancy'), value: data.lifeExpectancy ? `${data.lifeExpectancy.toFixed(1)}` : 'N/A' },
                  { label: t('labels.internetUsage'), value: data.internetUsagePercent != null ? `${data.internetUsagePercent.toFixed(1)}%` : 'N/A' },
                  { label: t('labels.unemploymentRate'), value: data.unemploymentRate != null ? `${data.unemploymentRate.toFixed(1)}%` : 'N/A' },
                  { label: t('labels.currency'), value: getLocalizedValue(data.currency, locale) },
                  { label: t('labels.timeZone'), value: getLocalizedValue(data.timeZone, locale) },
                  { label: t('labels.callingCode'), value: getLocalizedValue(data.callingCode, locale) },
                  { label: t('labels.drivingSide'), value: data.drivingSide === 'left' ? t('labels.drivingSideLeft') : data.drivingSide === 'right' ? t('labels.drivingSideRight') : 'N/A' },
                  { label: t('labels.motto'), value: data.motto || 'N/A' },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0">
                    <span className="font-bebas text-slate-400 text-xs tracking-wider uppercase">{row.label}</span>
                    <span className="font-mono text-[11px] text-right font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GOVERNMENT LEADERS SECTION */}
            {data.governmentLeaders && data.governmentLeaders.length > 0 && (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80">{t('labels.leaders')}</h3>
                <div className="space-y-3">
                  {data.governmentLeaders.map((leader, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0">
                      <span className="font-bebas text-slate-400 text-xs tracking-wider uppercase">{leader.title}</span>
                      <span className="font-mono text-[11px] text-right font-medium">{leader.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBDIVISIONS SECTION (data-only browser for any country) */}
            {subdivisions.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary uppercase">
                  {t('subdivisionsTitle')} ({subdivisions.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto overflow-x-clip p-1 scrollbar-thin scrollbar-thumb-primary/20">
                  {subdivisions.map((sub) => (
                    <FlagPill
                      key={sub.code}
                      name={getLocalizedValue(sub.name, locale)}
                      flagUrl={sub.flagUrl}
                      onClick={() => router.push(`${countryPath}/${sub.code}`)}
                    />
                  ))}
                </div>
              </div>
            )}

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
                    <SimpleTooltip key={neighbor.isoCode} label={getLocalizedValue(neighbor.name, locale)}>
                    <button
                      onClick={() => router.push(`/map/${neighbor.isoCode?.toLowerCase()}`)}
                      aria-label={getLocalizedValue(neighbor.name, locale)}
                      className="group relative transition-transform hover:scale-110 active:scale-95"
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
                    </SimpleTooltip>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No direct land neighbors found.</p>
              )}
            </div>
          </div>
        )}

        {type === 'region' && data && subdivision && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              {subdivision.flagUrl ? (
                <Image
                  src={subdivision.flagUrl}
                  alt={`${getLocalizedValue(subdivision.name, locale)} flag`}
                  width={160}
                  height={100}
                  className="h-24 w-auto object-contain shadow-xl rounded-lg border border-[var(--card-border)]"
                />
              ) : (
                <div className="h-24 w-36 bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-lg border border-dashed border-[var(--card-border)] text-slate-400">
                  {t('noFlag')}
                </div>
              )}
              <button
                onClick={() => router.push(countryPath)}
                className="text-[10px] text-slate-400 hover:text-primary font-mono uppercase tracking-widest mt-2"
              >
                {t('regionOf', { name: getLocalizedValue(data.name, locale) })}
              </button>
            </div>

            {getLocalizedValue(subdivision.description, locale) !== 'N/A' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative flex w-full flex-col gap-2 rounded-2xl border border-[var(--card-border)] bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 hover:border-primary"
              >
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen size={16} />
                  <span className="font-bebas text-lg tracking-wider uppercase">{t('descriptionTitle')}</span>
                </div>
                <p className="line-clamp-3 text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed">
                  {getLocalizedValue(subdivision.description, locale)}
                </p>
                <div className="mt-1 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-widest">
                  {t('readMore')}
                </div>
              </button>
            )}

            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80 uppercase">{t('quickFacts')}</h3>
              <div className="space-y-3">
                {[
                  { label: t('subdivisionType'), value: getLocalizedValue(subdivision.type, locale) },
                  { label: t('labels.isoCode'), value: subdivision.code },
                  { label: t('countryCapital'), value: getLocalizedValue(subdivision.capital, locale) },
                  ...(subdivision.level === 2 && parentSubdivision
                    ? [{
                        label: t('parentSubdivision'),
                        value: getLocalizedValue(parentSubdivision.name, locale),
                        onClick: () => router.push(`${countryPath}/${parentSubdivision.code}`),
                      }]
                    : []),
                  { label: t('parentCountry'), value: getLocalizedValue(data.name, locale), onClick: () => router.push(countryPath) },
                  { label: t('officialLanguage'), value: subdivision.officialLanguage.en },
                  { label: t('labels.population'), value: subdivision.population ? subdivision.population.toLocaleString(locale) + (subdivision.populationYear ? ` (${subdivision.populationYear})` : '') : 'N/A' },
                  { label: t('labels.area'), value: subdivision.areaKm2 ? Math.round(subdivision.areaKm2).toLocaleString(locale) + ' km²' : 'N/A' },
                  { label: t('density'), value: subdivision.densityKm2 ? subdivision.densityKm2.toFixed(1) + ' /km²' : 'N/A' },
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

            {subdivision.borders.filter((b) => b.code).length > 0 && (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80 uppercase">{t('neighbouringSubdivisions')}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {subdivision.borders.filter((b) => b.code).map((b) => (
                    <FlagPill
                      key={b.code}
                      name={getLocalizedValue(b.name, locale)}
                      flagUrl={borderFlags[b.code!]}
                      onClick={() => router.push(`/map/${b.code!.slice(0, 2).toLowerCase()}/${b.code}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {childSubdivisions.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary uppercase">
                  {t('childSubdivisions')} ({childSubdivisions.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto overflow-x-clip p-1 scrollbar-thin scrollbar-thumb-primary/20">
                  {childSubdivisions.map((child) => (
                    <FlagPill
                      key={child.code}
                      name={getLocalizedValue(child.name, locale)}
                      flagUrl={child.flagUrl}
                      onClick={() => router.push(`${countryPath}/${child.code}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {regionPicker}
          </div>
        )}

        {type === 'region' && data && !subdivision && (
          <div className="space-y-6">
            <p className="text-xs text-slate-400 italic">{t('regionOf', { name: getLocalizedValue(data.name, locale) })}</p>
            {regionPicker}
          </div>
        )}

        {type === 'continent' && continent && (
          <div className="space-y-6">
            {getLocalizedValue(continent.description, locale) !== 'N/A' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative flex w-full flex-col gap-2 rounded-2xl border border-[var(--card-border)] bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 hover:border-primary"
              >
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen size={16} />
                  <span className="font-bebas text-lg tracking-wider uppercase">{t('descriptionTitle')}</span>
                </div>
                <p className="line-clamp-3 text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed">
                  {getLocalizedValue(continent.description, locale)}
                </p>
                <div className="mt-1 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100 uppercase tracking-widest">
                  {t('readMore')}
                </div>
              </button>
            )}

            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
              <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80 uppercase">{t('quickFacts')}</h3>
              <div className="space-y-3">
                {[
                  { label: t('labels.population'), value: continent.population ? continent.population.toLocaleString(locale) + (continent.populationYear ? ` (${continent.populationYear})` : '') : 'N/A' },
                  { label: t('labels.area'), value: continent.areaKm2 ? Math.round(continent.areaKm2).toLocaleString(locale) + ' km²' : 'N/A' },
                  { label: t('density'), value: continent.densityKm2 ? continent.densityKm2.toFixed(1) + ' /km²' : 'N/A' },
                  { label: t('countryCount'), value: String(continent.countryCount) },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between border-b border-slate-100 dark:border-slate-800/50 pb-2 last:border-0">
                    <span className="font-bebas text-slate-400 text-xs tracking-wider uppercase">{row.label}</span>
                    <span className="font-mono text-[11px] text-right font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {continent.countryIsoCodes.length > 0 && (
              <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-[var(--card-border)] p-5 rounded-2xl">
                <h3 className="mb-4 font-bebas text-xl tracking-widest text-primary opacity-80 uppercase">{t('memberCountries')}</h3>
                <div className="flex flex-wrap gap-3">
                  {continent.countryIsoCodes.map((iso) => (
                    <SimpleTooltip key={iso} label={getLocalizedCountryName(iso, locale)}>
                    <button
                      onClick={() => router.push(`/map/${iso.toLowerCase()}`)}
                      aria-label={getLocalizedCountryName(iso, locale)}
                      className="group relative transition-transform hover:scale-110 active:scale-95"
                    >
                      <Image
                        src={`https://flagcdn.com/${iso.toLowerCase()}.svg`}
                        alt=""
                        width={40}
                        height={27}
                        className="h-6 w-10 rounded border border-[var(--card-border)] object-cover shadow-sm transition-shadow group-hover:shadow-md"
                      />
                    </button>
                    </SimpleTooltip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="w-[calc(100%-2rem)] max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[88vh] gap-0 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl p-0 overflow-hidden flex flex-col backdrop-blur-2xl"
            showCloseButton={true}
          >
            <DialogHeader className="flex items-center justify-between border-b border-[var(--card-border)] p-6 sm:p-8 space-y-0 shrink-0">
              <DialogTitle className="font-bebas text-3xl sm:text-4xl tracking-widest text-primary">
                {title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-10 font-mono text-sm leading-relaxed text-[var(--foreground)] scrollbar-thin scrollbar-thumb-slate-800">
              <div className="flex flex-col gap-8">
                <div className="whitespace-pre-wrap first-letter:text-6xl first-letter:font-bebas first-letter:mr-3 first-letter:float-left first-letter:text-primary first-letter:leading-[0.8]">
                  {subdivision
                    ? getLocalizedValue(subdivision.description, locale)
                    : continent
                      ? getLocalizedValue(continent.description, locale)
                      : data && getLocalizedValue(data.description, locale)}
                </div>
              </div>
            </div>

            <div className="h-2 bg-primary/20 shrink-0" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
