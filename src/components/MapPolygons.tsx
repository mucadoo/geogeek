'use client';

import * as d3 from 'd3';
import { useLocale } from 'next-intl';
import NProgress from 'nprogress';
import React, { useMemo } from 'react';
import { feature, merge } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { NUMERIC_TO_CONTINENT, NUMERIC_TO_ALPHA2, CONTINENT_VIEWS } from '@/config/mapConstants';
import { useContinentsGeometry } from '@/hooks/useContinentsGeometry';
import { useRouter } from '@/i18n/routing';
import { getLocalizedValue } from '@/lib/i18n-utils';
import { resolveSubdivisionCode } from '@/lib/subdivisionMatch';
import { useGameStore } from '@/store/useGameStore';
import { useMapStore } from '@/store/useMapStore';
import { Subdivision } from '@/types';

interface CountryFeature {
  id: string | number;
  properties: { name: string; };
  type: "Feature";
  geometry: d3.GeoGeometryObjects;
}

const SEAM_CLIP_ID = 'map-antimeridian-clip';

// A shape's fill + border. On the repeating flat map (`split`) the fill and
// stroke are two separate <path>s sharing the same `d`: d3 closes any polygon
// that crosses the antimeridian (Russia's Chukotka, Fiji…) with a synthetic
// edge running down the ±180° meridian, and with the geography drawn 3x that
// edge lands mid-view as a vertical scar. The fill (needed whole, so the
// repeated copies still meet with no gap) keeps it; the stroke is clipped to
// skip a hairline band at each projected antimeridian, which is open ocean
// everywhere except those few seams.
function GeoShape({
  pathData, fill, strokeWidth, split, className, strokeClassName, role, tabIndex,
  ariaLabel, onMouseEnter, onMouseLeave, onClick,
}: {
  pathData: string;
  fill: string;
  strokeWidth: number;
  split: boolean;
  className: string;
  strokeClassName?: string;
  role?: string;
  tabIndex?: number;
  ariaLabel?: string;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  const fillPath = (
    <path
      d={pathData}
      fill={fill}
      stroke={split ? 'none' : 'var(--map-stroke)'}
      strokeWidth={split ? undefined : strokeWidth}
      vectorEffect="non-scaling-stroke"
      className={className}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    />
  );
  if (!split) return fillPath;
  return (
    <>
      {fillPath}
      <path
        d={pathData}
        fill="none"
        stroke="var(--map-stroke)"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        clipPath={`url(#${SEAM_CLIP_ID})`}
        className={`pointer-events-none ${strokeClassName ?? 'transition-[stroke-width] duration-700'}`}
      />
    </>
  );
}

interface MapPolygonsProps {
  mapData: Topology;
  projection: d3.GeoProjection;
  activeCountryIso?: string;
  isSubMap?: boolean;
  subdivisions?: Subdivision[];
  activeRegionCode?: string | null;
  /** Flat-map only: draw the geography layer three times so it wraps east–west. */
  repeat?: boolean;
  worldWidth?: number;
}

export default function MapPolygons({ mapData, projection, activeCountryIso, isSubMap = false, subdivisions = [], activeRegionCode = null, repeat = false, worldWidth = 0 }: MapPolygonsProps) {
  const router = useRouter();
  const locale = useLocale();
  const subByCode = useMemo(
    () => Object.fromEntries(subdivisions.map((s) => [s.code, s])),
    [subdivisions]
  );
  const {
    selectedContinent, hoveredContinent, hoveredCountry,
    tooltip, setTooltip, exploreMode, masteryMode,
    setHoveredContinent, setHoveredCountry
  } = useMapStore();

  const { highScores } = useGameStore();
  const { data: continentsTopo } = useContinentsGeometry();

  const getMasteryColor = (alpha2: string) => {
    if (!alpha2) return "var(--map-fill)";
    const score = highScores[alpha2.toLowerCase()] || 0;
    if (score > 0) {
      return "var(--color-primary)";
    }
    return "var(--map-fill)";
  };

  const pathGenerator = d3.geoPath().projection(projection);

  // On the flat map the geography layer is drawn three times (−1, 0, +1 world
  // widths) so it repeats horizontally; countries that straddle the antimeridian
  // (USA, Russia, Fiji…) then read as continuous and panning wraps. The globe and
  // sub-maps draw a single copy.
  const isRepeating = repeat && worldWidth > 0;
  // Projected x of the two antimeridian meridians, used to clip the seam
  // artifact out of every copy's stroke layer (see GeoShape above).
  const seamL = isRepeating ? projection([-180, 0])?.[0] ?? null : null;
  const seamR = isRepeating ? projection([180, 0])?.[0] ?? null : null;
  const hasSeamClip = seamL != null && seamR != null && seamR > seamL;

  const wrapLayer = (paths: React.ReactNode) => (
    <g className="map-geographies">
      {hasSeamClip && (
        <defs>
          <clipPath id={SEAM_CLIP_ID} clipPathUnits="userSpaceOnUse">
            <rect x={seamL! + 1.5} y={-100000} width={seamR! - seamL! - 3} height={200000} />
          </clipPath>
        </defs>
      )}
      {isRepeating
        ? [-1, 0, 1].map((i) => (
            <g key={i} transform={`translate(${i * worldWidth},0)`}>
              {paths}
            </g>
          ))
        : paths}
    </g>
  );

  const geographies = useMemo(() => {
    if (!mapData) return[];
    // Dynamically find the first available object key if 'countries' is not present (common in sub-map data)
    const objectKey = mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0];
    const geoObject = (mapData.objects as any)[objectKey];
    const features = feature(mapData, geoObject) as any;
    return features.features as d3.GeoPermissibleObjects[];
  }, [mapData]);

  // ISO 3166-1 alpha-2 (upper) -> country name, harvested from the world-atlas
  // data so the continent drill-down can label its polygons.
  const countryNameByAlpha2 = useMemo(() => {
    const out: Record<string, string> = {};
    if (!mapData?.objects?.countries) return out;
    const fc = feature(mapData, mapData.objects.countries as any) as any;
    for (const f of fc.features as CountryFeature[]) {
      const alpha2 = NUMERIC_TO_ALPHA2[String(f.id).padStart(3, '0')];
      if (alpha2 && f.properties?.name) out[alpha2.toUpperCase()] = f.properties.name;
    }
    return out;
  }, [mapData]);

  // Prebuilt continent geometry (real Europe/Asia borders — Russia, Kazakhstan,
  // Turkey and Egypt split into per-continent pieces). Falls back to merging the
  // world-atlas polygons by NUMERIC_TO_CONTINENT until this loads.
  const continentTopoKey = continentsTopo ? Object.keys(continentsTopo.objects)[0] : null;

  const continentGeographies = useMemo(() => {
    // Antarctica has no wiki-geo-data continent record and isn't in the prebuilt
    // continent geometry, so its shape always comes from the world-atlas polygon.
    const antarcticaFeature = () => {
      if (!mapData?.objects?.countries) return null;
      const geoms = (mapData.objects.countries as any).geometries.filter(
        (g: any) => String(g.id).padStart(3, '0') === '010'
      );
      return geoms.length ? merge(mapData, geoms) : null;
    };

    if (continentsTopo && continentTopoKey) {
      const geometries = (continentsTopo.objects[continentTopoKey] as any).geometries as any[];
      return Object.keys(CONTINENT_VIEWS)
        .map((continentName) => ({
          continent: continentName,
          feature:
            continentName === 'Antarctica'
              ? antarcticaFeature()
              : merge(
                  continentsTopo,
                  geometries.filter((g) => g.properties?.continent === continentName)
                ),
        }))
        .filter((c) => c.feature);
    }

    if (!mapData || !mapData.objects.countries) return [];
    return Object.keys(CONTINENT_VIEWS)
      .map((continentName) => {
        const geometries = (mapData.objects.countries as any).geometries.filter((geo: any) => {
          const id = String(geo.id).padStart(3, '0');
          return NUMERIC_TO_CONTINENT[id] === continentName;
        });
        return { continent: continentName, feature: geometries.length ? merge(mapData, geometries) : null };
      })
      .filter((c) => c.feature);
  }, [continentsTopo, continentTopoKey, mapData]);

  // Per-country pieces for the continent drill-down (/map/<continent>), keyed so
  // a split country's halves stay distinct but both route to the same country.
  const continentDrillFeatures = useMemo(() => {
    if (!continentsTopo || !continentTopoKey) return [] as any[];
    const fc = feature(continentsTopo, continentsTopo.objects[continentTopoKey] as any) as any;
    return fc.features as any[];
  }, [continentsTopo, continentTopoKey]);

  const isContinentMode = exploreMode === 'continent';
  // Antarctica has no per-country drill geometry — fall through to the main
  // branch (which filters the world polygons by NUMERIC_TO_CONTINENT) so
  // /map/antarctica still shows the continent instead of a blank map.
  const hasDrillFeatures =
    !!selectedContinent &&
    continentDrillFeatures.some((g) => g.properties?.continent === selectedContinent);
  const useContinentDrill =
    isContinentMode && !!selectedContinent && !isSubMap && !activeCountryIso && hasDrillFeatures;

  if (isContinentMode && !selectedContinent && !isSubMap) {
    return wrapLayer(
      <>
        {continentGeographies.map((continentData) => {
          const continent = continentData.continent;
          const isHovered = hoveredContinent === continent;
          const fillColor = isHovered ? "var(--color-map-highlight)" : "var(--map-fill)";
          const pathData = pathGenerator(continentData.feature as any);

          if (!pathData) return null;

          return (
            <GeoShape
              key={continent}
              pathData={pathData}
              fill={fillColor}
              strokeWidth={0.5}
              split={hasSeamClip}
              className="transition-[fill,stroke-width,opacity] duration-700 outline-none cursor-pointer"
              role="button"
              tabIndex={0}
              ariaLabel={continent}
              onMouseEnter={(e) => {
                setHoveredContinent(continent);
                setTooltip({ show: true, content: continent, x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredContinent(null);
                setTooltip({ ...tooltip, show: false });
              }}
              onClick={() => {
                const continentSlug = continent.toLowerCase().replace(/\s+/g, '-');
                router.push('/map/' + continentSlug as any);
              }}
            />
          );
        })}
      </>
    );
  }

  if (useContinentDrill) {
    return wrapLayer(
      <>
        {continentDrillFeatures.map((geo, index) => {
          const alpha2 = String(geo.id || '').toUpperCase();
          const inContinent = geo.properties?.continent === selectedContinent;
          const countryName = countryNameByAlpha2[alpha2] || alpha2;

          const isHovered = hoveredCountry === alpha2;
          let fillColor = "var(--map-fill)";
          if (isHovered) fillColor = "var(--color-map-highlight)";
          else if (masteryMode && alpha2) fillColor = getMasteryColor(alpha2);

          const pathData = pathGenerator(geo);
          if (!pathData) return null;

          return (
            <GeoShape
              key={`${alpha2}-${geo.properties?.continent || index}`}
              pathData={pathData}
              fill={fillColor}
              strokeWidth={inContinent ? 0.5 : 0}
              split={hasSeamClip}
              className={`transition-[fill,stroke-width,opacity] duration-700 outline-none ${inContinent ? 'cursor-pointer opacity-100' : 'opacity-0 pointer-events-none'}`}
              onMouseEnter={(e) => {
                if (!inContinent) return;
                setHoveredCountry(alpha2);
                setTooltip({ show: true, content: countryName, x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredCountry(null);
                setTooltip({ ...tooltip, show: false });
              }}
              onClick={() => {
                if (!inContinent || !alpha2) return;
                NProgress.start();
                router.push(`/map/${alpha2.toLowerCase()}` as any);
              }}
            />
          );
        })}
      </>
    );
  }

  return wrapLayer(
    <>
      {(geographies as unknown as CountryFeature[]).map((geo, index) => {
        const rawId = geo.id ? String(geo.id) : `geo-${index}`;

        // Pad world ISOs to 3 digits, but leave sub-map regional IDs exactly as they are
        const mapId = isSubMap ? rawId : rawId.padStart(3, '0');

        const continent = NUMERIC_TO_CONTINENT[mapId] || 'Other';
        const alpha2 = NUMERIC_TO_ALPHA2[mapId];
        const countryName = geo.properties?.name || "Unknown";

        const isClickable = !activeCountryIso || isSubMap;
        let isVisible = true;
        if (!isSubMap) {
          if (isContinentMode && selectedContinent && continent !== selectedContinent) isVisible = false;
          if (activeCountryIso && alpha2?.toUpperCase() !== activeCountryIso.toUpperCase()) isVisible = false;
        }

        const isHovered = hoveredCountry === mapId;

        const subCode = isSubMap && activeCountryIso
          ? resolveSubdivisionCode(activeCountryIso, geo, subdivisions)
          : null;
        const isActiveRegion = !!subCode && subCode === activeRegionCode;

        const tooltipLabel = isSubMap
          ? (subCode && subByCode[subCode] ? getLocalizedValue(subByCode[subCode].name, locale) : subCode || 'Unknown')
          : countryName;

        let fillColor = "var(--map-fill)";
        if ((isHovered && isClickable) || isActiveRegion) fillColor = "var(--color-map-highlight)";
        else if (masteryMode && alpha2) fillColor = getMasteryColor(alpha2);

        const pathData = pathGenerator(geo);
        if (!pathData) return null;

        return (
          <GeoShape
            key={mapId}
            pathData={pathData}
            fill={fillColor}
            strokeWidth={isVisible ? 0.5 : 0}
            split={hasSeamClip}
            className={`transition-[fill,stroke-width,opacity] duration-700 outline-none ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onMouseEnter={(e) => {
              if (!isClickable) return;
              setHoveredCountry(mapId);
              setTooltip({ show: true, content: tooltipLabel, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => {
              setHoveredCountry(null);
              setTooltip({ ...tooltip, show: false });
            }}
            onClick={() => {
              if (!isClickable) return;
              if (isSubMap && activeCountryIso) {
                if (subCode) router.push(`/map/${activeCountryIso}/${subCode}` as any);
              } else if (alpha2) {
                NProgress.start();
                router.push(`/map/${alpha2.toLowerCase()}` as any);
              } else if (continent === 'Antarctica') {
                // Not a country in wiki-geo-data — route to the continent view.
                NProgress.start();
                router.push('/map/antarctica' as any);
              }
            }}
          />
        );
      })}
    </>
  );
}
