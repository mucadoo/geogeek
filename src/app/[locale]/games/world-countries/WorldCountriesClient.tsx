'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function WorldCountriesClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="WORLD_COUNTRIES"
      durationKey="WORLD_COUNTRIES_DURATION"
      gameKey="world-countries"
      gameMode="name"
      projectionConfig={{
        type: 'mercator',
        scale: 150,
      }}
      showOnlyValid={true}
    />
  );
}
