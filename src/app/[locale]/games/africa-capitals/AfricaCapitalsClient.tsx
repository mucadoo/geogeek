'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AfricaCapitalsClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="AFRICA_COUNTRIES"
      durationKey="AFRICA_COUNTRIES_DURATION"
      gameKey="africa-capitals"
      gameMode="capital"
      projectionConfig={{
        type: 'mercator',
        scale: 400,
        center: [20, 0]
      }}
      showOnlyValid={true}
    />
  );
}
