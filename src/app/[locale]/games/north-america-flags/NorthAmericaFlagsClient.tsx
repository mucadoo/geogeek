'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function NorthAmericaFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="NORTH_AMERICA_COUNTRIES"
      durationKey="NORTH_AMERICA_COUNTRIES_DURATION"
      gameKey="north-america-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 300,
        center: [-100, 40]
      }}
    />
  );
}
