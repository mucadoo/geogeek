'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function OceaniaFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="OCEANIA_COUNTRIES"
      durationKey="OCEANIA_COUNTRIES_DURATION"
      gameKey="oceania-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 300,
        center: [140, -20]
      }}
    />
  );
}
