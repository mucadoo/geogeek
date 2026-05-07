'use client';
'use client';
'use client';

import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

import QuizLayout from '@/components/QuizLayout';
import { CANADA_PROVINCES, GAME_DURATIONS } from '@/config/gameConstants';
import { useCanadaMapData } from '@/hooks/useRegionMapData';

export default function CanadaProvincesClient() {
  const { data: mapData, status: mapStatus } = useCanadaMapData();
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
    const names = [...CANADA_PROVINCES];
    CANADA_PROVINCES.forEach(name => {
      try {
        const localized = tRegions(name);
        if (localized !== name) names.push(localized);
      } catch { /* ignore */ }
    });
    return names;
  }, [tRegions]);

  return (
    <QuizLayout
      title={t('gameData.canada-provinces.title')}
      description={t('gameData.canada-provinces.description')}
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={localizedValidNames}
      duration={GAME_DURATIONS.CANADA_PROVINCES}
    />
  );
}
