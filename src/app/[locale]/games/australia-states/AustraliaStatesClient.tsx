'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { AUSTRALIA_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useAustraliaMapData } from '@/hooks/useRegionMapData';

export default function AustraliaStatesGame() {
  const { data: mapData, status: mapStatus } = useAustraliaMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  // Center on Australia [lng 133, lat -25]
  const projection = d3.geoMercator()
    .center([133, -25])
    .scale(600)
    .translate([960 / 2, 600 / 2]);

  const localizedValidNames = useMemo(() => {
    const names = [...AUSTRALIA_STATES];
    AUSTRALIA_STATES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.australia-states.title')}
      description={t('gameData.australia-states.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.AUSTRALIA_STATES}
    />
  );
}
