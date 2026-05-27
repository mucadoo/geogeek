'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function FlagGameClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="WORLD_COUNTRIES"
      durationKey="WORLD_COUNTRIES_DURATION"
      gameKey="flag-game"
      gameMode="flag"
      projectionConfig={{
        type: 'mercator',
        scale: 150,
      }}
    />
  );
}
