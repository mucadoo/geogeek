'use client';

import * as d3 from 'd3';
import { Scale, ArrowLeftRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import React, { useMemo, useState, useEffect } from 'react';
import { feature } from 'topojson-client';

import { getAllCountriesAction } from '@/app/actions';
import { ALPHA2_TO_NUMERIC } from '@/config/mapConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { getLocalizedCountryName } from '@/lib/i18n-utils';
import { Country } from '@/types';

export default function CompareClient() {
  const locale = useLocale();
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
          Compare the actual land area of countries without Mercator projection distortion.
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
    </main>
  );
}
