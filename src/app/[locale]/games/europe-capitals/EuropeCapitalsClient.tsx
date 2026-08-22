'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function EuropeCapitalsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="EUROPE_COUNTRIES"
      durationKey="EUROPE_COUNTRIES_DURATION"
      gameKey="europe-capitals"
      gameMode="capital"
      projectionConfig={{
        type: 'mercator',
        scale: 600,
        center: [10, 50]
      }}
      showOnlyValid={true}
    />
  );
}
