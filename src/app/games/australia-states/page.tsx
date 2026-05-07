'use client';

import * as d3 from 'd3';

import QuizLayout from '@/components/QuizLayout';
import { AUSTRALIA_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useAustraliaMapData } from '@/hooks/useRegionMapData';

export default function AustraliaStatesGame() {
  const { data: mapData, status: mapStatus } = useAustraliaMapData();

  // Center on Australia [lng 133, lat -25]
  const projection = d3.geoMercator()
    .center([133, -25])
    .scale(600)
    .translate([960 / 2, 600 / 2]);

  return (
    <QuizLayout
      title="Australia States Quiz"
      description="How well do you know Australia? Test your knowledge of its states and territories!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={AUSTRALIA_STATES}
      duration={GAME_DURATIONS.AUSTRALIA_STATES}
    />
  );
}
