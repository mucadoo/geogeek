'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import BaseGameClient from '@/components/BaseGameClient';
import { useGameConfig } from '@/hooks/useGameConfig';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USCapitalsClient() {
  const { data: config } = useGameConfig();
  const tRegions = useTranslations('RegionNames');

  const { localizedValidNames, localizedCapitalMap } = useMemo(() => {
    if (!config) return { localizedValidNames: [], localizedCapitalMap: {} };
    
    const states = config.US_STATES || [];
    const capitals = config.US_CAPITALS || {};
    
    const names = [...states];
    const capMap = { ...capitals };
    
    states.forEach((name: string) => {
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
      useMapData={useUSMapData}
      configKey="US_STATES"
      gameKey="us-capitals"
      duration={300} // Temporary fix
      projectionConfig={{
        type: 'albersUsa',
        scale: 1200,
      }}
    />
  );
}
