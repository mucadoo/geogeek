'use client';

import * as d3 from 'd3';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { US_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USStatesGame() {
  const { data: mapData, status: mapStatus } = useUSMapData();

  const projection = useMemo(() => {
    return d3.geoAlbersUsa()
      .scale(1300)
      .translate([960 / 2, 600 / 2]);
  }, []);

  return (
    <QuizLayout
      title="US States Quiz"
      description="How many United States can you name? A state will be highlighted, and you have 5 minutes to guess as many as you can!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={US_STATES}
      duration={GAME_DURATIONS.US_STATES}
    />
  );
}
