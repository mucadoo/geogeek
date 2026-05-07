'use client';
'use client';
'use client';

import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

import QuizLayout from '@/components/QuizLayout';
import { ITALY_REGIONS, GAME_DURATIONS } from '@/config/gameConstants';
import { useItalyMapData } from '@/hooks/useRegionMapData';

export default function ItalyRegionsClient() {
  const { data: mapData, status: mapStatus } = useItalyMapData();
  const t = useTranslations('Games');
  const tRegions = useTranslations('RegionNames');

  const projection = useMemo(() => {
    if (!mapData) return d3.geoMercator();
    const objectKey = Object.keys(mapData.objects)[0];
    const geojson = feature(mapData, mapData.objects[objectKey]) as unknown as FeatureCollection;
    
    return d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[20, 20], [940, 580]], geojson as unknown as d3.GeoPermissibleObjects);
  }, [mapData]);

  const localizedValidNames = useMemo(() => {
    const names = [...ITALY_REGIONS];
    ITALY_REGIONS.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.italy-regions.title')}
      description={t('gameData.italy-regions.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.ITALY_REGIONS}
    />
  );
}
