'use client';

import * as d3 from 'd3';

import QuizLayout from '@/components/QuizLayout';
import { SOUTH_AMERICA_COUNTRIES, SOUTH_AMERICA_CAPITALS, TIME_PER_STATE_SECONDS } from '@/config/gameConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCapitalsGame() {
  const { data: mapData, status: mapStatus } = useWorldMapData();

  const projection = d3.geoMercator()
    .center([-60, -20])
    .scale(450)
    .translate([960 / 2, 600 / 2]);

  return (
    <QuizLayout
      title="South America Capitals"
      description="Do you know the capitals of South American countries? A country will be highlighted, type its capital!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={SOUTH_AMERICA_COUNTRIES}
      duration={SOUTH_AMERICA_COUNTRIES.length * TIME_PER_STATE_SECONDS}
      gameMode="capital"
      capitalMap={SOUTH_AMERICA_CAPITALS}
    />
  );
}
