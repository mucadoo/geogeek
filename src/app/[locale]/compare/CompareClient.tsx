'use client';

import * as d3 from 'd3';
import { Scale, ArrowLeftRight, BarChart3 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useMemo, useState, useEffect } from 'react';
import { feature } from 'topojson-client';

import { getAllCountriesAction } from '@/app/actions';
import { ALPHA2_TO_NUMERIC } from '@/config/mapConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { formatLargeNumber } from '@/lib/formatters';
import { getLocalizedCountryName, getLocalizedValue } from '@/lib/i18n-utils';
import { Country } from '@/types';

interface StatRow {
  label: string;
  valueA: string;
  valueB: string;
  // When both are provided, the higher value is highlighted as the "winner".
  rawA?: number | null;
  rawB?: number | null;
}

function StatRow({ row }: { row: StatRow }) {
  const hasWinner = row.rawA != null && row.rawB != null && row.rawA !== row.rawB;
  const aWins = hasWinner && row.rawA! > row.rawB!;
  const bWins = hasWinner && row.rawB! > row.rawA!;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-dashed border-[var(--card-border)] py-3 last:border-0">
      <span className={`text-right text-sm font-bold ${aWins ? 'text-emerald-500' : 'text-[var(--foreground)]'}`}>{row.valueA}</span>
      <span className="text-center text-[10px] uppercase tracking-widest text-slate-400 whitespace-nowrap px-2">{row.label}</span>
      <span className={`text-left text-sm font-bold ${bWins ? 'text-amber-500' : 'text-[var(--foreground)]'}`}>{row.valueB}</span>
    </div>
  );
}

