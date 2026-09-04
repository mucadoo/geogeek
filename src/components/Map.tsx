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
  listChildSubdivisionsAction,
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
import { fitAreaGlobe, fitFeatureFlat, fitFeatureGlobe, isFrontFacing, mainlandCentroid, orientationFor, rebaseTranslateX, wrapTranslateX } from '@/lib/mapProjection';
import { buildCodeByFeatureId } from '@/lib/subdivisionMatch';
import { useMapStore } from '@/store/useMapStore';
import { Continent, Country, Subdivision } from '@/types';

interface MapProps {
  slug?: string;
}

// Flat-map d3-zoom scale ceiling. Well above a large country's fitted zoom
// (~10×) so small countries (Luxembourg, Malta) and first-level subdivisions —
// often well under 1° across, needing 40–250× on this MERCATOR_SCALE=120 world —
// actually fill the frame instead of hitting the cap and staying a distant speck.
const FLAT_MAX_ZOOM = 400;
const COUNTRY_MAX_ZOOM = 220;
const SUBDIVISION_MAX_ZOOM = 320;

// The country ISO a `flatViewTarget` / `globeViewTarget` key belongs to, or null
// for world / continent keys. Used to decide whether a persisted flatFocus (or
// the live globe pose) still applies after a remount into the same country.
const keyCountryIso = (key: string | null | undefined): string | null => {
  if (!key) return null;
  const [kind, iso] = key.split(':');
  return (kind === 'country' || kind === 'region') && iso ? iso.toUpperCase() : null;
};

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
  // Second-level units in scope for the current view: the children of a focused
  // level-1 subdivision, or the siblings of a focused level-2 one. Empty otherwise.
  const [relatedSubdivisions, setRelatedSubdivisions] = useState<Subdivision[]>([]);
  const [activeContinent, setActiveContinent] = useState<Continent | null>(null);
  // Live flat-map zoom scale, mirrored at rest (seed / fly-to / gesture end) so
  // the capital marker can counter-scale and stay a constant on-screen size
  // instead of ballooning with the <g> zoom transform at a subdivision's ~300×.
  const [flatZoom, setFlatZoom] = useState(1);

  // Globe (orthographic) view state. `rotation` = orthographic `.rotate([λ, φ])`.
  // Lives in the store (see useMapStore) so it survives the <Map> remount on
  // every /map ↔ /map/<x> navigation. The refs are the live source of truth —
  // the drag/wheel handlers and the fly-to animation write them synchronously
  // and mirror into the store for rendering. Do NOT re-sync store -> ref on
  // every render: a drag writes the ref ahead of the (rAF-batched) store, and a
  // re-render in that gap would clobber the ref back to the stale rotation.
  const { globeRotation: rotation, setGlobeRotation: setRotation, globeScale, setGlobeScale } = useMapStore();
  const rotationRef = useRef<[number, number]>(rotation);
  const globeScaleRef = useRef<number>(globeScale);

  // Flat-map zoom behavior + "where are we flying to" bookkeeping. The zoom is
  // built once per view (see the setup effect); the fly-to effect issues at most
  // one transition per distinct target so async data settling never restarts an
  // in-flight flight.
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const lastFlatKeyRef = useRef<string | null>(null);
  const lastGlobeTargetRef = useRef<{ key: string; lng: number; lat: number; scale: number } | null>(null);
  const globeFlyRafRef = useRef<number | null>(null);
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

  // Flat <-> globe is a hard projection swap (Mercator zoom-transform vs.
  // re-projected orthographic). Rather than let it cut, fade the map out, swap
  // while it's invisible, then fade the new projection back in.
  const [viewSwitching, setViewSwitching] = useState(false);
  const switchTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const switchView = (mode: 'flat' | 'globe') => {
    if (mode === viewMode || viewSwitching) return;
    switchTimersRef.current.forEach(clearTimeout);
    setViewSwitching(true);
    switchTimersRef.current = [
      setTimeout(() => setViewMode(mode), 220),
      setTimeout(() => setViewSwitching(false), 300),
    ];
  };
  useEffect(() => () => switchTimersRef.current.forEach(clearTimeout), []);

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

  // The containing first-level subdivision when a level-2 one is focused. It's
  // already in the country's first-level list, so no extra fetch.
  const parentSubdivision = useMemo(() => {
    if (activeSubdivision?.level !== 2 || !activeSubdivision.parentCode) return null;
    return subdivisionsForCountry.find((s) => s.code === activeSubdivision.parentCode) ?? null;
  }, [activeSubdivision, subdivisionsForCountry]);

  // The first-level code the map should frame / highlight. A level-2 unit has no
  // geometry of its own, so the map centres on its parent region instead.
  const frameRegionCode = useMemo(() => {
    if (activeSubdivision?.level === 2 && activeSubdivision.parentCode) return activeSubdivision.parentCode;
    return activeRegion;
  }, [activeSubdivision, activeRegion]);

  // Region picker list: prefer the sub-map's own regions (so it lines up with
  // what's drawn), otherwise fall back to the full subdivision list (data-only
  // browser for countries without map geometry).
  const regionsList = useMemo(() => {
    // Focused on a second-level unit: the picker lists its siblings, not the
    // country's first-level regions.
    if (activeSubdivision?.level === 2) {
      return relatedSubdivisions
        .map((s) => ({ code: s.code, name: getLocalizedValue(s.name, locale), flagUrl: s.flagUrl }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
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
  }, [activeSubdivision, relatedSubdivisions, subFeatures, codeByFeatureId, subdivisionsForCountry, locale]);

  const handleBackClick = () => {
    if (activeRegion) {
      // From a level-2 unit, step up to its parent region rather than all the
      // way out to the country.
      if (activeSubdivision?.level === 2 && activeSubdivision.parentCode) {
        router.push(`/map/${slugParts[0]}/${activeSubdivision.parentCode}`);
      } else {
        router.push(`/map/${slugParts[0]}`);
      }
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
      .clipAngle(90)
      // Coarser adaptive resampling — the globe re-projects every path on every
      // drag / fly-to frame, and at a country's zoom the default ~0.5px
      // threshold explodes the point count of every border and graticule line.
      .precision(1.2);
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

  // The country in view, from the loaded record or — before it loads — straight
  // from the URL (`/map/<iso>` or `/map/<iso>/<region>`), so both maps head for
  // the country on the first render instead of flashing through the world view.
  const targetIso = activeCountry?.isoCode?.toLowerCase() || (slugParts[0]?.length === 2 ? slugParts[0].toLowerCase() : undefined);
  // ISO 3166-2 code the URL points at (`/map/<iso>/<region>`), uppercased, before
  // `activeRegion` catches up on the next render. When set, neither map falls
  // back to the whole-country frame while the subdivision geometry loads.
  const regionSlug = slugParts[1] && /^[A-Za-z]{2}-/.test(slugParts[1]) ? slugParts[1].toUpperCase() : null;
  const targetIsoRef = useRef(targetIso);
  targetIsoRef.current = targetIso;

  // World-atlas country features, parsed once per map load. Shared by the flat
  // and globe fly-to targets.
  const worldCountryFeatures = useMemo(() => {
    if (!mapData) return [] as any[];
    return (feature(mapData as any, mapData.objects.countries as any) as any).features as any[];
  }, [mapData]);

  // The single place that answers "where should the flat map be framed right
  // now?". `key` identifies the destination; the fly-to effect animates only
  // when it changes, so data loading in stages never restarts a flight.
  const flatViewTarget = useMemo<{ key: string; transform: d3.ZoomTransform; isSub: boolean } | null>(() => {
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

    if (activeCountry?.isoCode && frameRegionCode && subMapData) {
      const f = subFeatures.find((x: any) => codeByFeatureId[String(x.id)] === frameRegionCode);
      if (f) {
        // A level-2 unit is framed on its parent region — bias to the parent's
        // extent, not the child's own (unavailable) capital.
        const cap = activeSubdivision?.level === 2 ? null : activeSubdivision?.capitalCoordinates;
        return {
          // `:cap`/`:approx` suffix: re-frame once the record loads and the
          // centre snaps from the feature to the capital (matches the globe key).
          key: `region:${activeCountry.isoCode}:${frameRegionCode}:${cap ? 'cap' : 'approx'}`,
          isSub: true,
          transform: fitFeatureFlat(
            f, flatProjection, WORLD_WIDTH, targetWidth, height,
            SUBDIVISION_MAX_ZOOM,
            cap ? [cap.lng, cap.lat] : null,
          ),
        };
      }
    }

    // The URL points at a subdivision but its geometry isn't ready yet: hold
    // (return null) rather than dropping back to the whole-country frame — a
    // region -> region navigation remounts <Map>, so that fallback would make
    // the map visibly zoom out to the country before flying into the new
    // subdivision. Once `subMapData` settles to `null` (the country has no
    // subdivision geometry) we do fall through to the country frame.
    if (regionSlug) {
      const subLoading =
        subMapData === undefined ||
        (!!subMapData && (subFeatures.length === 0 || Object.keys(codeByFeatureId).length === 0));
      if (subLoading) return null;
    }

    // The country frame — also the fallback while a focused region's geometry is
    // still loading. Keys off the URL-derived iso so the first render already
    // heads for the country instead of the world.
    const countryIso = activeCountry?.isoCode || (targetIso ? targetIso.toUpperCase() : null);
    if (countryIso) {
      const numericId = ALPHA2_TO_NUMERIC[countryIso.toUpperCase()];
      const f = worldCountryFeatures.find((x: any) => String(x.id).padStart(3, '0') === numericId);
      if (f) {
        return {
          // `isSubMap` is in the key: when the country's sub-map geometry
          // finishes loading the frame is recomputed without the world-wrap.
          key: `country:${countryIso}:${isSubMap ? 'sub' : 'world'}`,
          isSub: isSubMap,
          transform: fitFeatureFlat(f, flatProjection, WORLD_WIDTH, targetWidth, height, COUNTRY_MAX_ZOOM),
        };
      }
    }

    if (selectedContinent) {
      return { key: `continent:${selectedContinent}`, isSub: false, transform: positionTransform() };
    }

    return { key: 'world', isSub: false, transform: positionTransform() };
  }, [activeCountry, activeRegion, activeSubdivision, frameRegionCode, isSubMap, subMapData, subFeatures, codeByFeatureId, worldCountryFeatures, ALPHA2_TO_NUMERIC, flatProjection, selectedContinent, position, targetIso, regionSlug]);

  // Same idea for the globe: a target point + zoom scale, keyed so the rotation
  // animation runs once per destination.
  const globeViewTarget = useMemo<{ key: string; point: [number, number]; scale: number }>(() => {
    if (activeCountry?.isoCode && frameRegionCode && subMapData) {
      const f = subFeatures.find((x: any) => codeByFeatureId[String(x.id)] === frameRegionCode);
      if (f) {
        const cap = activeSubdivision?.level === 2 ? null : activeSubdivision?.capitalCoordinates;
        const centre: [number, number] = cap ? [cap.lng, cap.lat] : mainlandCentroid(f);
        return {
          key: `region:${activeCountry.isoCode}:${frameRegionCode}:${cap ? 'cap' : 'approx'}`,
          // A first-level subdivision is small — let the globe push in closer
          // than the country-level 3.6× cap so it isn't a dot on a big sphere.
          ...fitFeatureGlobe(f, centre, height, GLOBE_SCALE_DEFAULT, 6),
        };
      }
    }
    // URL points at a subdivision whose geometry isn't ready: hold the current
    // pose (see the flat-map note above) instead of zooming out to the country.
    if (regionSlug) {
      const subLoading =
        subMapData === undefined ||
        (!!subMapData && (subFeatures.length === 0 || Object.keys(codeByFeatureId).length === 0));
      if (subLoading) return { key: 'pending', point: [0, 0], scale: GLOBE_SCALE_DEFAULT };
    }
    // Key off the URL-derived iso (`targetIso`), not the loaded record, so the
    // globe heads for the country from the first render instead of drifting to
    // `world` while the record + world-atlas feature load. Centre on the capital
    // once known (populated heart faces the viewer), else the feature centroid;
    // zoom from the record's areaKm2 once known, else the feature's area.
    if (targetIso) {
      const iso = targetIso.toUpperCase();
      const loaded = activeCountry?.isoCode?.toUpperCase() === iso ? activeCountry : null;
      const f = worldCountryFeatures.find((x: any) => String(x.id).padStart(3, '0') === ALPHA2_TO_NUMERIC[iso]);
      const cap = loaded?.capitalCoordinates;
      const centre: [number, number] | null = cap
        ? [cap.lng, cap.lat]
        : f
          ? mainlandCentroid(f)
          : null;
      if (centre) {
        return {
          key: `country:${iso}:${cap ? 'cap' : 'approx'}`,
          ...(loaded?.areaKm2
            ? fitAreaGlobe(loaded.areaKm2, centre, height, GLOBE_SCALE_DEFAULT, 'km2', 4.5)
            : f
              ? fitFeatureGlobe(f, centre, height, GLOBE_SCALE_DEFAULT, 4.5)
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
  }, [activeCountry, activeRegion, activeSubdivision, frameRegionCode, subMapData, subFeatures, codeByFeatureId, worldCountryFeatures, ALPHA2_TO_NUMERIC, selectedContinent, targetIso, regionSlug]);

  useEffect(() => {
    async function initView() {
      if (slugParts.length === 0) {
        resetMap();
        setActiveCountry(null);
        setActiveRegion(null);
        setActiveSubdivision(null);
        setSubdivisionsForCountry([]);
        setRelatedSubdivisions([]);
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
        setRelatedSubdivisions([]);
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
            setRelatedSubdivisions([]);
            return;
          }
        }

        const sub = regionCode ? await getSubdivisionByCodeAction(regionCode) : null;
        setActiveSubdivision(sub);
        // A level-1 subdivision shows its own second-level children; a level-2
        // one shows its siblings (the other children of the same parent).
        if (sub?.level === 2 && sub.parentCode) {
          setRelatedSubdivisions(await listChildSubdivisionsAction(sub.parentCode));
        } else if (sub?.level === 1) {
          setRelatedSubdivisions(await listChildSubdivisionsAction(sub.code));
        } else {
          setRelatedSubdivisions([]);
        }
      } else {
        // Fallback for unknown slugs
        resetMap();
        setActiveCountry(null);
        setActiveRegion(null);
        setActiveSubdivision(null);
        setSubdivisionsForCountry([]);
        setRelatedSubdivisions([]);
        setActiveContinent(null);
      }
    }
    initView();
  }, [slug, handleContinentClick, resetMap, activeCountry?.isoCode]);

  // Switching projection resets the fly-to bookkeeping so the newly shown view
  // re-frames itself (the hidden view can't animate anyway).
  useEffect(() => {
    lastFlatKeyRef.current = null;
    lastGlobeTargetRef.current = null;
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
      .scaleExtent([1, FLAT_MAX_ZOOM])
      .translateExtent([[-Infinity, flatYExtent[0]], [Infinity, flatYExtent[1]]])
      .touchable(true)
      .interpolate(linearZoomInterpolator)
      .on('start', () => {
        svg.attr('shape-rendering', 'optimizeSpeed');
      })
      .on('zoom', (event) => {
        g.attr('transform', wrapTransform(event.transform, !!event.sourceEvent).toString());
      })
      .on('end', (event) => {
        svg.attr('shape-rendering', 'geometricPrecision');
        if (event.transform) {
          setFlatZoom(event.transform.k);
          // Remember where the user left a country / subdivision view so a
          // navigation that remounts <Map> can re-seed from here.
          const key = lastFlatKeyRef.current;
          if (event.sourceEvent && key && keyCountryIso(key)) {
            const { x, y, k } = event.transform;
            useMapStore.getState().setFlatFocus({ key, k, x, y });
          }
        }
      });

    zoomRef.current = zoom;
    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    if (!isInitialized) {
      const focus = useMapStore.getState().flatFocus;
      const wantIso = targetIsoRef.current ? targetIsoRef.current.toUpperCase() : null;
      if (focus && wantIso && keyCountryIso(focus.key) === wantIso) {
        // Re-entering the same country after a remount (region -> region, or
        // country -> region): start from the frame we left so the fly-to glides
        // from there instead of the map first snapping to a whole-country view.
        svg.call(zoom.transform, d3.zoomIdentity.translate(focus.x, focus.y).scale(focus.k));
      } else {
        const [lng, lat] = positionRef.current.coordinates;
        const [x, y] = flatProjection([lng, lat]) || [width / 2, height / 2];
        const base = d3.zoomIdentity.translate(width / 2, height / 2).scale(positionRef.current.zoom).translate(-x, -y);
        // Fold onto the centre world copy so the −1/+1 copies backfill both edges;
        // rebasing toward screen-centre here could shift past the last copy and
        // leave a gap at the viewport edge before the first pan.
        const seedX = wrapTranslateX(base.x, base.k, WORLD_WIDTH);
        svg.call(zoom.transform, d3.zoomIdentity.translate(seedX, base.y).scale(base.k));
      }
    } else {
      // Returning from the globe: the globe effect cleared the <g> transform —
      // restore it from d3-zoom's stored value so the map doesn't flash unzoomed.
      g.attr('transform', (svg.property('__zoom') as d3.ZoomTransform).toString());
    }
    setFlatZoom((svg.property('__zoom') as d3.ZoomTransform | undefined)?.k ?? 1);

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
    const prevKey = lastFlatKeyRef.current;
    const isFirst = prevKey === null;
    // `country:<iso>:world` → `country:<iso>:sub` (same country, sub-map geometry
    // just loaded) is the same framing minus the world-wrap — snap, don't slide.
    const sameCountry =
      !!prevKey &&
      prevKey.startsWith('country:') &&
      flatViewTarget.key.startsWith('country:') &&
      prevKey.split(':')[1] === flatViewTarget.key.split(':')[1];
    // Same subdivision, centre just refined feature → capital (`:approx` → `:cap`):
    // a tiny nudge, snap it.
    const sameRegion =
      !!prevKey &&
      prevKey.startsWith('region:') &&
      flatViewTarget.key.startsWith('region:') &&
      prevKey.split(':').slice(0, 3).join(':') === flatViewTarget.key.split(':').slice(0, 3).join(':');
    // After a remount we seeded d3-zoom from the persisted frame of this same
    // country — glide from it rather than snapping straight to the destination.
    const focus = useMapStore.getState().flatFocus;
    const seededFromFocus =
      isFirst && !!focus && keyCountryIso(focus.key) === keyCountryIso(flatViewTarget.key);
    lastFlatKeyRef.current = flatViewTarget.key;

    const svg = d3.select(svgRef.current);
    const node = svgRef.current as unknown as { __zoom?: d3.ZoomTransform };
    const t = flatViewTarget.transform;
    // On the repeating world map, take the shortest horizontal path: aim for the
    // world copy nearest the current pan position rather than the centre one. A
    // sub-map is drawn once, so its translation is used as-is.
    const refX = node.__zoom ? node.__zoom.x : width / 2;
    const tx = flatViewTarget.isSub ? t.x : rebaseTranslateX(t.x, refX, t.k, WORLD_WIDTH);
    const target = d3.zoomIdentity.translate(tx, t.y).scale(t.k);

    // Size the capital marker for the destination up front, so it doesn't
    // balloon through a zoom-in and snap back at the end.
    setFlatZoom(target.k);

    const record = () =>
      useMapStore.getState().setFlatFocus(
        keyCountryIso(flatViewTarget.key)
          ? { key: flatViewTarget.key, k: target.k, x: target.x, y: target.y }
          : null,
      );

    if ((isFirst && !seededFromFocus) || sameCountry) {
      svg.interrupt();
      svg.call(zoom.transform, target);
      record();
    } else {
      // `sameRegion` is the small centre → capital correction: a quick retarget
      // (d3 picks it up from the in-flight glide's current position, no snap).
      svg.transition().duration(sameRegion ? 300 : 750).ease(d3.easeCubicInOut).call(zoom.transform, target).on('end', record);
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
      .on('start', () => {
        // User grabbed the globe — abandon any in-flight fly-to.
        if (globeFlyRafRef.current != null) {
          cancelAnimationFrame(globeFlyRafRef.current);
          globeFlyRafRef.current = null;
        }
        svg.attr('shape-rendering', 'optimizeSpeed');
      })
      .on('drag', (event) => {
        const sens = 0.22 * (GLOBE_SCALE_DEFAULT / globeScaleRef.current);
        const [l, p] = rotationRef.current;
        rotationRef.current = [l + event.dx * sens, Math.max(-90, Math.min(90, p - event.dy * sens))];
        schedule();
      })
      .on('end', () => svg.attr('shape-rendering', 'geometricPrecision'));

    svg.call(drag);

    let wheelIdle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (globeFlyRafRef.current != null) {
        cancelAnimationFrame(globeFlyRafRef.current);
        globeFlyRafRef.current = null;
      }
      svg.attr('shape-rendering', 'optimizeSpeed');
      if (wheelIdle) clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => svg.attr('shape-rendering', 'geometricPrecision'), 200);
      const next = globeScaleRef.current * Math.pow(1.0016, -event.deltaY);
      const clamped = Math.max(GLOBE_SCALE_RANGE[0], Math.min(GLOBE_SCALE_RANGE[1], next));
      globeScaleRef.current = clamped;
      setGlobeScale(clamped);
    };
    node.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      svg.on('.drag', null);
      node.removeEventListener('wheel', onWheel);
      if (wheelIdle) clearTimeout(wheelIdle);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [isGlobe, mounted, _hasHydrated, status]);

  // --- GLOBE: rotate / zoom toward the current target ---
  // Re-run only when the destination *meaningfully* moves: a new key, or the
  // same key drifting past a threshold (a country's centre/zoom refines from
  // feature-centroid + feature-area to capital + record areaKm2 once the record
  // loads — a small, wanted adjustment). Sub-threshold churn from `globeViewTarget`
  // being rebuilt on unrelated re-renders is ignored, so an in-flight fly-to
  // isn't cancelled and left snapped.
  const globeTargetKey = globeViewTarget.key;
  const [globeTargetLng, globeTargetLat] = globeViewTarget.point;
  const globeTargetScale = globeViewTarget.scale;
  useEffect(() => {
    if (!isGlobe) {
      if (globeFlyRafRef.current != null) {
        cancelAnimationFrame(globeFlyRafRef.current);
        globeFlyRafRef.current = null;
      }
      return;
    }
    // Subdivision geometry still loading — leave the pose (persisted across the
    // remount) untouched so we glide straight into the new region, not out to
    // the country and back.
    if (globeTargetKey === 'pending') return;
    const prev = lastGlobeTargetRef.current;
    // Same destination, only sub-threshold drift (centroid → capital as the
    // record loads): leave any in-flight fly-to running — don't cancel it.
    if (
      prev && prev.key === globeTargetKey &&
      Math.abs(prev.lng - globeTargetLng) < 1 &&
      Math.abs(prev.lat - globeTargetLat) < 1 &&
      Math.abs(prev.scale - globeTargetScale) < 5
    ) return;
    lastGlobeTargetRef.current = { key: globeTargetKey, lng: globeTargetLng, lat: globeTargetLat, scale: globeTargetScale };

    const [sl, sp] = rotationRef.current;
    const [tl, tp] = orientationFor([globeTargetLng, globeTargetLat]);
    const dl = ((tl - sl) % 360 + 540) % 360 - 180;
    const dp = tp - sp;
    const sScale = globeScaleRef.current;
    const dScale = globeTargetScale - sScale;
    if (Math.abs(dl) < 0.5 && Math.abs(dp) < 0.5 && Math.abs(dScale) < 1) return;

    // A real move: retarget from the globe's current pose, replacing any
    // in-flight fly-to. The raf handle lives in a ref (not effect-cleanup) so a
    // harmless re-render can't cancel the animation and strand it mid-flight.
    if (globeFlyRafRef.current != null) cancelAnimationFrame(globeFlyRafRef.current);
    svgRef.current?.setAttribute('shape-rendering', 'optimizeSpeed');
    const start = performance.now();
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / 750);
      const e = d3.easeCubicInOut(u);
      rotationRef.current = [sl + dl * e, sp + dp * e];
      globeScaleRef.current = sScale + dScale * e;
      setRotation([rotationRef.current[0], rotationRef.current[1]]);
      setGlobeScale(globeScaleRef.current);
      if (u < 1) {
        globeFlyRafRef.current = requestAnimationFrame(step);
      } else {
        globeFlyRafRef.current = null;
        svgRef.current?.setAttribute('shape-rendering', 'geometricPrecision');
      }
    };
    globeFlyRafRef.current = requestAnimationFrame(step);
  }, [isGlobe, globeTargetKey, globeTargetLng, globeTargetLat, globeTargetScale]);

  useEffect(() => () => {
    if (globeFlyRafRef.current != null) cancelAnimationFrame(globeFlyRafRef.current);
  }, []);

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
                  onClick={() => switchView('flat')}
                  aria-label={t('flatView')}
                  aria-pressed={!isGlobe}
                  className={`rounded-full p-2 transition-all ${!isGlobe ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
                >
                  <MapIcon size={18} />
                </button>
              </SimpleTooltip>
              <SimpleTooltip label={t('globeView')} side="right">
                <button
                  onClick={() => switchView('globe')}
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
            style={{
              opacity: viewSwitching ? 0 : 1,
              transform: viewSwitching ? 'scale(0.97)' : 'scale(1)',
              transition: 'opacity 220ms ease-out, transform 220ms ease-out',
            }}
            className={`h-full w-full outline-none cursor-grab active:cursor-grabbing touch-none ${viewSwitching ? 'pointer-events-none' : ''}`}
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
                  activeRegionCode={frameRegionCode}
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
                // The marker lives inside the zoomed <g>, so on the flat map it
                // would grow with the zoom scale (up to ~300× on a subdivision).
                // Counter-scale by the live zoom so it stays a constant size; the
                // globe re-projects instead of transforming, so no counter-scale.
                const inv = isGlobe ? 1 : 1 / Math.max(1, flatZoom);
                return (
                  <g transform={`translate(${projected[0]} ${projected[1]}) scale(${inv})`}>
                    <circle r={3.5} fill="var(--primary)" stroke="white" strokeWidth={1} />
                    <text
                      x={7}
                      y={3.5}
                      fontSize={11}
                      paintOrder="stroke"
                      stroke="var(--background)"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      className="font-game-mono fill-[var(--foreground)]"
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
              childSubdivisions={activeSubdivision?.level === 1 ? relatedSubdivisions : []}
              parentSubdivision={parentSubdivision}
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
