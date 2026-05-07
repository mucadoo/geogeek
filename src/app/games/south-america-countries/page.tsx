'use client';

import * as d3 from 'd3';

import QuizLayout from '@/components/QuizLayout';
import { SOUTH_AMERICA_COUNTRIES, TIME_PER_STATE_SECONDS } from '@/config/gameConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCountriesGame() {
  // We use the world map, but only validate the South American countries
  const { data: mapData, status: mapStatus } = useWorldMapData();

  // Focus the projection strictly on South America
  const projection = d3.geoMercator()
    .center([-60, -22])
    .scale(550)
    .translate([960 / 2, 600 / 2]);

  return (
    <QuizLayout
      title="South America Quiz"
      description="Test your knowledge! Guess the countries of South America."
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={SOUTH_AMERICA_COUNTRIES}
      duration={SOUTH_AMERICA_COUNTRIES.length * TIME_PER_STATE_SECONDS}
      showOnlyValid={true} // <--- Hides North America, Europe, etc.
    />
  );
}
