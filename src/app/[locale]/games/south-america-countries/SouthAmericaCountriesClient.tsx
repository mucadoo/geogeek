'use client';

import BaseGameClient from '@/components/BaseGameClient';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCountriesClient() {
  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="SOUTH_AMERICA_COUNTRIES"
      gameKey="sa-countries"
      duration={300} // Temporary fix
      projectionConfig={{
        type: 'mercator',
        center: [-60, -22],
        scale: 550,
      }}
      showOnlyValid={true}
    />
  );
}
