'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { BRAZIL_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useBrazilMapData } from '@/hooks/useRegionMapData';

export default function BrazilStatesClient() {
  return (
    <BaseGameClient
      useMapData={useBrazilMapData}
      configKey="BRAZIL_STATES"
      gameKey="brazil-states"
      duration={GAME_DURATIONS.BRAZIL_STATES}
      projectionConfig={{
        type: 'mercator',
        center: [-55, -15],
        scale: 700,
      }}
    />
  );
}
