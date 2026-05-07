'use client';
'use client';
'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { SOUTH_AMERICA_COUNTRIES, TIME_PER_STATE_SECONDS } from '@/config/gameConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCountriesClient() {
  const { data: mapData, status: mapStatus } = useWorldMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  // Focus the projection strictly on South America
  const projection = d3.geoMercator()
    .center([-60, -22])
    .scale(550)
    .translate([960 / 2, 600 / 2]);

  const localizedValidNames = useMemo(() => {
    const names = [...SOUTH_AMERICA_COUNTRIES];
    SOUTH_AMERICA_COUNTRIES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.sa-countries.title')}
      description={t('gameData.sa-countries.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={SOUTH_AMERICA_COUNTRIES.length * TIME_PER_STATE_SECONDS}
      showOnlyValid={true}
    />
  );
}
