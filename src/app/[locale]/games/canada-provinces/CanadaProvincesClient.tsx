'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { CANADA_PROVINCES, GAME_DURATIONS } from '@/config/gameConstants';
import { useCanadaMapData } from '@/hooks/useRegionMapData';

export default function CanadaProvincesClient() {
  return (
    <BaseGameClient
      useMapData={useCanadaMapData}
      regionNames={CANADA_PROVINCES}
      gameKey="canada-provinces"
      duration={GAME_DURATIONS.CANADA_PROVINCES}
      projectionConfig={{ type: 'fit' }}
    />
  );
}
