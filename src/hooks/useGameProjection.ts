import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { useMemo } from 'react';
import { feature } from 'topojson-client';

export interface ProjectionConfig {
  type: 'fit' | 'mercator' | 'albersUsa';
  center?: [number, number];
  scale?: number;
}

const WIDTH = 960;
const HEIGHT = 600;

// A globe is only possible for datasets whose coordinates are real lng/lat.
// `type: 'fit'` datasets are already planar-projected, so they stay flat.
export const gameGlobeAvailable = (config: ProjectionConfig) => config.type !== 'fit';

export const useGameProjection = (
  mapData: any,
  config: ProjectionConfig,
  globe = false,
) => {
  return useMemo(() => {
    if (globe && mapData && gameGlobeAvailable(config)) {
      const objectKey = Object.keys(mapData.objects)[0];
      const geojson = feature(mapData, mapData.objects[objectKey]) as unknown as FeatureCollection;
      const [cx, cy] = d3.geoCentroid(geojson as unknown as d3.GeoPermissibleObjects);

      // Orient the globe so the quiz region faces the viewer, then fit it to
      // the frame at that orientation. Drag only mutates `.rotate()` afterwards,
      // so the scale / translate stay put.
      const projection = d3.geoOrthographic()
        .rotate([-cx, -cy])
        .clipAngle(90)
        .precision(0.5);

      projection.fitExtent([[60, 60], [WIDTH - 60, HEIGHT - 60]], geojson as unknown as d3.GeoPermissibleObjects);

      // World-scale datasets fit tighter than the sphere; never let the globe
      // spill past the frame or shrink to a pea.
      const maxScale = HEIGHT / 2 - 8;
      if (projection.scale() > maxScale) projection.scale(maxScale);
      projection.translate([WIDTH / 2, HEIGHT / 2]);

      return projection;
    }

    if (config.type === 'mercator') {
      return d3.geoMercator()
        .center(config.center || [0, 0])
        .scale(config.scale || 500)
        .translate([WIDTH / 2, HEIGHT / 2]);
    }

    if (config.type === 'albersUsa') {
      return d3.geoAlbersUsa()
        .scale(config.scale || 1300)
        .translate([WIDTH / 2, HEIGHT / 2]);
    }

    if (!mapData) return d3.geoMercator();

    // Default to 'fit'
    const objectKey = Object.keys(mapData.objects)[0];
    const geojson = feature(mapData, mapData.objects[objectKey]) as unknown as FeatureCollection;

    return d3.geoIdentity()
      .reflectY(true)
      .fitExtent([[20, 20], [940, 580]], geojson as unknown as d3.GeoPermissibleObjects);
  }, [mapData, config, globe]);
};
