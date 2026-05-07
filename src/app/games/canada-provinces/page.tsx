'use client';

import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

import QuizLayout from '@/components/QuizLayout';
import { CANADA_PROVINCES, GAME_DURATIONS } from '@/config/gameConstants';
import { useCanadaMapData } from '@/hooks/useRegionMapData';

export default function CanadaProvincesGame() {
  const { data: mapData, status: mapStatus } = useCanadaMapData();

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
      title="Canada Provinces Quiz"
      description="Test your knowledge of Canadian provinces and territories!"
      mapData={mapData}
      mapStatus={mapStatus}
      projection={projection}
      validNames={CANADA_PROVINCES}
      duration={GAME_DURATIONS.CANADA_PROVINCES}
    />
  );
}
