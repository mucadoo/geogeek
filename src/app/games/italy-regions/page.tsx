'use client';

import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

import QuizLayout from '@/components/QuizLayout';
import { ITALY_REGIONS, GAME_DURATIONS } from '@/config/gameConstants';
import { useItalyMapData } from '@/hooks/useRegionMapData';

export default function ItalyRegionsGame() {
  const { data: mapData, status: mapStatus } = useItalyMapData();

  const projection = useMemo(() => {
    if (!mapData) return d3.geoMercator();
    const objectKey = Object.keys(mapData.objects)[0];
    const geojson = feature(mapData, mapData.objects[objectKey]) as unknown as FeatureCollection;
    
    return d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[20, 20], [940, 580]], geojson as unknown as d3.GeoPermissibleObjects);
  }, [mapData]);

  return (
    <QuizLayout
      title="Italy Regions Quiz"
      description="Test your knowledge of Italian regions!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={ITALY_REGIONS}
      duration={GAME_DURATIONS.ITALY_REGIONS}
    />
  );
}
