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
  const wrapLayer = (paths: React.ReactNode) => (
    <g className="map-geographies">
      {repeat && worldWidth > 0
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
    if (continentsTopo && continentTopoKey) {
      const geometries = (continentsTopo.objects[continentTopoKey] as any).geometries as any[];
      return Object.keys(CONTINENT_VIEWS).map((continentName) => ({
        continent: continentName,
        feature: merge(
          continentsTopo,
          geometries.filter((g) => g.properties?.continent === continentName)
        ),
      }));
    }

    if (!mapData || !mapData.objects.countries) return [];
    return Object.keys(CONTINENT_VIEWS).map((continentName) => {
      const geometries = (mapData.objects.countries as any).geometries.filter((geo: any) => {
        const id = String(geo.id).padStart(3, '0');
        return NUMERIC_TO_CONTINENT[id] === continentName;
      });
      return { continent: continentName, feature: merge(mapData, geometries) };
    });
  }, [continentsTopo, continentTopoKey, mapData]);

  // Per-country pieces for the continent drill-down (/map/<continent>), keyed so
  // a split country's halves stay distinct but both route to the same country.
  const continentDrillFeatures = useMemo(() => {
    if (!continentsTopo || !continentTopoKey) return [] as any[];
    const fc = feature(continentsTopo, continentsTopo.objects[continentTopoKey] as any) as any;
    return fc.features as any[];
  }, [continentsTopo, continentTopoKey]);

  const isContinentMode = exploreMode === 'continent';
  const useContinentDrill =
    isContinentMode && !!selectedContinent && !isSubMap && !activeCountryIso &&
    continentDrillFeatures.length > 0;

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
            <path
              key={continent}
              d={pathData}
              fill={fillColor}
              stroke="var(--map-stroke)"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              className="transition-[fill,stroke-width,opacity] duration-700 outline-none cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={continent}
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
            <path
              key={`${alpha2}-${geo.properties?.continent || index}`}
              d={pathData}
              fill={fillColor}
              stroke="var(--map-stroke)"
              strokeWidth={inContinent ? 0.5 : 0}
              vectorEffect="non-scaling-stroke"
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
          <path
            key={mapId}
            d={pathData}
            fill={fillColor}
            stroke="var(--map-stroke)"
            strokeWidth={isVisible ? 0.5 : 0}
            vectorEffect="non-scaling-stroke"
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
              }
            }}
          />
        );
      })}
    </>
  );
}
