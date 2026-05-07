'use client';

import * as d3 from 'd3';
import { Feature, FeatureCollection } from 'geojson';
import React, { useMemo } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { useGameStore } from '@/store/useGameStore';

interface GameMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
  projection: d3.GeoProjection | d3.GeoIdentityTransform;
  validNames: string[];
  width?: number;
  height?: number;
}

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export default function GameMap({ 
  mapData, 
  highlightedStateId, 
  projection, 
  validNames,
  width = 960,
  height = 600
}: GameMapProps) {
  const { correctlyGuessedIds } = useGameStore();

  const pathGenerator = d3.geoPath().projection(projection);

  // 1. Get ALL features for the background
  const allFeatures = useMemo(() => {
    if (!mapData) return[];
    
    // Check for "regions" (Normalized Country maps) OR "countries" (World map)
    const objectKey = mapData.objects.regions 
      ? 'regions' 
      : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);

    if (!mapData.objects[objectKey]) return[];

    const geo = feature(mapData, mapData.objects[objectKey]) as FeatureCollection;
    return geo.features as Feature[];
  },[mapData]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full max-h-[600px] w-full outline-none"
      >
        <g>
          {allFeatures.map((feat: Feature, i: number) => {
            const stateId = String(feat.id);
            const stateName = (feat.properties as { name: string }).name || "";
              
            // Logic to determine if this feature is one of the target regions
            const isQuizRegion = validNames.some(vn => 
              normalizeString(vn) === normalizeString(stateName)
            );

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            // COLOR LOGIC:
            let fillColor = "#f3f4f6"; 
            if (isQuizRegion) fillColor = "var(--color-map-fill)"; 
            if (isCorrect) fillColor = "#10b981"; // Green
            if (isHighlighted) fillColor = "var(--color-danger)"; // Red

            return (
              <path
                key={stateId || i}
                d={pathData}
                fill={fillColor}
                stroke="var(--color-map-stroke)"
                strokeWidth={0.75}
                className="transition-colors duration-300"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
