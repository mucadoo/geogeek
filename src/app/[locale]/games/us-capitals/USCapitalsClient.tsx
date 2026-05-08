'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import BaseGameClient from '@/components/BaseGameClient';
import { useGameConfig } from '@/hooks/useGameConfig';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USCapitalsClient() {
  const { data: config } = useGameConfig();
  const tRegions = useTranslations('RegionNames');

  useMemo(() => {
    if (!config) return;
    
    const states = config.US_STATES || [];
    const capitals = config.US_CAPITALS || {};
    
    states.forEach((name: string) => {
      try {
        const localized = tRegions(name);
        if (localized !== name) {
          // Logic for localization
        }
      } catch { /* ignore */ }
    });
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
