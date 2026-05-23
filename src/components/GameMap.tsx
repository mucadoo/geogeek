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
  gameMode?: 'name' | 'capital' | 'flag';
  capitalMap?: Record<string, string>;
  capitalCoordinates?: Record<string, [number, number]>;
  onRegionClick?: (id: string, name: string) => void;
}

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

export default function GameMap({ 
  mapData, highlightedStateId, projection, validNames,
  width = 960, height = 600,
  showOnlyValid = false, gameMode = 'name', capitalMap = {}, capitalCoordinates = {},
  onRegionClick
}: GameMapProps) {
  const { correctlyGuessedIds, lastGuessCorrect, lastSkippedState } = useGameStore();
  const pathGenerator = d3.geoPath().projection(projection);

  const allFeatures = useMemo(() => {
    if (!mapData) return [];
    const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
    if (!mapData.objects[objectKey]) return [];
    const geo = feature(mapData, mapData.objects[objectKey]) as FeatureCollection;
    return geo.features as Feature[];
  }, [mapData]);

  // Compute smooth zoom focus transformation style
  const focusTransformStyle = useMemo(() => {
    if (!highlightedStateId || !allFeatures.length) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const activeFeature = allFeatures.find((f) => String(f.id) === highlightedStateId);
    if (!activeFeature) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const bounds = pathGenerator.bounds(activeFeature as any);
    if (!bounds || isNaN(bounds[0][0])) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    // Constrain the scale to comfortable bounds (e.g., zoom factor between 1x and 4x)
    const scale = Math.max(1, Math.min(4, 0.55 / Math.max(dx / width, dy / height)));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    return {
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
      transformOrigin: '0px 0px',
    };
  }, [highlightedStateId, allFeatures, pathGenerator, width, height]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full max-h-[600px] w-full outline-none bg-[var(--ocean-bg)] overflow-hidden rounded-2xl">
        <defs>
          <pattern id="ocean-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className="fill-black dark:fill-white opacity-10" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#ocean-dots)" />
        
        <text x="50%" y="50%" textAnchor="middle" className="font-mono text-8xl font-black uppercase fill-[var(--map-stroke)] select-none pointer-events-none opacity-10">
          Oceania
        </text>

        {/* Dynamic Zooming Group Wrapper */}
        <g style={focusTransformStyle} className="will-change-transform">
          {allFeatures.map((feat: Feature, i: number) => {
            const stateId = String(feat.id);
            const stateName = (feat.properties as { name: string }).name || "";
            const isQuizRegion = validNames.some(vn => normalizeString(vn) === normalizeString(stateName));

            if (showOnlyValid && !isQuizRegion) return null;

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            let fillColor = "var(--map-fill)"; 
            if (isCorrect) fillColor = "var(--color-primary)"; 
            if (isHighlighted && gameMode !== 'capital') fillColor = "var(--color-danger)";

            const isIncorrect = lastGuessCorrect === false && isHighlighted;
            const isSkipped = lastSkippedState?.id === stateId;
            const animationClass = isIncorrect ? 'animate-flash' : (isSkipped ? 'animate-pulse-yellow' : '');

            return (
              <path 
                key={stateId || i} 
                d={pathData} 
                fill={fillColor} 
                stroke="var(--map-stroke)" 
                strokeWidth={0.5} 
                vectorEffect="non-scaling-stroke"
                className={`transition-colors duration-300 ${animationClass} ${onRegionClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRegionClick?.(stateId, stateName)}
              />
            );
          })}

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
                    <circle cx={coords[0]} cy={coords[1]} r={6} fill="var(--color-danger)" stroke="white" strokeWidth={3} className="drop-shadow-lg" />
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
