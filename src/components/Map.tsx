'use client';

import * as d3 from 'd3';
import { ArrowLeft, Globe2, Map as MapIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';

import MapPolygons from './MapPolygons';
import MapSidebar from './MapSidebar';
import { SimpleTooltip } from './ui/tooltip';

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
import { fitFeatureFlat, fitFeatureGlobe, isFrontFacing, orientationFor, rebaseTranslateX, wrapTranslateX } from '@/lib/mapProjection';
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

  // Globe (orthographic) view state. `rotation` = orthographic `.rotate([λ, φ])`.
  // The refs are the source of truth for the live globe pose — the drag/wheel
  // handlers and the fly-to animation write them synchronously and mirror into
  // state for rendering. Do NOT re-sync state -> ref on every render: a drag
  // writes the ref ahead of the (rAF-batched) state, and a re-render in that
  // gap (e.g. the route change from clicking a continent) would clobber the
  // ref back to the stale rotation, making the next fly-to jump from there.
  const [rotation, setRotation] = useState<[number, number]>(() => orientationFor([10, 25]));
  const [globeScale, setGlobeScale] = useState<number>(GLOBE_SCALE_DEFAULT);
  const rotationRef = useRef<[number, number]>(rotation);
  const globeScaleRef = useRef<number>(globeScale);

  // Flat-map zoom behavior + "where are we flying to" bookkeeping. The zoom is
  // built once per view (see the setup effect); the fly-to effect issues at most
  // one transition per distinct target so async data settling never restarts an
  // in-flight flight.
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const lastFlatKeyRef = useRef<string | null>(null);
  const lastGlobeKeyRef = useRef<string | null>(null);
  const isSubMapRef = useRef(false);

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

  const positionRef = useRef(position);
  positionRef.current = position;

  const { data: subMapData } = useCountrySubMap(activeCountry?.isoCode || null);

  const isSubMap = !!(activeCountry && subMapData);
  isSubMapRef.current = isSubMap;
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
      const rows: { code: string; name: string; flagUrl: string | null }[] = [];
      for (const f of subFeatures) {
        const code = codeByFeatureId[String(f.id)];
        if (!code || seen.has(code)) continue;
        seen.add(code);
        const sub = byCode[code];
        rows.push({
          code,
          name: sub ? getLocalizedValue(sub.name, locale) : code,
          flagUrl: sub?.flagUrl ?? null,
        });
      }
      return rows.sort((a, b) => a.name.localeCompare(b.name));
    }
    return subdivisionsForCountry
      .map((s) => ({ code: s.code, name: getLocalizedValue(s.name, locale), flagUrl: s.flagUrl }))
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

  // Vertical pan clamp for the flat map: the projected top/bottom of the sphere
  // (Mercator's ±85° limit). Horizontal panning stays free — it wraps.
  const flatYExtent = useMemo(() => {
    const [[, y0], [, y1]] = d3.geoPath(flatProjection).bounds({ type: 'Sphere' } as d3.GeoPermissibleObjects);
    return [y0, y1] as [number, number];
  }, [flatProjection]);

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

  // World-atlas country features, parsed once per map load. Shared by the flat
  // and globe fly-to targets.
  const worldCountryFeatures = useMemo(() => {
    if (!mapData) return [] as any[];
    return (feature(mapData as any, mapData.objects.countries as any) as any).features as any[];
  }, [mapData]);

  // The single place that answers "where should the flat map be framed right
  // now?". `key` identifies the destination; the fly-to effect animates only
  // when it changes, so data loading in stages never restarts a flight.
  const flatViewTarget = useMemo<{ key: string; transform: d3.ZoomTransform } | null>(() => {
    const targetWidth = width * 0.6;

    const positionTransform = () => {
      const [lng, lat] = position.coordinates;
      const [x, y] = flatProjection([lng, lat]) || [width / 2, height / 2];
      const base = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(position.zoom)
        .translate(-x, -y);
      return d3.zoomIdentity
        .translate(wrapTranslateX(base.x, base.k, WORLD_WIDTH), base.y)
        .scale(base.k);
    };

    if (activeCountry?.isoCode && activeRegion && subMapData) {
      const f = subFeatures.find((x: any) => codeByFeatureId[String(x.id)] === activeRegion);
      if (f) {
        return {
          key: `region:${activeCountry.isoCode}:${activeRegion}`,
          transform: fitFeatureFlat(f, flatProjection, WORLD_WIDTH, targetWidth, height),
        };
      }
    }

    // Also the fallback while a focused region's geometry is still loading.
    if (activeCountry?.isoCode) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const f = worldCountryFeatures.find((x: any) => String(x.id).padStart(3, '0') === numericId);
      if (f) {
        return {
          key: `country:${activeCountry.isoCode}`,
          transform: fitFeatureFlat(f, flatProjection, WORLD_WIDTH, targetWidth, height),
        };
      }
    }

    if (selectedContinent) {
      return { key: `continent:${selectedContinent}`, transform: positionTransform() };
    }

    return { key: 'world', transform: positionTransform() };
  }, [activeCountry, activeRegion, subMapData, subFeatures, codeByFeatureId, worldCountryFeatures, ALPHA2_TO_NUMERIC, flatProjection, selectedContinent, position]);

  // Same idea for the globe: a target point + zoom scale, keyed so the rotation
  // animation runs once per destination.
  const globeViewTarget = useMemo<{ key: string; point: [number, number]; scale: number }>(() => {
    if (activeCountry?.isoCode && activeRegion && subMapData) {
      const f = subFeatures.find((x: any) => codeByFeatureId[String(x.id)] === activeRegion);
      if (f) {
        const cap = activeSubdivision?.capitalCoordinates;
        const centre: [number, number] = cap ? [cap.lng, cap.lat] : (d3.geoCentroid(f) as [number, number]);
        return {
          key: `region:${activeCountry.isoCode}:${activeRegion}`,
          ...fitFeatureGlobe(f, centre, height, GLOBE_SCALE_DEFAULT),
        };
      }
    }
    if (activeCountry?.isoCode) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const f = worldCountryFeatures.find((x: any) => String(x.id).padStart(3, '0') === numericId);
      const cap = activeCountry.capitalCoordinates;
      if (cap || f) {
        const centre: [number, number] = cap
          ? [cap.lng, cap.lat]
          : (d3.geoCentroid(f) as [number, number]);
        return {
          key: `country:${activeCountry.isoCode}`,
          ...(f
            ? fitFeatureGlobe(f, centre, height, GLOBE_SCALE_DEFAULT)
            : { point: centre, scale: GLOBE_SCALE_DEFAULT * 2.4 }),
        };
      }
    }
    if (selectedContinent) {
      const view = CONTINENT_VIEWS[selectedContinent as keyof typeof CONTINENT_VIEWS];
      if (view) {
        return { key: `continent:${selectedContinent}`, point: view.coordinates, scale: GLOBE_SCALE_DEFAULT * 1.5 };
      }
    }
    return { key: 'world', point: [10, 25], scale: GLOBE_SCALE_DEFAULT };
  }, [activeCountry, activeRegion, activeSubdivision, subMapData, subFeatures, codeByFeatureId, worldCountryFeatures, ALPHA2_TO_NUMERIC, selectedContinent]);

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

  // Switching projection resets the fly-to bookkeeping so the newly shown view
  // re-frames itself (the hidden view can't animate anyway).
  useEffect(() => {
    lastFlatKeyRef.current = null;
    lastGlobeKeyRef.current = null;
  }, [isGlobe]);

  // --- FLAT MAP: install the d3-zoom behavior once per view ---
  useEffect(() => {
    if (isGlobe || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const node = svgRef.current;
    const isInitialized = !!svg.property('__zoom');

    // Fold the pan offset back onto the centre world copy after a user gesture,
    // so the 3 rendered copies always cover the viewport. Skipped for
    // programmatic moves (the fly-to effect already picks the nearest copy).
    const wrapTransform = (t: d3.ZoomTransform, userDriven: boolean) => {
      if (isSubMapRef.current || !userDriven) return t;
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
      .translateExtent([[-Infinity, flatYExtent[0]], [Infinity, flatYExtent[1]]])
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

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    if (!isInitialized) {
      const [lng, lat] = positionRef.current.coordinates;
      const [x, y] = flatProjection([lng, lat]) || [width / 2, height / 2];
      const base = d3.zoomIdentity.translate(width / 2, height / 2).scale(positionRef.current.zoom).translate(-x, -y);
      // Fold onto the centre world copy so the −1/+1 copies backfill both edges;
      // rebasing toward screen-centre here could shift past the last copy and
      // leave a gap at the viewport edge before the first pan.
      const seedX = wrapTranslateX(base.x, base.k, WORLD_WIDTH);
      svg.call(zoom.transform, d3.zoomIdentity.translate(seedX, base.y).scale(base.k));
    } else {
      // Returning from the globe: the globe effect cleared the <g> transform —
      // restore it from d3-zoom's stored value so the map doesn't flash unzoomed.
      g.attr('transform', (svg.property('__zoom') as d3.ZoomTransform).toString());
    }

    return () => {
      svg.on('.zoom', null);
      zoomRef.current = null;
    };
    // `status` matters: on a cold load the <svg> isn't mounted until the
    // world-atlas fetch resolves, so this must re-run once it does.
  }, [isGlobe, flatProjection, flatYExtent, mounted, _hasHydrated, status]);

  // --- FLAT MAP: fly to the current target, at most once per destination ---
  useEffect(() => {
    if (isGlobe || !svgRef.current || !flatViewTarget) return;
    const zoom = zoomRef.current;
    if (!zoom) return;

    if (flatViewTarget.key === lastFlatKeyRef.current) return;
    const isFirst = lastFlatKeyRef.current === null;
    lastFlatKeyRef.current = flatViewTarget.key;

    const svg = d3.select(svgRef.current);
    const node = svgRef.current as unknown as { __zoom?: d3.ZoomTransform };
    const t = flatViewTarget.transform;
    // Take the shortest horizontal path: aim for the world copy nearest the
    // current pan position rather than the centre one.
    const refX = node.__zoom ? node.__zoom.x : width / 2;
    const target = d3.zoomIdentity
      .translate(rebaseTranslateX(t.x, refX, t.k, WORLD_WIDTH), t.y)
      .scale(t.k);

    if (isFirst) {
      svg.call(zoom.transform, target);
    } else {
      svg.transition().duration(750).ease(d3.easeCubicInOut).call(zoom.transform, target);
    }
  }, [isGlobe, flatViewTarget, mounted, _hasHydrated, status]);

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
  }, [isGlobe, mounted, _hasHydrated, status]);

  // --- GLOBE: rotate / zoom toward the current target, once per destination ---
  // Depend on the primitive target values, not the `globeViewTarget` object:
  // it's rebuilt (same values, new identity) whenever an unrelated dep like the
  // world-atlas features settle, and re-running here would cancel an in-flight
  // fly-to and then early-return on the matching key — leaving the globe stuck
  // mid-animation (e.g. a hard reload onto /map/<continent> never centring).
  const { key: globeTargetKey, scale: globeTargetScale } = globeViewTarget;
  const [globeTargetLng, globeTargetLat] = globeViewTarget.point;
  useEffect(() => {
    if (!isGlobe) return;
    if (globeTargetKey === lastGlobeKeyRef.current) return;
    lastGlobeKeyRef.current = globeTargetKey;

    const [sl, sp] = rotationRef.current;
    const [tl, tp] = orientationFor([globeTargetLng, globeTargetLat]);
    const dl = ((tl - sl) % 360 + 540) % 360 - 180;
    const dp = tp - sp;
    const sScale = globeScaleRef.current;
    const dScale = globeTargetScale - sScale;
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
  }, [isGlobe, globeTargetKey, globeTargetLng, globeTargetLat, globeTargetScale]);

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

          {/* Flat/globe switch, continent/country toggle + back button (stacked, top-left) */}
          <div className="absolute top-24 left-6 z-30 flex flex-col items-start gap-2 md:left-10">
            <div className="flex gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/85 p-1 shadow-xl backdrop-blur-md">
              <SimpleTooltip label={t('flatView')} side="right">
                <button
                  onClick={() => setViewMode('flat')}
                  aria-label={t('flatView')}
                  aria-pressed={!isGlobe}
                  className={`rounded-full p-2 transition-all ${!isGlobe ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  <MapIcon size={18} />
                </button>
              </SimpleTooltip>
              <SimpleTooltip label={t('globeView')} side="right">
                <button
                  onClick={() => setViewMode('globe')}
                  aria-label={t('globeView')}
                  aria-pressed={isGlobe}
                  className={`rounded-full p-2 transition-all ${isGlobe ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  <Globe2 size={18} />
                </button>
              </SimpleTooltip>
            </div>

            {/* Continents / Countries toggle (world view only) */}
            {!selectedContinent && !activeCountry && (
              <div className="flex gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/85 p-1 shadow-xl backdrop-blur-md">
                <button
                  onClick={() => setExploreMode('continent')}
                  aria-pressed={exploreMode === 'continent'}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all ${exploreMode === 'continent' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  Continents
                </button>
                <button
                  onClick={() => setExploreMode('country')}
                  aria-pressed={exploreMode === 'country'}
                  className={`rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all ${exploreMode === 'country' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  Countries
                </button>
              </div>
            )}

            {(selectedContinent || activeCountry) && (
              <SimpleTooltip label={activeCountry ? t('returnToContinent') : t('returnToWorld')} side="right">
                <button
                  onClick={handleBackClick}
                  aria-label={activeCountry ? t('returnToContinent') : t('returnToWorld')}
                  className="animate-in fade-in slide-in-from-left-4 self-start rounded-full border border-[var(--card-border)] bg-[var(--card-bg)]/85 p-2.5 text-slate-500 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:text-primary"
                >
                  <ArrowLeft size={18} />
                </button>
              </SimpleTooltip>
            )}
          </div>

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
