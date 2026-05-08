'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import BaseGameClient from '@/components/BaseGameClient';
import { useGameConfig } from '@/hooks/useGameConfig';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCapitalsClient() {
  const { data: config } = useGameConfig();
  const tRegions = useTranslations('RegionNames');

  useMemo(() => {
    if (!config) return;
    
    const countries = config.SOUTH_AMERICA_COUNTRIES || [];
    const capitals = config.SOUTH_AMERICA_CAPITALS || {};
    
    countries.forEach((name: string) => {
      try {
        const localized = tRegions(name);
        if (localized !== name) {
          // Names and map are localized, but not used in current implementation
        }
      } catch { /* ignore */ }
    });
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
