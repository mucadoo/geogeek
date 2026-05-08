'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useBrazilMapData } from '@/hooks/useRegionMapData';

export default function BrazilStatesClient() {
  return (
    <BaseGameClient
      useMapData={useBrazilMapData}
      configKey="BRAZIL_STATES"
      durationKey="BRAZIL_STATES_DURATION"
      gameKey="brazil-states"
      projectionConfig={{
        type: 'mercator',
        center: [-55, -15],
        scale: 700,
      }}
    />
  );
}
