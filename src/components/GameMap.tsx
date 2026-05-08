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
  showOnlyValid?: boolean;
  gameMode?: 'name' | 'capital';
  capitalMap?: Record<string, string>;
  capitalCoordinates?: Record<string, [number, number]>;
}

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function GameMap({ 
  mapData, highlightedStateId, projection, validNames,
  width = 960, height = 600,
  showOnlyValid = false, gameMode = 'name', capitalMap = {}, capitalCoordinates = {}
}: GameMapProps) {
  const { correctlyGuessedIds, lastGuessCorrect, lastSkippedState } = useGameStore();
  const pathGenerator = d3.geoPath().projection(projection);

  const allFeatures = useMemo(() => {
    if (!mapData) return[];
    const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
    if (!mapData.objects[objectKey]) return[];
    const geo = feature(mapData, mapData.objects[objectKey]) as FeatureCollection;
    return geo.features as Feature[];
  }, [mapData]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full max-h-[600px] w-full outline-none">
        <style>{`
          @keyframes flash {
            0%, 100% { fill: var(--color-danger); }
            50% { fill: #ef4444; }
          }
          @keyframes pulse-yellow {
            0%, 100% { fill: var(--color-map-fill); }
            50% { fill: #facc15; }
          }
          .animate-flash { animation: flash 0.5s ease-in-out 3; }
          .animate-pulse-yellow { animation: pulse-yellow 0.5s ease-in-out 3; }
        `}</style>
        <g>
          {allFeatures.map((feat: Feature, i: number) => {
            const stateId = String(feat.id);
            const stateName = (feat.properties as { name: string }).name || "";
            const isQuizRegion = validNames.some(vn => normalizeString(vn) === normalizeString(stateName));

            if (showOnlyValid && !isQuizRegion) return null;

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            let fillColor = "#f3f4f6"; 
            if (isQuizRegion) fillColor = "var(--color-map-fill)"; 
            if (isCorrect) fillColor = "#10b981"; 
            if (isHighlighted && gameMode !== 'capital') fillColor = "var(--color-danger)";

            const isIncorrect = lastGuessCorrect === false && isHighlighted;
            const isSkipped = lastSkippedState?.id === stateId;
            const animationClass = isIncorrect ? 'animate-flash' : (isSkipped ? 'animate-pulse-yellow' : '');

            return (
              <path 
                key={stateId || i} 
                d={pathData} 
                fill={fillColor} 
                stroke="var(--color-map-stroke)" 
                strokeWidth={0.75} 
                className={`transition-colors duration-300 ${animationClass}`}
              />
            );
          })}
        </g>
        {gameMode === 'capital' && highlightedStateId && (
          <g>
            {allFeatures.map((feat: Feature) => {
              const stateId = String(feat.id);
              if (stateId !== highlightedStateId) return null;

              const stateName = (feat.properties as { name: string }).name || "";
              const capitalName = capitalMap[stateName];
              let coords: [number, number] | null = null;
              
              if (capitalName && capitalCoordinates[capitalName] && typeof projection === 'function') {
                const rawCoords = capitalCoordinates[capitalName];
                const projected = projection(rawCoords);
                if (projected) coords = projected as [number, number];
              }

              if (!coords) {
                coords = pathGenerator.centroid(feat as unknown as d3.GeoPermissibleObjects) as [number, number];
              }

              if (!coords || isNaN(coords[0])) return null;

              return (
                <g key={`pin-${stateId}`}>
                  <circle cx={coords[0]} cy={coords[1]} r={14} fill="none" stroke="var(--color-danger)" strokeWidth={2} className="animate-ping" style={{ transformOrigin: `${coords[0]}px ${coords[1]}px` }} />
                  <circle cx={coords[0]} cy={coords[1]} r={6} fill="var(--color-danger)" stroke="white" strokeWidth={2} />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
