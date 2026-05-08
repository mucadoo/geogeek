'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useFranceMapData } from '@/hooks/useRegionMapData';

export default function FranceRegionsClient() {
  return (
    <BaseGameClient
      useMapData={useFranceMapData}
      configKey="FRANCE_REGIONS"
      durationKey="FRANCE_REGIONS_DURATION"
      gameKey="france-regions"
      projectionConfig={{ type: 'fit' }}
    />
  );
}
