'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { ITALY_REGIONS, GAME_DURATIONS } from '@/config/gameConstants';
import { useItalyMapData } from '@/hooks/useRegionMapData';

export default function ItalyRegionsClient() {
  return (
    <BaseGameClient
      useMapData={useItalyMapData}
      regionNames={ITALY_REGIONS}
      gameKey="italy-regions"
      duration={GAME_DURATIONS.ITALY_REGIONS}
      projectionConfig={{ type: 'fit' }}
    />
  );
}
