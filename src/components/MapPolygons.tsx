'use client';

import * as d3 from 'd3';
import NProgress from 'nprogress';
import React, { useMemo } from 'react';
import { feature } from 'topojson-client';
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
}

export default function MapPolygons({ mapData, projection, activeCountryIso }: MapPolygonsProps) {
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

  return (
    <g className="map-geographies">
      {(geographies as unknown as CountryFeature[]).map((geo, index) => {
        const numericId = geo.id ? String(geo.id).padStart(3, '0') : `geo-${index}`;
        const continent = NUMERIC_TO_CONTINENT[numericId] || 'Other';
        const alpha2 = NUMERIC_TO_ALPHA2[numericId];
        const countryName = geo.properties?.name || "Unknown";
        
        const isContinentMode = exploreMode === 'continent';
        
        // Define clickability rules based on Mode
        let isClickable = false;
        if (!activeCountryIso) {
          if (isContinentMode) {
            if (!selectedContinent) isClickable = continent !== 'Other';
            else isClickable = continent === selectedContinent;
          } else {
            isClickable = continent !== 'Other';
          }
        }

        // Define visibility rules (Fading them out instead of unmounting)
        let isVisible = true;
        if (isContinentMode && selectedContinent && continent !== selectedContinent) isVisible = false;
        if (activeCountryIso && alpha2?.toUpperCase() !== activeCountryIso.toUpperCase()) isVisible = false;

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
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={selectedContinent || !isContinentMode ? countryName : continent}
            onMouseEnter={(e) => {
              if (!isClickable) return;
              if (!isContinentMode || selectedContinent) {
                setHoveredCountry(numericId);
                setTooltip({ show: true, content: countryName, x: e.clientX, y: e.clientY });
              } else {
                setHoveredContinent(continent);
                setTooltip({ show: true, content: continent, x: e.clientX, y: e.clientY });
              }
            }}
            onMouseLeave={() => {
              setHoveredCountry(null);
              setHoveredContinent(null);
              setTooltip({ ...tooltip, show: false });
            }}
            onClick={(e: React.MouseEvent) => {
              if (!isClickable) return;
              
              if (!isContinentMode || selectedContinent) {
                if (alpha2) {
                  NProgress.start();
                  router.push(`/map/${alpha2.toLowerCase()}` as any);
                }
              } else {
                const view = CONTINENT_VIEWS[continent as keyof typeof CONTINENT_VIEWS];
                if (view) {
                  handleContinentClick(continent, view);
                  setHoveredCountry(numericId); 
                  setTooltip({ show: true, content: countryName, x: e.clientX, y: e.clientY });
                }
              }
            }}
          />
        );
      })}
    </g>
  );
}
