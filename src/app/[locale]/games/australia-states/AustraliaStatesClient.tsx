'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { AUSTRALIA_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useAustraliaMapData } from '@/hooks/useRegionMapData';

export default function AustraliaStatesClient() {
  return (
    <BaseGameClient
      useMapData={useAustraliaMapData}
      configKey="AUSTRALIA_STATES"
      gameKey="australia-states"
      duration={GAME_DURATIONS.AUSTRALIA_STATES}
      projectionConfig={{
        type: 'mercator',
        center: [133, -25],
        scale: 600,
      }}
    />
  );
}
