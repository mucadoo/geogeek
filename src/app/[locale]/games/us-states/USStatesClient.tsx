'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USStatesClient() {
  return (
    <BaseGameClient
      useMapData={useUSMapData}
      configKey="US_STATES"
      durationKey="US_STATES_DURATION"
      gameKey="us-states"
      projectionConfig={{
        type: 'albersUsa',
        scale: 1300,
      }}
    />
  );
}
