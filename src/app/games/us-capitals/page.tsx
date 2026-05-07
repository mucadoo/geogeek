'use client';

import * as d3 from 'd3';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { US_STATES, US_CAPITALS, GAME_DURATIONS, CAPITAL_COORDINATES } from '@/config/gameConstants';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USCapitalsGame() {
  const { data: mapData, status: mapStatus } = useUSMapData();

  const projection = useMemo(() => {
    return d3.geoAlbersUsa()
      .scale(1200)
      .translate([960 / 2, 600 / 2]);
  },[]);

  return (
    <QuizLayout
      title="US Capitals Quiz"
      description="Can you name the capital of every US State? A state will be highlighted, type its capital!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={US_STATES}
      duration={GAME_DURATIONS.US_STATES}
      gameMode="capital"
      capitalMap={US_CAPITALS}
      capitalCoordinates={CAPITAL_COORDINATES} // <--- Red Dot exactly where the city is
    />
  );
}
