'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="SOUTH_AMERICA_COUNTRIES"
      durationKey="SOUTH_AMERICA_COUNTRIES_DURATION"
      gameKey="south-america-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 350,
        center: [-60, -20]
      }}
    />
  );
}
