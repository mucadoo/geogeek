'use client';

import * as d3 from 'd3';
import NProgress from 'nprogress';
import React, { useMemo } from 'react';
import { feature, merge } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { NUMERIC_TO_CONTINENT, NUMERIC_TO_ALPHA2, CONTINENT_VIEWS } from '@/config/mapConstants';
import { useRouter } from '@/i18n/routing';
import { useMapStore } from '@/store/useMapStore';

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
}

export default function MapPolygons({ mapData, projection, activeCountryIso, isSubMap = false }: MapPolygonsProps) {
  const router = useRouter();
  const { 
    selectedContinent, hoveredContinent, hoveredCountry, 
    tooltip, setTooltip, exploreMode,
    setHoveredContinent, setHoveredCountry,
    handleContinentClick
  } = useMapStore();

  const pathGenerator = d3.geoPath().projection(projection);

  const geographies = useMemo(() => {
    if (!mapData) return[];
    const countries = feature(mapData, mapData.objects.countries as any) as any;
    return countries.features as d3.GeoPermissibleObjects[];
  }, [mapData]);

  const continentGeographies = useMemo(() => {
    if (!mapData) return [];
    
    return Object.keys(CONTINENT_VIEWS).map((continentName) => {
      const geometries = (mapData.objects.countries as any).geometries.filter((geo: any) => {
        const id = String(geo.id).padStart(3, '0');
        return NUMERIC_TO_CONTINENT[id] === continentName;
      });

      return {
        continent: continentName,
        feature: merge(mapData, geometries)
      };
    });
  }, [mapData]);

  return (
    <g className="map-geographies">
      {exploreMode === 'continent' && !selectedContinent && !isSubMap ? (
        continentGeographies.map((continentData) => {
          const continent = continentData.continent;
          const isHovered = hoveredContinent === continent;
          const fillColor = isHovered ? "var(--color-danger)" : "var(--map-fill)";
          const pathData = pathGenerator(continentData.feature as any);
          
          if (!pathData) return null;

          return (
            <path
              key={continent}
              d={pathData}
              fill={fillColor}
              stroke="var(--map-stroke)"
              strokeWidth={0.5}
              className="transition-all duration-700 outline-none cursor-pointer"
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
        })
      ) : (
        (geographies as unknown as CountryFeature[]).map((geo, index) => {
          const numericId = geo.id ? String(geo.id).padStart(3, '0') : `geo-${index}`;
          const continent = NUMERIC_TO_CONTINENT[numericId] || 'Other';
          const alpha2 = NUMERIC_TO_ALPHA2[numericId];
          const countryName = geo.properties?.name || "Unknown";
          
          const isContinentMode = exploreMode === 'continent';
          
          let isClickable = !activeCountryIso || isSubMap;
          let isVisible = true;
          if (!isSubMap) {
            if (isContinentMode && selectedContinent && continent !== selectedContinent) isVisible = false;
            if (activeCountryIso && alpha2?.toUpperCase() !== activeCountryIso.toUpperCase()) isVisible = false;
          }

          const isHovered = (isContinentMode && !selectedContinent) 
            ? hoveredContinent === continent 
            : hoveredCountry === numericId;

          let fillColor = "var(--map-fill)"; 
          if (isHovered && isClickable) fillColor = "var(--color-danger)";

          const pathData = pathGenerator(geo);
          if (!pathData) return null;

          return (
            <path
              key={numericId}
              d={pathData}
              fill={fillColor}
              stroke="var(--map-stroke)"
              strokeWidth={isVisible ? 0.5 : 0}
              className={`transition-all duration-700 outline-none ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onMouseEnter={(e) => {
                if (!isClickable) return;
                setHoveredCountry(numericId);
                setTooltip({ show: true, content: countryName, x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredCountry(null);
                setTooltip({ ...tooltip, show: false });
              }}
              onClick={() => {
                if (!isClickable) return;
                if (isSubMap && activeCountryIso) {
                  router.push(`/map/${activeCountryIso}/${numericId}` as any);
                } else if (alpha2) {
                  NProgress.start();
                  router.push(`/map/${alpha2.toLowerCase()}` as any);
                }
              }}
            />
          );
        })
      )}
    </g>
  );
}
