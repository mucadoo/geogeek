'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { BRAZIL_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useBrazilMapData } from '@/hooks/useRegionMapData';

export default function BrazilStatesGame() {
  const { data: mapData, status: mapStatus } = useBrazilMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  // Center on Brazil [lng -55, lat -15]
  const projection = d3.geoMercator()
    .center([-55, -15])
    .scale(700)
    .translate([960 / 2, 600 / 2]);

  const localizedValidNames = useMemo(() => {
    const names = [...BRAZIL_STATES];
    BRAZIL_STATES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.brazil-states.title')}
      description={t('gameData.brazil-states.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.BRAZIL_STATES}
    />
  );
}
