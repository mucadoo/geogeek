'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AfricaCapitalsReverseClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="AFRICA_COUNTRIES"
      durationKey="AFRICA_COUNTRIES_DURATION"
      gameKey="africa-capitals-reverse"
      gameMode="reverse"
      projectionConfig={{
        type: 'mercator',
        scale: 400,
        center: [20, 0]
      }}
      showOnlyValid={true}
    />
  );
}
