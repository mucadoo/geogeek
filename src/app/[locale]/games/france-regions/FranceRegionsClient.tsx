'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { FRANCE_REGIONS, GAME_DURATIONS } from '@/config/gameConstants';
import { useFranceMapData } from '@/hooks/useRegionMapData';

export default function FranceRegionsClient() {
  return (
    <BaseGameClient
      useMapData={useFranceMapData}
      regionNames={FRANCE_REGIONS}
      gameKey="france-regions"
      duration={GAME_DURATIONS.FRANCE_REGIONS}
      projectionConfig={{ type: 'fit' }}
    />
  );
}
