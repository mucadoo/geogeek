'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { US_STATES, GAME_DURATIONS } from '@/config/gameConstants';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USStatesClient() {
  const { data: mapData, status: mapStatus } = useUSMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = useMemo(() => {
    return d3.geoAlbersUsa()
      .scale(1300)
      .translate([960 / 2, 600 / 2]);
  }, []);

  const localizedValidNames = useMemo(() => {
    const names = [...US_STATES];
    US_STATES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.us-states.title')}
      description={t('gameData.us-states.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.US_STATES}
    />
  );
}
