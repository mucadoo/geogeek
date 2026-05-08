import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

export interface ProjectionConfig {
  type: 'fit' | 'mercator' | 'albersUsa';
  center?: [number, number];
  scale?: number;
}

export const useGameProjection = (mapData: any, config: ProjectionConfig) => {
  return useMemo(() => {
    if (config.type === 'mercator') {
      return d3.geoMercator()
        .center(config.center || [0, 0])
        .scale(config.scale || 500)
        .translate([960 / 2, 600 / 2]);
    }

    if (config.type === 'albersUsa') {
      return d3.geoAlbersUsa()
        .scale(config.scale || 1300)
        .translate([960 / 2, 600 / 2]);
    }

    if (!mapData) return d3.geoMercator();
    
    // Default to 'fit'
    const objectKey = Object.keys(mapData.objects)[0];
    const geojson = feature(mapData, mapData.objects[objectKey]) as unknown as FeatureCollection;
    
    return d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[20, 20], [940, 580]], geojson as unknown as d3.GeoPermissibleObjects);
  }, [mapData, config]);
};
