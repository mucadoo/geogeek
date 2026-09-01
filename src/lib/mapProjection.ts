import * as d3 from 'd3';

// Geometry helpers shared by the Explorer's flat (Mercator, horizontally
// repeating) and globe (orthographic, drag-to-rotate) views.

/**
 * Fold an SVG-zoom x translation onto the centre world copy, so panning a
 * repeating flat map never runs off the rendered copies. `k` is the current zoom
 * scale; `worldWidth` is the unscaled width of one world copy.
 */
export function wrapTranslateX(x: number, k: number, worldWidth: number): number {
  const span = worldWidth * k;
  if (span <= 0) return x;
  let nx = ((x % span) + span) % span;
  if (nx > span / 2) nx -= span;
  return nx;
}

/**
 * Shift `targetX` by a whole number of scaled world widths so it lands on the
 * world copy nearest `referenceX` (the current pan position). Keeps a
 * programmatic fly-to on the repeating flat map to the shortest horizontal path
 * instead of sliding across the whole world to reach the centre copy.
 */
export function rebaseTranslateX(
  targetX: number,
  referenceX: number,
  k: number,
  worldWidth: number,
): number {
  const span = worldWidth * k;
  if (span <= 0) return targetX;
  return targetX + Math.round((referenceX - targetX) / span) * span;
}

/**
 * Zoom transform that frames `feature` on the repeating flat map. Uses
 * `d3.geoBounds` / `d3.geoCentroid` (not projected path bounds) so features that
 * straddle the antimeridian — USA/Aleutians, Russia, Fiji, Kiribati, NZ, where
 * `geoBounds` reports `east < west` — are measured across the seam instead of
 * wrapping the whole globe.
 */
export function fitFeatureFlat(
  feature: d3.GeoPermissibleObjects,
  projection: d3.GeoProjection,
  worldWidth: number,
  targetWidth: number,
  height: number,
  maxScale = 8,
): d3.ZoomTransform {
  const [[west, south], [east0, north]] = d3.geoBounds(feature);
  const east = east0 < west ? east0 + 360 : east0;

  const centreLonRaw = (west + east) / 2;
  const centreLon = centreLonRaw > 180 ? centreLonRaw - 360 : centreLonRaw;
  const centreLat = (south + north) / 2;

  const [cx, cy] = projection([centreLon, centreLat]) ?? [targetWidth / 2, height / 2];
  const yNorth = projection([centreLon, north])?.[1] ?? cy;
  const ySouth = projection([centreLon, south])?.[1] ?? cy;

  const pxWidth = ((east - west) / 360) * worldWidth;
  const pxHeight = Math.abs(ySouth - yNorth);

  const scale = Math.max(
    1,
    Math.min(maxScale, 0.8 / Math.max(pxWidth / targetWidth, pxHeight / height)),
  );

  const tx = wrapTranslateX(targetWidth / 2 - scale * cx, scale, worldWidth);
  const ty = height / 2 - scale * cy;

  return d3.zoomIdentity.translate(tx, ty).scale(scale);
}

/** Target orthographic `.rotate()` value that brings `[lng, lat]` to the front. */
export function orientationFor(point: [number, number]): [number, number] {
  return [-point[0], -point[1]];
}

/**
 * Globe framing for a feature: centre on `centrePoint` — pass the capital when
 * known so the populated heart of a country faces the viewer instead of an
 * area-weighted centroid skewed toward empty Arctic / ocean / desert (clicking
 * Canada should look at southern Canada, not Ellesmere Island) — with an
 * orthographic scale derived from the feature's spherical area so large countries
 * pull back to fit and small ones zoom in.
 */
export function fitFeatureGlobe(
  feature: d3.GeoPermissibleObjects,
  centrePoint: [number, number],
  height: number,
  defaultScale: number,
): { point: [number, number]; scale: number } {
  // Angular radius of a spherical cap with the same area as the feature.
  const capRadius = Math.acos(Math.max(-1, 1 - d3.geoArea(feature) / (2 * Math.PI)));
  const eff = Math.min(capRadius * 2.1, (78 * Math.PI) / 180);
  // Orthographic: a point `α` from the projection centre lands `scale·sin(α)` px
  // out, so solve for the scale that puts the padded cap edge at ~0.4·height.
  const raw = (0.4 * height) / Math.sin(Math.max(eff, 0.05));
  const scale = Math.max(defaultScale * 1.6, Math.min(defaultScale * 3.6, raw));
  return { point: centrePoint, scale };
}

/** True when `[lng, lat]` sits on the visible near hemisphere of the globe. */
export function isFrontFacing(
  point: [number, number],
  rotation: [number, number],
): boolean {
  const centre: [number, number] = [-rotation[0], -rotation[1]];
  return d3.geoDistance(point, centre) < Math.PI / 2;
}
