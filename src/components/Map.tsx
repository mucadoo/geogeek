'use client';

import * as d3 from 'd3';
import { Globe2, Map as MapIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';

import MapPolygons from './MapPolygons';
import MapSidebar from './MapSidebar';

import {
  getContinentByCodeAction,
  getCountryByIsoAction,
  getSubdivisionByCodeAction,
  listSubdivisionsByCountryAction,
} from '@/app/actions';
import {
  CONTINENT_NAME_TO_CODE,
  CONTINENT_VIEWS,
  GLOBE_SCALE_DEFAULT,
  GLOBE_SCALE_RANGE,
  MERCATOR_SCALE,
  NUMERIC_TO_ALPHA2,
  NUMERIC_TO_CONTINENT,
  WORLD_WIDTH,
} from '@/config/mapConstants';
import { useCountrySubMap } from '@/hooks/useRegionMapData';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { getLocalizedValue } from '@/lib/i18n-utils';
import { fitFeatureFlat, isFrontFacing, orientationFor, wrapTranslateX } from '@/lib/mapProjection';
import { buildCodeByFeatureId } from '@/lib/subdivisionMatch';
import { useMapStore } from '@/store/useMapStore';
import { Continent, Country, Subdivision } from '@/types';

interface MapProps {
  slug?: string;
}

// Linear interpolator prevents the "swoop out" effect and flies directly to the target zoom
const linearZoomInterpolator = (a: d3.ZoomView, b: d3.ZoomView) => {
  const x = d3.interpolateNumber(a[0], b[0]);
  const y = d3.interpolateNumber(a[1], b[1]);
  const k = d3.interpolateNumber(a[2], b[2]);
  return (t: number) => [x(t), y(t), k(t)] as d3.ZoomView;
};

export default function Map({ slug }: MapProps) {
  const t = useTranslations('Map');
  const locale = useLocale();
  const router = useRouter();
  const { data: mapData, status } = useWorldMapData();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [activeCountry, setActiveCountry] = useState<Country | null>(null);
  // ISO 3166-2 code of the focused subdivision (2nd URL segment), uppercased.
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeSubdivision, setActiveSubdivision] = useState<Subdivision | null>(null);
  const [subdivisionsForCountry, setSubdivisionsForCountry] = useState<Subdivision[]>([]);
  const [activeContinent, setActiveContinent] = useState<Continent | null>(null);

  // Globe (orthographic) view state. Refs mirror the state so the drag / wheel
  // handlers registered once per view can read the live values without being
  // re-bound every frame. `rotation` = orthographic `.rotate([λ, φ])`.
  const [rotation, setRotation] = useState<[number, number]>(() => orientationFor([10, 25]));
  const [globeScale, setGlobeScale] = useState<number>(GLOBE_SCALE_DEFAULT);
  const rotationRef = useRef<[number, number]>(rotation);
  const globeScaleRef = useRef<number>(globeScale);
  rotationRef.current = rotation;
  globeScaleRef.current = globeScale;

  // Guards against a Rules-of-Hooks violation: this render must call the exact
  // same hooks on the server, the first client render, and every render after
  // the persisted map store rehydrates.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const slugParts = Array.isArray(slug) ? slug : (slug ? slug.split('/') : []);

  const ALPHA2_TO_NUMERIC = useMemo(() => {
    return Object.fromEntries(
      Object.entries(NUMERIC_TO_ALPHA2).map(([num, alpha]) => [alpha.toUpperCase(), num])
    );
  }, []);

  const {
    position, selectedContinent, tooltip, setTooltip,
    exploreMode, setExploreMode, resetMap, handleContinentClick,
    viewMode, setViewMode,
    _hasHydrated
  } = useMapStore();
  const isGlobe = viewMode === 'globe';

  const { data: subMapData } = useCountrySubMap(activeCountry?.isoCode || null);

  const isSubMap = !!(activeCountry && subMapData);
  const renderMapData = isSubMap ? subMapData : mapData;

  // Parsed sub-map region features (once per sub-map load).
  const subFeatures = useMemo(() => {
    if (!subMapData) return [] as any[];
    const geoObject = subMapData.objects.regions;
    if (!geoObject) return [] as any[];
    const features = feature(subMapData as any, geoObject as any) as any;
    return features.features as any[];
  }, [subMapData]);

  // TopoJSON feature id -> ISO 3166-2 code for the active country's sub-map.
  const codeByFeatureId = useMemo(() => {
    if (!activeCountry?.isoCode || subFeatures.length === 0 || subdivisionsForCountry.length === 0) {
      return {} as Record<string, string>;
    }
    return buildCodeByFeatureId(activeCountry.isoCode, subFeatures, subdivisionsForCountry);
  }, [activeCountry?.isoCode, subFeatures, subdivisionsForCountry]);

  const activeRegionName = useMemo(() => {
    if (!activeRegion) return null;
    if (activeSubdivision) return getLocalizedValue(activeSubdivision.name, locale);
    return activeRegion;
  }, [activeRegion, activeSubdivision, locale]);

  // Region picker list: prefer the sub-map's own regions (so it lines up with
  // what's drawn), otherwise fall back to the full subdivision list (data-only
  // browser for countries without map geometry).
  const regionsList = useMemo(() => {
    if (subFeatures.length > 0 && Object.keys(codeByFeatureId).length > 0) {
      const seen = new Set<string>();
      const byCode: Record<string, Subdivision> = {};
      for (const s of subdivisionsForCountry) byCode[s.code] = s;
      const rows: { code: string; name: string }[] = [];
      for (const f of subFeatures) {
        const code = codeByFeatureId[String(f.id)];
        if (!code || seen.has(code)) continue;
        seen.add(code);
        const sub = byCode[code];
        rows.push({ code, name: sub ? getLocalizedValue(sub.name, locale) : code });
      }
      return rows.sort((a, b) => a.name.localeCompare(b.name));
    }
    return subdivisionsForCountry
      .map((s) => ({ code: s.code, name: getLocalizedValue(s.name, locale) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [subFeatures, codeByFeatureId, subdivisionsForCountry, locale]);

  const handleBackClick = () => {
    if (activeRegion) {
      router.push(`/map/${slugParts[0]}`);
    } else if (activeCountry?.isoCode) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const continent = NUMERIC_TO_CONTINENT[numericId];
      if (continent) {
        const continentSlug = continent.toLowerCase().replace(/\s+/g, '-');
        router.push('/map/' + continentSlug);
      } else {
        router.push('/map');
      }
    } else if (selectedContinent) {
      router.push('/map');
    }
  };

  const width = 800;
  const height = 450;

  const flatProjection = useMemo(() => {
    return d3.geoMercator().scale(MERCATOR_SCALE).translate([width / 2, height / 2 + 50]);
  }, []);

  const globeProjection = useMemo(() => {
    return d3.geoOrthographic()
      .scale(globeScale)
      .translate([width / 2, height / 2])
      .rotate([rotation[0], rotation[1]])
      .clipAngle(90);
  }, [globeScale, rotation]);

  const projection = isGlobe ? globeProjection : flatProjection;

  const globeOverlay = useMemo(() => {
    if (!isGlobe) return null;
    const p = d3.geoPath(globeProjection);
    return {
      sphere: p({ type: 'Sphere' } as d3.GeoPermissibleObjects) ?? undefined,
      graticule: p(d3.geoGraticule10() as d3.GeoPermissibleObjects) ?? undefined,
    };
  }, [isGlobe, globeProjection]);

  const targetIso = activeCountry?.isoCode?.toLowerCase() || (slugParts.length === 1 && slugParts[0].length === 2 ? slugParts[0].toLowerCase() : undefined);

  useEffect(() => {
    async function initView() {
      if (slugParts.length === 0) {
        resetMap();
        setActiveCountry(null);
        setActiveRegion(null);
        setActiveSubdivision(null);
        setSubdivisionsForCountry([]);
        setActiveContinent(null);
        return;
      }

      const firstPart = slugParts[0];
      const secondPart = slugParts[1];
      const regionCode = secondPart ? secondPart.toUpperCase() : null;

      // Handle Continent
      const continentName = firstPart.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const view = CONTINENT_VIEWS[continentName as keyof typeof CONTINENT_VIEWS];

      if (view) {
        handleContinentClick(continentName, view);
        setActiveCountry(null);
        setActiveRegion(null);
        setActiveSubdivision(null);
        setSubdivisionsForCountry([]);
        const continentCode = CONTINENT_NAME_TO_CODE[continentName];
        setActiveContinent(continentCode ? await getContinentByCodeAction(continentCode) : null);
        return;
      }

      // Handle Country (+ optional subdivision)
      if (firstPart.length === 2) {
        const iso = firstPart.toUpperCase();
        setActiveRegion(regionCode);
        setActiveContinent(null);

        if (activeCountry?.isoCode !== iso) {
          const [country, subs] = await Promise.all([
            getCountryByIsoAction(iso),
            listSubdivisionsByCountryAction(iso),
          ]);
          setActiveCountry(country || null);
          setSubdivisionsForCountry(country ? subs : []);
          if (!country) {
            setActiveRegion(null);
            setActiveSubdivision(null);
            return;
          }
        }

        setActiveSubdivision(regionCode ? await getSubdivisionByCodeAction(regionCode) : null);
      } else {
        // Fallback for unknown slugs
        resetMap();
        setActiveCountry(null);
        setActiveRegion(null);
        setActiveSubdivision(null);
        setSubdivisionsForCountry([]);
        setActiveContinent(null);
      }
    }
    initView();
  }, [slug, handleContinentClick, resetMap, activeCountry?.isoCode]);

  // --- FLAT MAP: pan / zoom (d3-zoom transform on <g>), with horizontal wrap ---
  useEffect(() => {
    if (isGlobe || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const node = svgRef.current;
    const isInitialized = !!svg.property('__zoom');

    // Fold the pan offset back onto the centre world copy after a user gesture,
    // so the 3 rendered copies always cover the viewport. Skipped for
    // programmatic moves (their targets are already wrapped) to avoid a mid-flight
    // jump when the flight path crosses a copy boundary.
    const wrapTransform = (t: d3.ZoomTransform, userDriven: boolean) => {
      if (isSubMap || !userDriven) return t;
      const nx = wrapTranslateX(t.x, t.k, WORLD_WIDTH);
      if (nx === t.x) return t;
      const wrapped = d3.zoomIdentity.translate(nx, t.y).scale(t.k);
      // Keep d3-zoom's stored transform in sync so the next gesture continues
      // smoothly — the world copies are identical, so the shift is invisible.
      (node as unknown as { __zoom: d3.ZoomTransform }).__zoom = wrapped;
      return wrapped;
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .touchable(true)
      .interpolate(linearZoomInterpolator)
      .on('start', () => {
        svg.attr('shape-rendering', 'optimizeSpeed');
      })
      .on('zoom', (event) => {
        g.attr('transform', wrapTransform(event.transform, !!event.sourceEvent).toString());
      })
      .on('end', () => {
        svg.attr('shape-rendering', 'geometricPrecision');
      });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    const flyTo = (t: d3.ZoomTransform) => {
      svg.transition().duration(750).call(zoom.transform, t);
    };

    if (!isInitialized) {
      const [lng, lat] = position.coordinates;
      const [x, y] = flatProjection([lng, lat]) || [width / 2, height / 2];
      const base = d3.zoomIdentity.translate(width / 2, height / 2).scale(position.zoom).translate(-x, -y);
      svg.call(zoom.transform, d3.zoomIdentity.translate(wrapTranslateX(base.x, base.k, WORLD_WIDTH), base.y).scale(base.k));
    }

    const targetWidth = width * 0.6;

    if (activeCountry?.isoCode && activeRegion && subMapData) {
      const featureData = subFeatures.find((f: any) => codeByFeatureId[String(f.id)] === activeRegion);
      if (featureData) {
        flyTo(fitFeatureFlat(featureData, flatProjection, WORLD_WIDTH, targetWidth, height));
        return;
      }
    }

    if (activeCountry?.isoCode && mapData) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const world = feature(mapData as any, mapData.objects.countries as any) as any;
      const featureData = world.features.find((f: any) => String(f.id).padStart(3, '0') === numericId);
      if (featureData) {
        flyTo(fitFeatureFlat(featureData, flatProjection, WORLD_WIDTH, targetWidth, height));
        return;
      }
    }

    if (isInitialized && !activeCountry) {
      const [lng, lat] = position.coordinates;
      const [x, y] = flatProjection([lng, lat]) || [width / 2, height / 2];
      const base = d3.zoomIdentity.translate(width / 2, height / 2).scale(position.zoom).translate(-x, -y);
      flyTo(d3.zoomIdentity.translate(wrapTranslateX(base.x, base.k, WORLD_WIDTH), base.y).scale(base.k));
    }
  }, [isGlobe, position, flatProjection, activeCountry, activeRegion, isSubMap, mapData, subMapData, subFeatures, codeByFeatureId, ALPHA2_TO_NUMERIC]);

  // --- GLOBE: drag to rotate, wheel to zoom (registered once per view) ---
  useEffect(() => {
    if (!isGlobe || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const node = svgRef.current;

    svg.on('.zoom', null);
    g.attr('transform', null);

    let raf: number | null = null;
    const flush = () => {
      raf = null;
      setRotation([rotationRef.current[0], rotationRef.current[1]]);
    };
    const schedule = () => { if (raf == null) raf = requestAnimationFrame(flush); };

    const drag = d3.drag<SVGSVGElement, unknown>()
      .clickDistance(4)
      .on('start', () => svg.attr('shape-rendering', 'optimizeSpeed'))
      .on('drag', (event) => {
        const sens = 0.22 * (GLOBE_SCALE_DEFAULT / globeScaleRef.current);
        const [l, p] = rotationRef.current;
        rotationRef.current = [l + event.dx * sens, Math.max(-90, Math.min(90, p - event.dy * sens))];
        schedule();
      })
      .on('end', () => svg.attr('shape-rendering', 'geometricPrecision'));

    svg.call(drag);

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = globeScaleRef.current * Math.pow(1.0016, -event.deltaY);
      const clamped = Math.max(GLOBE_SCALE_RANGE[0], Math.min(GLOBE_SCALE_RANGE[1], next));
      globeScaleRef.current = clamped;
      setGlobeScale(clamped);
    };
    node.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      svg.on('.drag', null);
      node.removeEventListener('wheel', onWheel);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [isGlobe]);

  // --- GLOBE: rotate / zoom toward the focused continent, country or region ---
  useEffect(() => {
    if (!isGlobe) return;

    let point: [number, number] | null = null;
    let targetScale = globeScaleRef.current;

    if (activeCountry?.isoCode && activeRegion && subMapData) {
      const f = subFeatures.find((x: any) => codeByFeatureId[String(x.id)] === activeRegion);
      if (f) { point = d3.geoCentroid(f); targetScale = GLOBE_SCALE_DEFAULT * 4; }
    }
    if (!point && activeCountry?.isoCode && mapData) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const world = feature(mapData as any, mapData.objects.countries as any) as any;
      const f = world.features.find((x: any) => String(x.id).padStart(3, '0') === numericId);
      if (f) { point = d3.geoCentroid(f); targetScale = GLOBE_SCALE_DEFAULT * 2.4; }
    }
    if (!point && selectedContinent) {
      const view = CONTINENT_VIEWS[selectedContinent as keyof typeof CONTINENT_VIEWS];
      if (view) { point = view.coordinates; targetScale = GLOBE_SCALE_DEFAULT * 1.5; }
    }
    if (!point && !activeCountry && !selectedContinent) {
      point = [10, 25];
      targetScale = GLOBE_SCALE_DEFAULT;
    }
    if (!point) return;

    const [sl, sp] = rotationRef.current;
    const [tl, tp] = orientationFor(point);
    const dl = ((tl - sl) % 360 + 540) % 360 - 180;
    const dp = tp - sp;
    const sScale = globeScaleRef.current;
    const dScale = targetScale - sScale;
    if (Math.abs(dl) < 0.5 && Math.abs(dp) < 0.5 && Math.abs(dScale) < 1) return;

    const start = performance.now();
    let raf = requestAnimationFrame(function step(now) {
      const u = Math.min(1, (now - start) / 750);
      const e = d3.easeCubicInOut(u);
      rotationRef.current = [sl + dl * e, sp + dp * e];
      globeScaleRef.current = sScale + dScale * e;
      setRotation([rotationRef.current[0], rotationRef.current[1]]);
      setGlobeScale(globeScaleRef.current);
      if (u < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [isGlobe, activeCountry, activeRegion, selectedContinent, mapData, subMapData, subFeatures, codeByFeatureId, ALPHA2_TO_NUMERIC]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
  };

  // Guard render to avoid hydration mismatches / hooks-order changes.
  if (!mounted || !_hasHydrated) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="font-medium text-slate-500 mt-2">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 h-full w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
    >
      {status === 'pending' && (
        <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-4 bg-[var(--background)]">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="font-medium text-slate-500">{t('loading')}</p>
        </div>
      )}

      {status === 'success' && (
        <React.Fragment>

          {/* Flat map / globe switch + back button (stacked, top-left) */}
          <div className="absolute top-24 left-6 z-30 flex flex-col gap-2 md:left-10">
            <div className="flex gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/85 p-1 shadow-xl backdrop-blur-md">
              <button
                onClick={() => setViewMode('flat')}
                title={t('flatView')}
                aria-label={t('flatView')}
                aria-pressed={!isGlobe}
                className={`rounded-full p-2 transition-all ${!isGlobe ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                <MapIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('globe')}
                title={t('globeView')}
                aria-label={t('globeView')}
                aria-pressed={isGlobe}
                className={`rounded-full p-2 transition-all ${isGlobe ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                <Globe2 size={18} />
              </button>
            </div>

            {(selectedContinent || activeCountry) && (
              <button
                onClick={handleBackClick}
                title={activeCountry ? t('returnToContinent') : t('returnToWorld')}
                className="animate-in fade-in slide-in-from-left-4 group cursor-pointer self-start rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] p-3 shadow-xl transition-all duration-500 hover:scale-105 pointer-events-auto"
              >
                <Image
                  src="/media/back_icon.svg"
                  alt={activeCountry ? t('returnToContinent') : t('returnToWorld')}
                  width={32}
                  height={32}
                  className="hue-rotate-[180deg] saturate-[3] sepia-[1] transition-all group-hover:invert-[0.3]"
                />
              </button>
            )}
          </div>

          {/* View Toggles on World Map */}
          {!selectedContinent && !activeCountry && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/85 p-1.5 shadow-xl backdrop-blur-md">
              <button
                onClick={() => setExploreMode('continent')}
                className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${exploreMode === 'continent' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                Continents
              </button>
              <button
                onClick={() => setExploreMode('country')}
                className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${exploreMode === 'country' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                Countries
              </button>
            </div>
          )}

          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[120%] transform rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/95 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-[var(--foreground)] shadow-xl backdrop-blur transition-opacity duration-150"
            style={{ left: tooltip.x, top: tooltip.y, opacity: tooltip.show ? 1 : 0 }}
          >
            {tooltip.content}
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full outline-none cursor-grab active:cursor-grabbing touch-none"
          >
            <g ref={gRef} className="will-change-transform">
              {isGlobe && globeOverlay && (
                <g className="pointer-events-none">
                  <path
                    d={globeOverlay.sphere}
                    fill="var(--map-fill)"
                    fillOpacity={0.35}
                    stroke="var(--map-stroke)"
                    strokeWidth={0.75}
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={globeOverlay.graticule}
                    fill="none"
                    stroke="var(--map-stroke)"
                    strokeOpacity={0.35}
                    strokeWidth={0.4}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
              {renderMapData && (
                <MapPolygons
                  mapData={renderMapData}
                  projection={projection}
                  activeCountryIso={targetIso}
                  isSubMap={isSubMap}
                  subdivisions={subdivisionsForCountry}
                  activeRegionCode={activeRegion}
                  repeat={!isGlobe && !isSubMap}
                  worldWidth={WORLD_WIDTH}
                />
              )}
              {(() => {
                // When a subdivision is focused, mark its capital / administrative
                // seat; otherwise mark the country's capital.
                const source = activeSubdivision ?? activeCountry;
                const coords = source?.capitalCoordinates;
                if (!coords) return null;
                if (isGlobe && !isFrontFacing([coords.lng, coords.lat], rotation)) return null;
                const projected = projection([coords.lng, coords.lat]);
                if (!projected) return null;
                return (
                  <g>
                    <circle
                      cx={projected[0]}
                      cy={projected[1]}
                      r={4}
                      fill="var(--primary)"
                      stroke="white"
                      strokeWidth={1}
                    />
                    <text
                      x={projected[0] + 8}
                      y={projected[1] + 4}
                      className="font-game-mono text-xs fill-[var(--foreground)]"
                    >
                      {getLocalizedValue(source.capital, locale)}
                    </text>
                  </g>
                );
              })()}
            </g>
          </svg>

          {activeCountry && (
            <MapSidebar
              type={activeSubdivision ? 'region' : 'country'}
              title={activeSubdivision ? (activeRegionName ?? '') : getLocalizedValue(activeCountry.name, locale)}
              data={activeCountry}
              subdivision={activeSubdivision}
              subdivisions={subdivisionsForCountry}
              regionsList={regionsList}
              activeRegionCode={activeRegion}
            />
          )}

          {!activeCountry && activeContinent && (
            <MapSidebar
              type="continent"
              title={getLocalizedValue(activeContinent.name, locale)}
              continent={activeContinent}
            />
          )}
        </React.Fragment>
      )}
    </div>
  );
}
