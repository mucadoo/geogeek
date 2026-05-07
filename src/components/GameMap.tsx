'use client';

import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { Feature, FeatureCollection } from 'geojson';
import { useGameStore } from '@/store/useGameStore';

interface GameMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
  projection: d3.GeoProjection | d3.GeoIdentityTransform;
  objectName: string;
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
  objectName, 
  validNames,
  width = 960,
  height = 600
}: GameMapProps) {
  const { correctlyGuessedIds } = useGameStore();

  const pathGenerator = d3.geoPath().projection(projection);

  // 1. Get ALL features for the background
  const allFeatures = useMemo(() => {
    if (!mapData || !mapData.objects[objectName]) return [];
    const geo = feature(mapData, mapData.objects[objectName]) as FeatureCollection;
    return geo.features as Feature[];
  }, [mapData, objectName]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-h-[600px] outline-none"
      >
        <g>
          {allFeatures.map((feat: Feature, i: number) => {
            // Highcharts can store names in several different property keys
            const properties = feat.properties as Record<string, string> || {};
            const rawName = 
              properties.name || 
              properties.Name || 
              properties.NAME || 
              properties['woe-name'] || 
              "";
              
            const stateId = feat.id ? String(feat.id) : rawName;
            
            // Logic to determine if this feature is one of the target regions
            const isQuizRegion = validNames.some(vn => 
              normalizeString(vn) === normalizeString(rawName)
            );

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            // COLOR LOGIC:
            // We want all of Italy to be the same color at the start.
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
