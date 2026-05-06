'use client';

import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { useGameStore, StateFeature } from '@/store/useGameStore';

interface GameMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
  projection: d3.GeoProjection;
  objectName: string;
  validNames: string[];
  width?: number;
  height?: number;
}

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

  const states = useMemo(() => {
    if (!mapData || !mapData.objects[objectName]) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geo = feature(mapData, mapData.objects[objectName]) as any;
    return (geo.features as StateFeature[]).filter(s => 
      validNames.some(name => s.properties.name.toLowerCase() === name.toLowerCase())
    );
  }, [mapData, objectName, validNames]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-h-[600px] outline-none"
      >
        <g>
          {states.map((state) => {
            const isHighlighted = highlightedStateId === state.id;
            const isCorrect = correctlyGuessedIds.includes(state.id);
            const pathData = pathGenerator(state as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            let fillColor = "var(--color-map-fill)";
            if (isHighlighted) fillColor = "var(--color-danger)";
            else if (isCorrect) fillColor = "#10b981"; // emerald-500

            return (
              <path
                key={state.id}
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
