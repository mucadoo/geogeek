'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useAustraliaMapData } from '@/hooks/useRegionMapData';

export default function AustraliaStatesClient() {
  return (
    <BaseGameClient
      useMapData={useAustraliaMapData}
      configKey="AUSTRALIA_STATES"
      durationKey="AUSTRALIA_STATES_DURATION"
      gameKey="australia-states"
      projectionConfig={{
        type: 'mercator',
        center: [133, -25],
        scale: 600,
      }}
    />
  );
}