export default function CompareClient() {
  const locale = useLocale();
  const t = useTranslations('CountryDetails.labels');
  const { data: mapData } = useWorldMapData();
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [countryA, setCountryA] = useState<string>('US');
  const [countryB, setCountryB] = useState<string>('BR');

  useEffect(() => {
    async function load() {
      const countries = await getAllCountriesAction();
      setAllCountries(countries.filter(c => c.isoCode));
    }
    load();
  }, []);

  const sortedCountries = useMemo(() => {
    return [...allCountries].sort((a, b) => 
      getLocalizedCountryName(a.isoCode!, locale).localeCompare(getLocalizedCountryName(b.isoCode!, locale))
    );
  }, [allCountries, locale]);

  const countryDataA = useMemo(() => allCountries.find(c => c.isoCode === countryA), [allCountries, countryA]);
  const countryDataB = useMemo(() => allCountries.find(c => c.isoCode === countryB), [allCountries, countryB]);

  const statRows: StatRow[] = useMemo(() => {
    if (!countryDataA || !countryDataB) return [];

    const densityA = countryDataA.population && countryDataA.areaKm2 ? countryDataA.population / countryDataA.areaKm2 : null;
    const densityB = countryDataB.population && countryDataB.areaKm2 ? countryDataB.population / countryDataB.areaKm2 : null;

    return [
      {
        label: t('population'),
        valueA: countryDataA.population ? countryDataA.population.toLocaleString(locale) : 'N/A',
        valueB: countryDataB.population ? countryDataB.population.toLocaleString(locale) : 'N/A',
        rawA: countryDataA.population, rawB: countryDataB.population,
      },
      {
        label: 'Density (per km²)',
        valueA: densityA ? densityA.toFixed(1) : 'N/A',
        valueB: densityB ? densityB.toFixed(1) : 'N/A',
        rawA: densityA, rawB: densityB,
      },
      {
        label: t('gdp'),
        valueA: countryDataA.gdp ? '$' + formatLargeNumber(countryDataA.gdp, locale) : 'N/A',
        valueB: countryDataB.gdp ? '$' + formatLargeNumber(countryDataB.gdp, locale) : 'N/A',
        rawA: countryDataA.gdp, rawB: countryDataB.gdp,
      },
      {
        label: t('hdi'),
        valueA: countryDataA.hdi ? countryDataA.hdi.toFixed(3) : 'N/A',
        valueB: countryDataB.hdi ? countryDataB.hdi.toFixed(3) : 'N/A',
        rawA: countryDataA.hdi, rawB: countryDataB.hdi,
      },
      {
        label: t('gdpPerCapita'),
        valueA: countryDataA.gdpPerCapita ? '$' + formatLargeNumber(countryDataA.gdpPerCapita, locale) : 'N/A',
        valueB: countryDataB.gdpPerCapita ? '$' + formatLargeNumber(countryDataB.gdpPerCapita, locale) : 'N/A',
        rawA: countryDataA.gdpPerCapita, rawB: countryDataB.gdpPerCapita,
      },
      {
        label: t('lifeExpectancy'),
        valueA: countryDataA.lifeExpectancy != null ? countryDataA.lifeExpectancy.toFixed(1) : 'N/A',
        valueB: countryDataB.lifeExpectancy != null ? countryDataB.lifeExpectancy.toFixed(1) : 'N/A',
        rawA: countryDataA.lifeExpectancy, rawB: countryDataB.lifeExpectancy,
      },
      {
        label: t('internetUsage'),
        valueA: countryDataA.internetUsagePercent != null ? countryDataA.internetUsagePercent.toFixed(1) + '%' : 'N/A',
        valueB: countryDataB.internetUsagePercent != null ? countryDataB.internetUsagePercent.toFixed(1) + '%' : 'N/A',
        rawA: countryDataA.internetUsagePercent, rawB: countryDataB.internetUsagePercent,
      },
      {
        label: t('unemploymentRate'),
        valueA: countryDataA.unemploymentRate != null ? countryDataA.unemploymentRate.toFixed(1) + '%' : 'N/A',
        valueB: countryDataB.unemploymentRate != null ? countryDataB.unemploymentRate.toFixed(1) + '%' : 'N/A',
        rawA: countryDataA.unemploymentRate, rawB: countryDataB.unemploymentRate,
      },
      { label: t('capital'), valueA: getLocalizedValue(countryDataA.capital, locale), valueB: getLocalizedValue(countryDataB.capital, locale) },
      { label: t('largestCity'), valueA: getLocalizedValue(countryDataA.largestCity, locale), valueB: getLocalizedValue(countryDataB.largestCity, locale) },
      { label: t('languages'), valueA: getLocalizedValue(countryDataA.officialLanguage, locale), valueB: getLocalizedValue(countryDataB.officialLanguage, locale) },
      { label: t('government'), valueA: getLocalizedValue(countryDataA.government, locale), valueB: getLocalizedValue(countryDataB.government, locale) },
      { label: t('currency'), valueA: getLocalizedValue(countryDataA.currency, locale), valueB: getLocalizedValue(countryDataB.currency, locale) },
      { label: t('timeZone'), valueA: getLocalizedValue(countryDataA.timeZone, locale), valueB: getLocalizedValue(countryDataB.timeZone, locale) },
    ];
  }, [countryDataA, countryDataB, locale, t]);

  const paths = useMemo(() => {
    if (!mapData) return { pathA: '', pathB: '' };

    const world = feature(mapData as any, mapData.objects.countries as any) as any;
    
    const getPath = (isoCode: string) => {
      const numericId = ALPHA2_TO_NUMERIC[isoCode.toUpperCase()];
      const feat = world.features.find((f: any) => String(f.id).padStart(3, '0') === numericId);
      if (!feat) return '';

      // Use Equal Area projection for fair comparison
      const projection = d3.geoAzimuthalEqualArea().fitSize([300, 300], feat);
      const pathGenerator = d3.geoPath().projection(projection);
      return pathGenerator(feat) || '';
    };

    return {
      pathA: getPath(countryA),
      pathB: getPath(countryB)
    };
  }, [mapData, countryA, countryB]);

  return (
    <main className="container-custom flex-grow relative z-10 py-12 animate-in fade-in duration-1000">
      <header className="mb-12 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-game-mono font-bold text-primary uppercase tracking-widest">
          <Scale size={16} /> True Size Atlas
        </div>
        <h1 className="mb-4 text-5xl font-game-heading tracking-widest text-[var(--foreground)] uppercase">
          Country Comparison
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-game-mono text-gray-500">
          True size, population, GDP, HDI and more — side by side, without Mercator distortion.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Selection Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="game-card p-6 border-2 border-dashed border-[var(--card-border)]">
            <h2 className="font-bebas text-2xl tracking-widest mb-4 text-primary">SELECT COUNTRIES</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Country A</label>
                <select 
                  value={countryA} 
                  onChange={(e) => setCountryA(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border-2 border-[var(--card-border)] rounded-xl px-4 py-3 font-game-mono text-sm outline-none focus:border-primary"
                >
                  {sortedCountries.map(c => (
                    <option key={c.isoCode || ''} value={c.isoCode || ''}>{getLocalizedCountryName(c.isoCode!, locale)}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                  <ArrowLeftRight size={20} className="text-slate-400" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Country B</label>
                <select 
                  value={countryB} 
                  onChange={(e) => setCountryB(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border-2 border-[var(--card-border)] rounded-xl px-4 py-3 font-game-mono text-sm outline-none focus:border-primary"
                >
                  {sortedCountries.map(c => (
                    <option key={c.isoCode || ''} value={c.isoCode || ''}>{getLocalizedCountryName(c.isoCode!, locale)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Area Comparison Stats */}
          <div className="game-card p-6 border-2 border-dashed border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bebas text-xl tracking-widest mb-4">AREA COMPARISON</h3>
            {countryDataA && countryDataB ? (
              <div className="space-y-4 font-game-mono">
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-xs text-slate-400">{getLocalizedCountryName(countryA, locale)}:</span>
                  <span className="text-sm font-bold text-emerald-500">{countryDataA.areaKm2?.toLocaleString(locale)} km²</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-xs text-slate-400">{getLocalizedCountryName(countryB, locale)}:</span>
                  <span className="text-sm font-bold text-amber-500">{countryDataB.areaKm2?.toLocaleString(locale)} km²</span>
                </div>
                <div className="pt-2 text-center text-xs text-slate-500">
                  {countryDataA.areaKm2 && countryDataB.areaKm2 ? (
                    countryDataA.areaKm2 > countryDataB.areaKm2 
                      ? `${getLocalizedCountryName(countryA, locale)} is ${(countryDataA.areaKm2 / countryDataB.areaKm2).toFixed(1)}x larger`
                      : `${getLocalizedCountryName(countryB, locale)} is ${(countryDataB.areaKm2 / countryDataA.areaKm2).toFixed(1)}x larger`
                  ) : 'Area data unavailable.'}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select two countries to see real area differences.</p>
            )}
          </div>
        </div>

        {/* Visual Comparison Area */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border-2 border-dashed border-[var(--card-border)] h-[600px] relative overflow-hidden flex items-center justify-center p-8">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-slate-300 font-bebas text-2xl opacity-40 pointer-events-none select-none tracking-widest">
              Equal-Area Projection (1:1)
            </div>
            
            <div className="grid grid-cols-2 gap-8 w-full h-full items-center">
              <div className="flex flex-col items-center gap-4">
                <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl overflow-visible">
                  <path d={paths.pathA} fill="rgba(16, 185, 129, 0.2)" stroke="rgba(16, 185, 129, 1)" strokeWidth={2} className="transition-all duration-1000" />
                </svg>
                <span className="font-bebas text-lg tracking-wider text-emerald-500">{getLocalizedCountryName(countryA, locale)}</span>
              </div>

              <div className="flex flex-col items-center gap-4">
                <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl overflow-visible">
                  <path d={paths.pathB} fill="rgba(245, 158, 11, 0.2)" stroke="rgba(245, 158, 11, 1)" strokeWidth={2} className="transition-all duration-1000" />
                </svg>
                <span className="font-bebas text-lg tracking-wider text-amber-500">{getLocalizedCountryName(countryB, locale)}</span>
              </div>
            </div>

            {/* Overlap View Toggle (Optional future improvement) */}
        </div>
      </div>

      {/* Full Stat Comparison */}
      <div className="mx-auto mt-8 max-w-4xl">
        <div className="game-card p-6 md:p-8 border-2 border-dashed border-[var(--card-border)]">
          <h2 className="mb-6 flex items-center justify-center gap-2 font-bebas text-2xl tracking-widest text-primary">
            <BarChart3 size={20} /> FULL COMPARISON
          </h2>

          {countryDataA && countryDataB ? (
            <div>
              <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 pb-3 border-b border-[var(--card-border)]">
                <span className="text-right font-bebas text-lg tracking-wider text-emerald-500">{getLocalizedCountryName(countryA, locale)}</span>
                <span className="w-6" />
                <span className="text-left font-bebas text-lg tracking-wider text-amber-500">{getLocalizedCountryName(countryB, locale)}</span>
              </div>
              {statRows.map((row) => (
                <StatRow key={row.label} row={row} />
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-slate-500 italic">Select two countries to compare.</p>
          )}
        </div>
      </div>
    </main>
  );
}
