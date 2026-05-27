'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function EuropeFlagsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="EUROPE_COUNTRIES"
      durationKey="EUROPE_COUNTRIES_DURATION"
      gameKey="europe-flags"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 600,
        center: [10, 50]
      }}
    />
  );
}
