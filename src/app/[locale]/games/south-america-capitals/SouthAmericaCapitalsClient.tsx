'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import BaseGameClient from '@/components/BaseGameClient';
import { useGameConfig } from '@/hooks/useGameConfig';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCapitalsClient() {
  const { data: config } = useGameConfig();
  const tRegions = useTranslations('RegionNames');

  const { localizedValidNames, localizedCapitalMap } = useMemo(() => {
    if (!config) return { localizedValidNames: [], localizedCapitalMap: {} };
    
    const countries = config.SOUTH_AMERICA_COUNTRIES || [];
    const capitals = config.SOUTH_AMERICA_CAPITALS || {};
    
    const names = [...countries];
    const capMap = { ...capitals };
    
    countries.forEach((name: string) => {
      try {
        const localized = tRegions(name);
        if (localized !== name) {
          names.push(localized);
          capMap[localized] = capitals[name];
        }
      } catch { /* ignore */ }
    });
    
    return { localizedValidNames: names, localizedCapitalMap: capMap };
  }, [config, tRegions]);

  return (
    <BaseGameClient
      useMapData={useWorldMapData}
      configKey="SOUTH_AMERICA_COUNTRIES"
      gameKey="sa-capitals"
      duration={300} // Temporary fix; ideally fetch dynamic duration
      projectionConfig={{
        type: 'mercator',
        center: [-60, -20],
        scale: 450,
      }}
      showOnlyValid={true}
      // Note: QuizLayout would need to handle 'capital' mode and capitalMap
    />
  );
}
