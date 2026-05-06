'use client';

import React, { useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';
import { useGameStore, StateFeature } from '@/store/useGameStore';

interface USMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
}

const FIFTY_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

export default function USMap({ mapData, highlightedStateId }: USMapProps) {
  const { correctlyGuessedIds } = useGameStore();
  const width = 960;
  const height = 600;

  const projection = d3.geoAlbersUsa()
    .scale(1200)
    .translate([width / 2, height / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  const states = useMemo(() => {
    if (!mapData) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const us = feature(mapData, mapData.objects.states) as any;
    return (us.features as StateFeature[]).filter(s => FIFTY_STATES.includes(s.properties.name));
  }, [mapData]);

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

