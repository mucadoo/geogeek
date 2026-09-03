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
 * The feature's largest-area polygon as its own `Polygon`, or the feature
 * unchanged when it isn't a multi-part one. Lets `mainlandBounds` /
 * `mainlandCentroid` measure a country's main landmass and skip its far-flung
 * minor parts — French Guiana / Réunion for France, Svalbard / Bouvet for Norway,
 * the Caribbean municipalities for the Netherlands, Easter Island for Chile,
 * Galápagos for Ecuador — instead of spanning its whole spread. Also trims stray
 * offshore islets off a lumpy simplified subdivision.
 */
function largestPart(feature: d3.GeoPermissibleObjects): d3.GeoPermissibleObjects {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geom: any = (feature as any).type === 'Feature' ? (feature as any).geometry : feature;
  if (!geom || geom.type !== 'MultiPolygon' || geom.coordinates.length < 2) {
    return feature;
  }
  let best = geom.coordinates[0];
  let bestArea = -1;
  for (const coords of geom.coordinates) {
    const area = d3.geoArea({ type: 'Polygon', coordinates: coords } as d3.GeoPermissibleObjects);
    if (area > bestArea) {
      bestArea = area;
      best = coords;
    }
  }
  return { type: 'Polygon', coordinates: best } as d3.GeoPermissibleObjects;
}

/** Bounds of the feature's main landmass (see `largestPart`). */
export function mainlandBounds(
  feature: d3.GeoPermissibleObjects,
): [[number, number], [number, number]] {
  return d3.geoBounds(largestPart(feature));
}

/** Centroid of the feature's main landmass (see `largestPart`). */
export function mainlandCentroid(feature: d3.GeoPermissibleObjects): [number, number] {
  return d3.geoCentroid(largestPart(feature)) as [number, number];
}

/**
 * Zoom transform that frames `feature` on the repeating flat map. Uses
 * `mainlandBounds` / `d3.geoCentroid` (not projected path bounds) so features that
 * straddle the antimeridian — USA/Aleutians, Russia, Fiji, Kiribati, NZ, where
 * `geoBounds` reports `east < west` — are measured across the seam instead of
 * wrapping the whole globe. Pass `centreOverride` (the capital) to keep the
 * populated heart centred when a subdivision's simplified geometry is lumpy.
 */
export function fitFeatureFlat(
  feature: d3.GeoPermissibleObjects,
  projection: d3.GeoProjection,
  worldWidth: number,
  targetWidth: number,
  height: number,
  maxScale = 8,
  centreOverride?: [number, number] | null,
): d3.ZoomTransform {
  const [[west, south], [east0, north]] = mainlandBounds(feature);
  const east = east0 < west ? east0 + 360 : east0;

  const centreLonRaw = (west + east) / 2;
  const boundsLon = centreLonRaw > 180 ? centreLonRaw - 360 : centreLonRaw;
  const boundsLat = (south + north) / 2;
  const centreLon = centreOverride ? centreOverride[0] : boundsLon;
  const centreLat = centreOverride ? centreOverride[1] : boundsLat;

  const [cx, cy] = projection([centreLon, centreLat]) ?? [targetWidth / 2, height / 2];
  const yNorth = projection([boundsLon, north])?.[1] ?? cy;
  const ySouth = projection([boundsLon, south])?.[1] ?? cy;

  const pxWidth = ((east - west) / 360) * worldWidth;
  const pxHeight = Math.abs(ySouth - yNorth);

  const scale = Math.max(
    1,
    Math.min(maxScale, 0.8 / Math.max(pxWidth / targetWidth, pxHeight / height)),
  );

  // Raw (unwrapped) translation. The caller folds it onto the nearest world copy
  // with `rebaseTranslateX` for the repeating world map, and leaves it alone for
  // a single-copy sub-map — folding by a whole world width here would shove a
  // deeply-zoomed sub-map clean off the viewport.
  const tx = targetWidth / 2 - scale * cx;
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
  maxFactor = 3.6,
): { point: [number, number]; scale: number } {
  return fitAreaGlobe(d3.geoArea(feature), centrePoint, height, defaultScale, 'steradians', maxFactor);
}

/** Mean Earth surface area, km² — for converting `areaKm2` to steradians. */
const EARTH_SURFACE_KM2 = 510_072_000;

/**
 * Same framing as `fitFeatureGlobe` but from a raw area. Prefer this when the
 * area is known independently of the drawn geometry (`Country.areaKm2`), so the
 * globe fly-to target is stable the moment the country record loads instead of
 * waiting on / churning with the world-atlas feature.
 */
export function fitAreaGlobe(
  area: number,
  centrePoint: [number, number],
  height: number,
  defaultScale: number,
  areaUnit: 'steradians' | 'km2' = 'steradians',
  maxFactor = 3.6,
): { point: [number, number]; scale: number } {
  const steradians = areaUnit === 'km2' ? (area / EARTH_SURFACE_KM2) * 4 * Math.PI : area;
  // Angular radius of a spherical cap with the same area as the feature.
  const capRadius = Math.acos(Math.max(-1, 1 - steradians / (2 * Math.PI)));
  const eff = Math.min(capRadius * 2.1, (78 * Math.PI) / 180);
  // Orthographic: a point `α` from the projection centre lands `scale·sin(α)` px
  // out, so solve for the scale that puts the padded cap edge at ~0.4·height.
  const raw = (0.4 * height) / Math.sin(Math.max(eff, 0.03));
  const scale = Math.max(defaultScale * 1.6, Math.min(defaultScale * maxFactor, raw));
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
