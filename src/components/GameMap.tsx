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

// ... (keep normalizeString)

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
    // Data is pre-normalized to have a "regions" object
    if (!mapData || !mapData.objects.regions) return [];
    const geo = feature(mapData, mapData.objects.regions) as FeatureCollection;
    return geo.features as Feature[];
  }, [mapData]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full max-h-[600px] w-full outline-none"
      >
        <g>
          {allFeatures.map((feat: Feature, i: number) => {
            const stateId = String(feat.id);
            const stateName = (feat.properties as { name: string }).name;
              
            // Logic to determine if this feature is one of the target regions
            const isQuizRegion = validNames.some(vn => 
              normalizeString(vn) === normalizeString(stateName)
            );

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            // COLOR LOGIC:
            // If it's a quiz region, use --map-fill. 
            // If it's not (like a neighboring country border), make it very light/transparent.
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
