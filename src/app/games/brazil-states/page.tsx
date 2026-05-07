'use client';

import * as d3 from 'd3';

import QuizLayout from '@/components/QuizLayout';
import { BRAZIL_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useBrazilMapData } from '@/hooks/useRegionMapData';

export default function BrazilStatesGame() {
  const { data: mapData, status: mapStatus } = useBrazilMapData();

  // Center on Brazil [lng -55, lat -15]
  const projection = d3.geoMercator()
    .center([-55, -15])
    .scale(700)
    .translate([960 / 2, 600 / 2]);

  return (
    <QuizLayout
      title="Brazil States Quiz"
      description="How well do you know Brazil? A state will be highlighted, and you have 5 minutes to guess as many as you can!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={BRAZIL_STATES}
      duration={GAME_DURATIONS.BRAZIL_STATES}
    />
  );
}
