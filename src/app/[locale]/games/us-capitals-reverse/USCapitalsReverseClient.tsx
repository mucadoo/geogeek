'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USCapitalsReverseClient() {
  return (
    <BaseGameClient
      useMapData={useUSMapData}
      configKey="US_STATES"
      durationKey="US_STATES_DURATION"
      gameKey="us-capitals-reverse"
      gameMode="reverse"
      projectionConfig={{
        type: 'albersUsa',
        scale: 1200,
      }}
    />
  );
}
