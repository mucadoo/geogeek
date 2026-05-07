'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { SOUTH_AMERICA_COUNTRIES, SOUTH_AMERICA_CAPITALS, TIME_PER_STATE_SECONDS, CAPITAL_COORDINATES } from '@/config/gameConstants';
import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function SouthAmericaCapitalsGame() {
  const { data: mapData, status: mapStatus } = useWorldMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = d3.geoMercator()
    .center([-60, -20])
    .scale(450)
    .translate([960 / 2, 600 / 2]);

  const { localizedValidNames, localizedCapitalMap } = useMemo(() => {
    const names = [...SOUTH_AMERICA_COUNTRIES];
    const capMap = { ...SOUTH_AMERICA_CAPITALS };
    
    SOUTH_AMERICA_COUNTRIES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) {
          names.push(localized);
          capMap[localized] = SOUTH_AMERICA_CAPITALS[name];
        }
      } catch { /* ignore */ }
    });
    
    return { localizedValidNames: names, localizedCapitalMap: capMap };
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.sa-capitals.title')}
      description={t('gameData.sa-capitals.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={SOUTH_AMERICA_COUNTRIES.length * TIME_PER_STATE_SECONDS}
      gameMode="capital"
      capitalMap={localizedCapitalMap}
      showOnlyValid={true}
      capitalCoordinates={CAPITAL_COORDINATES}
    />
  );
}
