'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AsiaFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="ASIA_COUNTRIES"
      durationKey="ASIA_COUNTRIES_DURATION"
      gameKey="asia-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 300,
        center: [100, 30]
      }}
    />
  );
}
