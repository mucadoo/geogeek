'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useCanadaMapData } from '@/hooks/useRegionMapData';

export default function CanadaProvincesClient() {
  return (
    <BaseGameClient
      useMapData={useCanadaMapData}
      configKey="CANADA_PROVINCES"
      durationKey="CANADA_PROVINCES_DURATION"
      gameKey="canada-provinces"
      projectionConfig={{ type: 'fit' }}
    />
  );
}
