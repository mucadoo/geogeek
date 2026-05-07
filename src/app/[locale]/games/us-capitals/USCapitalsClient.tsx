'use client';
'use client';
'use client';

import * as d3 from 'd3';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import QuizLayout from '@/components/QuizLayout';
import { US_STATES, US_CAPITALS, GAME_DURATIONS, CAPITAL_COORDINATES } from '@/config/gameConstants';
import { useUSMapData } from '@/hooks/useRegionMapData';

export default function USCapitalsClient() {
  const { data: mapData, status: mapStatus } = useUSMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = useMemo(() => {
    return d3.geoAlbersUsa()
      .scale(1200)
      .translate([960 / 2, 600 / 2]);
  },[]);

  const { localizedValidNames, localizedCapitalMap } = useMemo(() => {
    const names = [...US_STATES];
    const capMap = { ...US_CAPITALS };
    
    US_STATES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) {
          names.push(localized);
          capMap[localized] = US_CAPITALS[name];
        }
      } catch { /* ignore */ }
    });
    
    return { localizedValidNames: names, localizedCapitalMap: capMap };
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.us-capitals.title')}
      description={t('gameData.us-capitals.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.US_STATES}
      gameMode="capital"
      capitalMap={localizedCapitalMap}
      capitalCoordinates={CAPITAL_COORDINATES}
    />
  );
}
