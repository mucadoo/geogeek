'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { SOUTH_AMERICA_COUNTRIES, TIME_PER_STATE_SECONDS } from '@/config/gameConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCountriesClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      regionNames={SOUTH_AMERICA_COUNTRIES}
      gameKey="sa-countries"
      duration={SOUTH_AMERICA_COUNTRIES.length * TIME_PER_STATE_SECONDS}
      projectionConfig={{
        type: 'mercator',
        center: [-60, -22],
        scale: 550,
      }}
      showOnlyValid={true}
    />
  );
}
