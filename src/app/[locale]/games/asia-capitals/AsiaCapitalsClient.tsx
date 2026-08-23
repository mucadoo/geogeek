'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AsiaCapitalsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="ASIA_COUNTRIES"
      durationKey="ASIA_COUNTRIES_DURATION"
      gameKey="asia-capitals"
      gameMode="capital"
      projectionConfig={{
        type: 'mercator',
        scale: 300,
        center: [100, 30]
      }}
      showOnlyValid={true}
    />
  );
}
