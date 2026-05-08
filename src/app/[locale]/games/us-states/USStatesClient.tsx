'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { US_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USStatesClient() {
  return (
    <BaseGameClient
      useMapData={useUSMapData}
      regionNames={US_STATES}
      gameKey="us-states"
      duration={GAME_DURATIONS.US_STATES}
      projectionConfig={{
        type: 'albersUsa',
        scale: 1300,
      }}
    />
  );
}
