'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AfricaFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="AFRICA_COUNTRIES"
      durationKey="AFRICA_COUNTRIES_DURATION"
      gameKey="africa-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 400,
        center: [20, 0]
      }}
    />
  );
}
