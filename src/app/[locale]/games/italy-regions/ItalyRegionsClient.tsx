'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useItalyMapData } from '@/hooks/useRegionMapData';


export default function ItalyRegionsClient() {
  return (
    <BaseGameClient
      useMapData={useItalyMapData}
      configKey="ITALY_REGIONS"
      durationKey="ITALY_REGIONS_DURATION"
      gameKey="italy-regions"
      projectionConfig={{ type: 'fit' }}
    />
  );
}
