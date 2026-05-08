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
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full max-h-[600px] w-full outline-none bg-slate-50">
        <defs>
          <pattern id="ocean-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
          </pattern>
        </defs>
        
        {/* Ocean Background with Pattern */}
        <rect width="100%" height="100%" fill="url(#ocean-dots)" />
        
        {/* Ocean Labels */}
        <text x="50%" y="50%" textAnchor="middle" className="font-mono text-8xl font-black uppercase text-slate-200 select-none pointer-events-none opacity-50">
          Atlantic Ocean
        </text>

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

            let fillColor = "#ffffff"; 
            if (isCorrect) fillColor = "#00a8b5"; 
            if (isHighlighted && gameMode !== 'capital') fillColor = "#ff5a5f";

            const isIncorrect = lastGuessCorrect === false && isHighlighted;
            const isSkipped = lastSkippedState?.id === stateId;
            const animationClass = isIncorrect ? 'animate-flash' : (isSkipped ? 'animate-pulse-yellow' : '');

            return (
              <path 
                key={stateId || i} 
                d={pathData} 
                fill={fillColor} 
                stroke="#e2e8f0" 
                strokeWidth={0.5} 
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
