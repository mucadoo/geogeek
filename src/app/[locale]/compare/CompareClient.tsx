'use client';

import * as d3 from 'd3';
import { ArrowLeftRight, Check, ChevronDown, Scale, Search } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { feature } from 'topojson-client';

import { getAllCountriesAction } from '@/app/actions';
import { ALPHA2_TO_NUMERIC } from '@/config/mapConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { formatLargeNumber } from '@/lib/formatters';
import { getLocalizedCountryName, getLocalizedValue } from '@/lib/i18n-utils';
import { Country } from '@/types';

const SHAPE_SIZE = 260;
const COLOR_A = 'var(--primary)';
const COLOR_B = '#f59e0b';

/* -------------------------------------------------------------------------- */
/*  Country picker — flag + searchable dropdown, matches the app's flag idiom  */
/* -------------------------------------------------------------------------- */

function CountryPicker({
  label,
  color,
  value,
  onChange,
  countries,
  locale,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (iso: string) => void;
  countries: Country[];
  locale: string;
}) {
  const t = useTranslations('Compare');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      inputRef.current?.focus();
    }
  }, [open]);

  const selected = countries.find(c => c.isoCode === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      c =>
        getLocalizedCountryName(c.isoCode, locale).toLowerCase().includes(q) ||
        c.isoCode.toLowerCase().includes(q) ||
        (c.name.en || '').toLowerCase().includes(q)
    );
  }, [countries, query, locale]);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-left transition-colors hover:border-[var(--primary)]"
      >
        {selected && (
          <Image
            src={`https://flagcdn.com/w40/${selected.isoCode.toLowerCase()}.png`}
            alt=""
            width={32}
            height={20}
            className="h-5 w-8 shrink-0 rounded-sm border border-[var(--card-border)]/50 object-cover"
          />
        )}
        <span className="flex-grow truncate font-game-mono text-sm">
          {selected ? getLocalizedCountryName(selected.isoCode, locale) : t('selectCountry')}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="glass-morphism absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl shadow-2xl">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] px-3">
            <Search size={15} className="shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent py-3 font-game-mono text-sm outline-none placeholder:text-slate-500"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center font-game-mono text-xs text-slate-500">
                {t('noResults')}
              </li>
            )}
            {filtered.map(c => {
              const isCurrent = c.isoCode === value;
              return (
                <li key={c.isoCode}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c.isoCode);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-game-mono text-sm transition-colors hover:bg-[var(--primary)]/10 ${
                      isCurrent ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
                    }`}
                  >
                    <Image
                      src={`https://flagcdn.com/w40/${c.isoCode.toLowerCase()}.png`}
                      alt=""
                      width={32}
                      height={20}
                      className="h-5 w-8 shrink-0 rounded-sm border border-[var(--card-border)]/50 object-cover"
                    />
                    <span className="flex-grow truncate">
                      {getLocalizedCountryName(c.isoCode, locale)}
                    </span>
                    {isCurrent && <Check size={15} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat row — value / label / value, with proportional bars for numbers      */
/* -------------------------------------------------------------------------- */

interface Row {
  label: string;
  a: string;
  b: string;
  aRaw?: number | null;
  bRaw?: number | null;
}

function StatRow({ row }: { row: Row }) {
  const hasBars =
    row.aRaw != null && row.bRaw != null && (row.aRaw > 0 || row.bRaw > 0);
  const max = hasBars ? Math.max(row.aRaw!, row.bRaw!) : 0;
  const aW = hasBars && max > 0 ? (row.aRaw! / max) * 100 : 0;
  const bW = hasBars && max > 0 ? (row.bRaw! / max) * 100 : 0;

  return (
    <div className="border-b border-dashed border-[var(--card-border)] py-3.5 last:border-b-0">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <span className="text-right font-game-mono text-sm font-bold text-[var(--foreground)]">
          {row.a}
        </span>
        <span className="w-24 text-center text-[10px] uppercase leading-tight tracking-widest text-slate-400 sm:w-36">
          {row.label}
        </span>
        <span className="text-left font-game-mono text-sm font-bold text-[var(--foreground)]">
          {row.b}
        </span>
      </div>

      {hasBars && (
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          <div className="h-1.5 w-full max-w-[170px] justify-self-end overflow-hidden rounded-full bg-[var(--card-border)]/40">
            <div
              className="ml-auto h-full rounded-full transition-all duration-700"
              style={{ width: `${aW}%`, background: COLOR_A }}
            />
          </div>
          <span className="w-24 sm:w-36" />
          <div className="h-1.5 w-full max-w-[170px] justify-self-start overflow-hidden rounded-full bg-[var(--card-border)]/40">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${bW}%`, background: COLOR_B }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CompareClient() {
  const locale = useLocale();
  const t = useTranslations('Compare');
  const tl = useTranslations('CountryDetails.labels');
  const tr = useTranslations('Rankings');
  const { data: mapData } = useWorldMapData();

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [countryA, setCountryA] = useState('US');
  const [countryB, setCountryB] = useState('BR');

  useEffect(() => {
    getAllCountriesAction().then(list => setAllCountries(list.filter(c => c.isoCode)));
  }, []);

  // Hydrate the selection from ?a=&b= so a comparison can be shared by URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a');
    const b = params.get('b');
    if (a) setCountryA(a.toUpperCase());
    if (b) setCountryB(b.toUpperCase());
  }, []);

  // Reflect the selection back into the URL without a navigation / remount.
  useEffect(() => {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?a=${countryA}&b=${countryB}`
    );
  }, [countryA, countryB]);

  const sortedCountries = useMemo(
    () =>
      [...allCountries].sort((a, b) =>
        getLocalizedCountryName(a.isoCode, locale).localeCompare(
          getLocalizedCountryName(b.isoCode, locale)
        )
      ),
    [allCountries, locale]
  );

  const dataA = useMemo(
    () => allCountries.find(c => c.isoCode === countryA),
    [allCountries, countryA]
  );
  const dataB = useMemo(
    () => allCountries.find(c => c.isoCode === countryB),
    [allCountries, countryB]
  );

  const nameA = getLocalizedCountryName(countryA, locale);
  const nameB = getLocalizedCountryName(countryB, locale);

  const rows: Row[] = useMemo(() => {
    if (!dataA || !dataB) return [];

    const na = tr('table.na');
    const num = (v: number | null | undefined, fmt: (n: number) => string) =>
      v != null ? fmt(v) : na;

    const densityA =
      dataA.population && dataA.areaKm2 ? dataA.population / dataA.areaKm2 : null;
    const densityB =
      dataB.population && dataB.areaKm2 ? dataB.population / dataB.areaKm2 : null;

    return [
      {
        label: tl('population'),
        a: num(dataA.population, n => n.toLocaleString(locale)),
        b: num(dataB.population, n => n.toLocaleString(locale)),
        aRaw: dataA.population,
        bRaw: dataB.population,
      },
      {
        label: tl('area'),
        a: num(dataA.areaKm2, n => `${n.toLocaleString(locale)} km²`),
        b: num(dataB.areaKm2, n => `${n.toLocaleString(locale)} km²`),
        aRaw: dataA.areaKm2,
        bRaw: dataB.areaKm2,
      },
      {
        label: tr('table.density'),
        a: num(densityA, n => n.toFixed(1)),
        b: num(densityB, n => n.toFixed(1)),
        aRaw: densityA,
        bRaw: densityB,
      },
      {
        label: tl('gdp'),
        a: num(dataA.gdp, n => `$${formatLargeNumber(n, locale)}`),
        b: num(dataB.gdp, n => `$${formatLargeNumber(n, locale)}`),
        aRaw: dataA.gdp,
        bRaw: dataB.gdp,
      },
      {
        label: tl('gdpPerCapita'),
        a: num(dataA.gdpPerCapita, n => `$${formatLargeNumber(n, locale)}`),
        b: num(dataB.gdpPerCapita, n => `$${formatLargeNumber(n, locale)}`),
        aRaw: dataA.gdpPerCapita,
        bRaw: dataB.gdpPerCapita,
      },
      {
        label: tl('hdi'),
        a: num(dataA.hdi, n => n.toFixed(3)),
        b: num(dataB.hdi, n => n.toFixed(3)),
        aRaw: dataA.hdi,
        bRaw: dataB.hdi,
      },
      {
        label: tl('lifeExpectancy'),
        a: num(dataA.lifeExpectancy, n => n.toFixed(1)),
        b: num(dataB.lifeExpectancy, n => n.toFixed(1)),
        aRaw: dataA.lifeExpectancy,
        bRaw: dataB.lifeExpectancy,
      },
      {
        label: tl('internetUsage'),
        a: num(dataA.internetUsagePercent, n => `${n.toFixed(1)}%`),
        b: num(dataB.internetUsagePercent, n => `${n.toFixed(1)}%`),
        aRaw: dataA.internetUsagePercent,
        bRaw: dataB.internetUsagePercent,
      },
      {
        label: tl('unemploymentRate'),
        a: num(dataA.unemploymentRate, n => `${n.toFixed(1)}%`),
        b: num(dataB.unemploymentRate, n => `${n.toFixed(1)}%`),
        aRaw: dataA.unemploymentRate,
        bRaw: dataB.unemploymentRate,
      },
      {
        label: tl('capital'),
        a: getLocalizedValue(dataA.capital, locale),
        b: getLocalizedValue(dataB.capital, locale),
      },
      {
        label: tl('largestCity'),
        a: getLocalizedValue(dataA.largestCity, locale),
        b: getLocalizedValue(dataB.largestCity, locale),
      },
      {
        label: tl('languages'),
        a: getLocalizedValue(dataA.officialLanguage, locale),
        b: getLocalizedValue(dataB.officialLanguage, locale),
      },
      {
        label: tl('government'),
        a: getLocalizedValue(dataA.government, locale),
        b: getLocalizedValue(dataB.government, locale),
      },
      {
        label: tl('currency'),
        a: getLocalizedValue(dataA.currency, locale),
        b: getLocalizedValue(dataB.currency, locale),
      },
      {
        label: tl('timeZone'),
        a: getLocalizedValue(dataA.timeZone, locale),
        b: getLocalizedValue(dataB.timeZone, locale),
      },
    ];
  }, [dataA, dataB, locale, t, tl, tr]);

  // Both silhouettes are drawn with the SAME equal-area scale, so the sizes
  // are genuinely comparable (the old page fit each shape to its own box).
  const shapes = useMemo(() => {
    if (!mapData) return null;

    const world = feature(mapData as any, (mapData as any).objects.countries) as any;
    const featureFor = (iso: string) => {
      const numericId = ALPHA2_TO_NUMERIC[iso.toUpperCase()];
      return world.features.find(
        (f: any) => String(f.id).padStart(3, '0') === numericId
      );
    };

    const fA = featureFor(countryA);
    const fB = featureFor(countryB);
    if (!fA || !fB) return null;

    const scaleOf = (f: any) =>
      d3.geoAzimuthalEqualArea().fitSize([SHAPE_SIZE, SHAPE_SIZE], f).scale();
    const sharedScale = Math.min(scaleOf(fA), scaleOf(fB));

    const pathFor = (f: any) => {
      const proj = d3.geoAzimuthalEqualArea().fitSize([SHAPE_SIZE, SHAPE_SIZE], f);
      const s0 = proj.scale();
      const [tx, ty] = proj.translate();
      const k = sharedScale / s0;
      proj.scale(sharedScale).translate([
        SHAPE_SIZE / 2 + (tx - SHAPE_SIZE / 2) * k,
        SHAPE_SIZE / 2 + (ty - SHAPE_SIZE / 2) * k,
      ]);
      return d3.geoPath(proj)(f) || '';
    };

    return { pathA: pathFor(fA), pathB: pathFor(fB) };
  }, [mapData, countryA, countryB]);

  const areaCaption = useMemo(() => {
    if (!dataA?.areaKm2 || !dataB?.areaKm2) return null;
    const aBigger = dataA.areaKm2 >= dataB.areaKm2;
    const factor = aBigger
      ? dataA.areaKm2 / dataB.areaKm2
      : dataB.areaKm2 / dataA.areaKm2;
    if (factor < 1.05) return t('sizeEqual');
    return t('sizeCaption', {
      name: aBigger ? nameA : nameB,
      factor: factor.toFixed(factor < 10 ? 1 : 0),
    });
  }, [dataA, dataB, nameA, nameB, t]);

  const swap = () => {
    setCountryA(countryB);
    setCountryB(countryA);
  };

  const ready = dataA && dataB;

  return (
    <main className="container-custom animate-in fade-in relative z-10 flex-grow py-12 duration-1000">
      <div className="mx-auto w-full max-w-[860px]">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-[var(--primary)]/10 px-4 py-1.5 font-game-mono text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
            <Scale size={15} /> {t('title')}
          </div>
          <h1 className="mb-3 font-game-heading text-4xl uppercase tracking-widest text-[var(--foreground)] md:text-5xl">
            {t('heading')}
          </h1>
          <p className="mx-auto max-w-xl font-game-mono text-sm text-slate-500 md:text-base">
            {t('subtitle')}
          </p>
        </header>

        {/* Pickers */}
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          <CountryPicker
            label={t('countryA')}
            color={COLOR_A}
            value={countryA}
            onChange={setCountryA}
            countries={sortedCountries}
            locale={locale}
          />
          <button
            type="button"
            onClick={swap}
            aria-label={t('swap')}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--card-border)] bg-[var(--card-bg)] text-slate-400 transition-all duration-300 hover:rotate-180 hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <ArrowLeftRight size={18} />
          </button>
          <CountryPicker
            label={t('countryB')}
            color={COLOR_B}
            value={countryB}
            onChange={setCountryB}
            countries={sortedCountries}
            locale={locale}
          />
        </div>

        {ready && (
          <>
            {/* Relative size */}
            <section className="game-card mt-8">
              <h2 className="mb-1 text-center font-game-heading text-xl tracking-widest text-[var(--foreground)]">
                {t('sizeTitle')}
              </h2>
              <p className="mb-6 text-center font-game-mono text-[11px] uppercase tracking-widest text-slate-400">
                {t('equalArea')}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                {[
                  { path: shapes?.pathA, color: COLOR_A, name: nameA, area: dataA!.areaKm2, text: 'text-[var(--primary)]' },
                  { path: shapes?.pathB, color: COLOR_B, name: nameB, area: dataB!.areaKm2, text: 'text-amber-500' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <svg
                      viewBox={`0 0 ${SHAPE_SIZE} ${SHAPE_SIZE}`}
                      className="h-auto w-full max-w-[260px] overflow-visible"
                    >
                      {s.path && (
                        <path
                          d={s.path}
                          fill={s.color}
                          fillOpacity={0.18}
                          stroke={s.color}
                          strokeWidth={1.5}
                          strokeLinejoin="round"
                          className="transition-all duration-700"
                        />
                      )}
                    </svg>
                    <span className={`font-game-heading text-base tracking-wider ${s.text}`}>
                      {s.name}
                    </span>
                    {s.area ? (
                      <span className="font-game-mono text-xs text-slate-400">
                        {s.area.toLocaleString(locale)} km²
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {areaCaption && (
                <p className="mt-6 text-center font-game-mono text-sm text-slate-500">
                  {areaCaption}
                </p>
              )}
            </section>

            {/* Statistics */}
            <section className="game-card mt-8">
              <h2 className="mb-6 text-center font-game-heading text-xl tracking-widest text-[var(--foreground)]">
                {t('statsTitle')}
              </h2>

              <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--card-border)] pb-3 sm:gap-5">
                <span className="text-right font-game-heading text-lg tracking-wider text-[var(--primary)]">
                  {nameA}
                </span>
                <span className="w-24 sm:w-36" />
                <span className="text-left font-game-heading text-lg tracking-wider text-amber-500">
                  {nameB}
                </span>
              </div>

              {rows.map(row => (
                <StatRow key={row.label} row={row} />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
