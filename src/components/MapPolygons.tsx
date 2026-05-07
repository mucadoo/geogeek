'use client';

import * as d3 from 'd3';
import { useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import React, { useMemo } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { NUMERIC_TO_CONTINENT, NUMERIC_TO_ALPHA2, CONTINENT_VIEWS } from '@/config/mapConstants';
import { useMapStore } from '@/store/useMapStore';

interface CountryFeature {
  id: string | number;
  properties: {
    name: string;
  };
  type: "Feature";
  geometry: d3.GeoGeometryObjects;
}

interface MapPolygonsProps {
  mapData: Topology;
  projection: d3.GeoProjection;
}

export default function MapPolygons({ mapData, projection }: MapPolygonsProps) {
  const router = useRouter();
  const { 
    selectedContinent, hoveredContinent, hoveredCountry, 
    tooltip, setTooltip,
    setHoveredContinent, setHoveredCountry,
    handleContinentClick
  } = useMapStore();

  const pathGenerator = d3.geoPath().projection(projection);

  const geographies = useMemo(() => {
    if (!mapData) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countries = feature(mapData, mapData.objects.countries) as any;
    return countries.features as d3.GeoPermissibleObjects[];
  }, [mapData]);

  return (
    <g className="map-geographies">
      {(geographies as unknown as CountryFeature[]).map((geo, index) => {
        const numericId = geo.id ? String(geo.id).padStart(3, '0') : `geo-${index}`;
        const continent = NUMERIC_TO_CONTINENT[numericId] || 'Other';
        const alpha2 = NUMERIC_TO_ALPHA2[numericId];
        const countryName = geo.properties?.name || "Unknown";
        
        const isClickable = continent !== 'Other';

        if (selectedContinent && continent !== selectedContinent) return null;

        const isHovered = selectedContinent
          ? hoveredCountry === numericId
          : hoveredContinent === continent;

        let fillColor = "var(--color-map-fill)"; 
        if (isHovered && isClickable) fillColor = "var(--color-danger)";

        const pathData = pathGenerator(geo);
        if (!pathData) return null;

        return (
          <path
            key={numericId}
            d={pathData}
            fill={fillColor}
            stroke="var(--color-map-stroke)"
            strokeWidth={0.5}
            className={`transition-colors duration-200 outline-none ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
            onMouseEnter={(e) => {
              if (!isClickable) return;
              if (selectedContinent) {
                setHoveredCountry(numericId);
                setTooltip({ show: true, content: countryName, x: e.clientX, y: e.clientY });
              } else {
                setHoveredContinent(continent);
                setTooltip({ show: true, content: continent, x: e.clientX, y: e.clientY });
              }
            }}
            onMouseLeave={() => {
              if (selectedContinent) setHoveredCountry(null);
              else setHoveredContinent(null);
              setTooltip({ ...tooltip, show: false });
            }}
            onClick={(e: React.MouseEvent) => {
              if (!isClickable) return;
              
              if (selectedContinent) {
                if (alpha2) {
                  NProgress.start();
                  router.push(`/country/${alpha2}`);
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
