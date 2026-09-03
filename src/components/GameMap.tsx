'use client';

import * as d3 from 'd3';
import { Feature, FeatureCollection } from 'geojson';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { useGameStore } from '@/store/useGameStore';

// A point is hidden on the far side of the globe once it is more than 90° from
// the point facing the viewer (`[-λ, -φ]` of the current rotation).
const isOnFarSide = (lng: number, lat: number, rotation: [number, number]) =>
  d3.geoDistance([lng, lat], [-rotation[0], -rotation[1]]) > Math.PI / 2;

interface GameMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
  projection: d3.GeoProjection | d3.GeoIdentityTransform;
  /** When true, `projection` is a draggable orthographic globe. */
  isGlobe?: boolean;
  validNames: string[];
  width?: number;
  height?: number;
  showOnlyValid?: boolean;
  gameMode?: 'name' | 'capital' | 'flag';
  capitalMap?: Record<string, string>;
  capitalCoordinates?: Record<string, [number, number]>;
  onRegionClick?: (id: string, name: string) => void;
  hideBorders?: boolean;
  noMapHints?: boolean;
  /** Learn Mode: render a persistent name label on every valid region. */
  showLabels?: boolean;
  /** Optional per-region label text (e.g. localized name); defaults to the raw name. */
  getLabel?: (name: string) => string;
}

const normalizeString = (str: string | null | undefined) => {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

type Bounds = [[number, number], [number, number]];

// Countries whose geometry crosses the antimeridian (Fiji, Russia, ...) get
// split into far-apart polygons by topojson-client. A naive bounds() over
// the whole (Multi)Polygon then spans almost the entire projected map,
// which makes the auto-zoom "zoom out" to fit the whole globe instead of
// framing the country. Zooming to just the largest sub-polygon (by
// projected bbox area) keeps the focus on the country's main landmass.
function getFocusBounds(pathGenerator: d3.GeoPath, activeFeature: Feature): Bounds | null {
  const geometry = activeFeature.geometry;
  if (geometry?.type === 'MultiPolygon') {
    let best: Bounds | null = null;
    let bestArea = -Infinity;
    for (const polygonCoords of geometry.coordinates) {
      const subFeature: Feature = { type: 'Feature', properties: null, geometry: { type: 'Polygon', coordinates: polygonCoords } };
      const bounds = pathGenerator.bounds(subFeature as unknown as d3.GeoPermissibleObjects) as Bounds;
      if (!bounds || isNaN(bounds[0][0])) continue;
      const area = (bounds[1][0] - bounds[0][0]) * (bounds[1][1] - bounds[0][1]);
      if (area > bestArea) {
        bestArea = area;
        best = bounds;
      }
    }
    return best;
  }

  const bounds = pathGenerator.bounds(activeFeature as unknown as d3.GeoPermissibleObjects) as Bounds;
  return bounds && !isNaN(bounds[0][0]) ? bounds : null;
}

export default function GameMap({
  mapData, highlightedStateId, projection, isGlobe = false, validNames,
  width = 960, height = 600,
  showOnlyValid = false, gameMode = 'name', capitalMap = {}, capitalCoordinates = {},
  onRegionClick,
  hideBorders = false,
  noMapHints = false,
  showLabels = false,
  getLabel = (name: string) => name,
}: GameMapProps) {
  const { correctlyGuessedIds, lastGuessCorrect, autoZoom } = useGameStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;
  const autoRotateRaf = useRef<number | null>(null);

  // Re-seed the rotation from the projection whenever a new one is built (a new
  // game, or the flat/globe toggle) so the globe starts framed on the region.
  useEffect(() => {
    if (isGlobe && typeof (projection as d3.GeoProjection).rotate === 'function') {
      const [l, p] = (projection as d3.GeoProjection).rotate();
      setRotation([l, p]);
    }
  }, [projection, isGlobe]);

  // Drag to spin the globe. A drag also abandons any in-flight auto-rotate.
  useEffect(() => {
    if (!isGlobe || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    let raf: number | null = null;
    const flush = () => { raf = null; setRotation([rotationRef.current[0], rotationRef.current[1]]); };
    const schedule = () => { if (raf == null) raf = requestAnimationFrame(flush); };

    const drag = d3.drag<SVGSVGElement, unknown>()
      .clickDistance(5)
      .on('start', () => {
        if (autoRotateRaf.current != null) { cancelAnimationFrame(autoRotateRaf.current); autoRotateRaf.current = null; }
      })
      .on('drag', (event) => {
        const k = 0.3;
        const [l, p] = rotationRef.current;
        rotationRef.current = [l + event.dx * k, Math.max(-90, Math.min(90, p - event.dy * k))];
        schedule();
      });

    svg.call(drag);
    return () => {
      svg.on('.drag', null);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [isGlobe]);

  // Apply the live rotation before every projection use.
  if (isGlobe && typeof (projection as d3.GeoProjection).rotate === 'function') {
    (projection as d3.GeoProjection).rotate(rotation);
  }
  const pathGenerator = d3.geoPath().projection(projection);

  const allFeatures = useMemo(() => {
    if (!mapData) return [];
    const objectKey = mapData.objects.regions ? 'regions' : (mapData.objects.countries ? 'countries' : Object.keys(mapData.objects)[0]);
    if (!mapData.objects[objectKey]) return [];
    const geo = feature(mapData, mapData.objects[objectKey]) as FeatureCollection;
    // Must match the same id-fallback QuizLayout applies when building game
    // states (a few territories have no numeric id in the topology and
    // would otherwise all collide on the string "undefined").
    return (geo.features as Feature[]).map((f) =>
      f.id == null ? { ...f, id: (f.properties as { name: string })?.name } : f
    );
  }, [mapData]);

  // Globe auto-zoom: rotate the sphere so the target region faces the viewer
  // (the flat map's pan/scale transform is meaningless on a globe).
  useEffect(() => {
    if (!isGlobe || !autoZoom || !highlightedStateId || !allFeatures.length) return;
    const activeFeature = allFeatures.find((f) => String(f.id) === highlightedStateId);
    if (!activeFeature) return;
    const [cx, cy] = d3.geoCentroid(activeFeature as unknown as d3.GeoPermissibleObjects);
    if (isNaN(cx) || isNaN(cy)) return;

    const [sl, sp] = rotationRef.current;
    const dl = ((-cx - sl) % 360 + 540) % 360 - 180;
    const dp = -cy - sp;
    if (Math.abs(dl) < 0.5 && Math.abs(dp) < 0.5) return;

    if (autoRotateRaf.current != null) cancelAnimationFrame(autoRotateRaf.current);
    const start = performance.now();
    const step = (now: number) => {
      const e = d3.easeCubicInOut(Math.min(1, (now - start) / 700));
      setRotation([sl + dl * e, sp + dp * e]);
      autoRotateRaf.current = e < 1 ? requestAnimationFrame(step) : null;
    };
    autoRotateRaf.current = requestAnimationFrame(step);
    return () => {
      if (autoRotateRaf.current != null) { cancelAnimationFrame(autoRotateRaf.current); autoRotateRaf.current = null; }
    };
  }, [isGlobe, autoZoom, highlightedStateId, allFeatures]);

  // Compute smooth zoom focus transformation style
  const focusTransformStyle = useMemo(() => {
    if (isGlobe) {
      const zoomed = autoZoom && !!highlightedStateId;
      // The globe centres the target region by rotation, so a plain scale
      // about the frame centre is the zoom. Size that scale to the region's
      // own angular footprint — the same framing the flat map gets — instead
      // of a fixed factor that leaves small countries tiny. Uses geographic
      // (rotation-independent) extent so it doesn't wobble mid-spin.
      let scale = 1;
      if (zoomed) {
        scale = 1.9;
        const activeFeature = allFeatures.find((f) => String(f.id) === highlightedStateId);
        const projScale = typeof (projection as d3.GeoProjection).scale === 'function'
          ? (projection as d3.GeoProjection).scale()
          : 0;
        if (activeFeature && projScale > 0) {
          const [[w, s], [e, n]] = d3.geoBounds(activeFeature as unknown as d3.GeoPermissibleObjects);
          let lonSpan = e - w;
          if (lonSpan < 0) lonSpan += 360;
          const rad = Math.PI / 180;
          const midLat = ((s + n) / 2) * rad;
          // Orthographic projects an angular span θ (rad) near the centre to
          // roughly projScale·θ pixels; clamp lonSpan so a sprawling country
          // doesn't force a pointless zoom-out.
          const projW = projScale * Math.min(lonSpan, 170) * rad * Math.max(0.15, Math.cos(midLat));
          const projH = projScale * (n - s) * rad;
          if (projW > 0 && projH > 0) {
            scale = Math.max(1.4, Math.min(4, 0.55 / Math.max(projW / width, projH / height)));
          }
        }
      }
      return {
        transform: `scale(${scale})`,
        transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        transformOrigin: `${width / 2}px ${height / 2}px`,
      };
    }
    if (!autoZoom || !highlightedStateId || !allFeatures.length) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const activeFeature = allFeatures.find((f) => String(f.id) === highlightedStateId);
    if (!activeFeature) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const bounds = getFocusBounds(pathGenerator, activeFeature);
    if (!bounds) {
      return { transform: 'translate(0px, 0px) scale(1)', transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' };
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const x = (x0 + x1) / 2;
    const y = (y0 + y1) / 2;

    const scale = Math.max(1, Math.min(4, 0.55 / Math.max(dx / width, dy / height)));
    const tx = width / 2 - scale * x;
    const ty = height / 2 - scale * y;

    return {
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
      transformOrigin: '0px 0px',
    };
  }, [isGlobe, rotation, highlightedStateId, allFeatures, pathGenerator, projection, width, height, autoZoom]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`h-full max-h-[600px] w-full outline-none bg-[var(--ocean-bg)] overflow-hidden rounded-2xl ${isGlobe ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
      >
        <defs>
          <pattern id="ocean-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className="fill-black dark:fill-white opacity-10" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#ocean-dots)" />

        {/* Dynamic Zooming Group Wrapper */}
        <g style={focusTransformStyle} className="will-change-transform">
          {isGlobe && (
            <g className="pointer-events-none">
              <path
                d={pathGenerator({ type: 'Sphere' } as d3.GeoPermissibleObjects) || ''}
                fill="var(--ocean-bg)"
                stroke="var(--map-stroke)"
                strokeWidth={0.75}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={pathGenerator(d3.geoGraticule10() as d3.GeoPermissibleObjects) || ''}
                fill="none"
                stroke="var(--map-stroke)"
                strokeOpacity={0.35}
                strokeWidth={0.4}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
          {allFeatures.map((feat: Feature, i: number) => {
            const stateId = String(feat.id);
            const stateName = (feat.properties as { name: string }).name || "";
            const isQuizRegion = validNames.some(vn => normalizeString(vn) === normalizeString(stateName));

            if (showOnlyValid && !isQuizRegion) return null;

            const isHighlighted = highlightedStateId === stateId;
            const isCorrect = correctlyGuessedIds.includes(stateId);
            const pathData = pathGenerator(feat as unknown as d3.GeoPermissibleObjects);

            if (!pathData) return null;

            let fillColor = "var(--map-fill)"; 
            if (isCorrect) fillColor = "var(--color-primary)"; 
            
            // Apply highlight if not in noMapHints mode
            if (!noMapHints && isHighlighted && gameMode !== 'capital') {
              fillColor = "var(--color-map-highlight)";
            }

            // Skipping intentionally does not flash/highlight the skipped
            // region here — that would reveal its location as the answer.
            const isIncorrect = lastGuessCorrect === false && isHighlighted;
            const animationClass = isIncorrect ? 'animate-flash' : '';

            // Neighboring correctly-guessed regions share the same solid
            // fill color, so the default thin gray stroke (tuned for
            // contrast against the plain map background) all but
            // disappears between them — use a higher-contrast, thicker
            // stroke specifically on correct fills so borders stay visible.
            const strokeColor = hideBorders ? "transparent" : (isCorrect ? "white" : "var(--map-stroke)");
            const strokeW = isCorrect ? 1 : 0.5;

            return (
              <path
                key={stateId || i}
                d={pathData}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW}
                vectorEffect="non-scaling-stroke"
                className={`transition-colors duration-300 outline-none focus-visible:stroke-[var(--color-map-highlight)] focus-visible:stroke-[2] ${animationClass} ${onRegionClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRegionClick?.(stateId, stateName)}
                {...(onRegionClick ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  'aria-label': getLabel(stateName),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRegionClick(stateId, stateName);
                    }
                  },
                } : {})}
              >
                {showLabels && <title>{getLabel(stateName)}</title>}
              </path>
            );
          })}

          {showLabels && (
            <g className="pointer-events-none select-none">
              {allFeatures.map((feat: Feature) => {
                const stateName = (feat.properties as { name: string }).name || "";
                const isQuizRegion = validNames.some(vn => normalizeString(vn) === normalizeString(stateName));
                if (!isQuizRegion) return null;

                if (isGlobe) {
                  const [glng, glat] = d3.geoCentroid(feat as unknown as d3.GeoPermissibleObjects);
                  if (!isNaN(glng) && isOnFarSide(glng, glat, rotation)) return null;
                }

                const bounds = getFocusBounds(pathGenerator, feat);
                const centroid = pathGenerator.centroid(feat as unknown as d3.GeoPermissibleObjects);
                if (!centroid || isNaN(centroid[0]) || !bounds) return null;

                // Scale label size to the region's own footprint so small
                // countries get small text and large ones get readable text,
                // instead of one fixed size that's illegible for most of a
                // large dataset (World Countries has ~200 entries).
                const [[x0, y0], [x1, y1]] = bounds;
                const size = Math.max(x1 - x0, y1 - y0);
                const fontSize = Math.max(3, Math.min(11, size * 0.18));

                return (
                  <text
                    key={`label-${String(feat.id)}`}
                    x={centroid[0]}
                    y={centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    className="fill-[var(--foreground)] font-game-mono"
                    style={{ paintOrder: 'stroke', stroke: 'var(--background)', strokeWidth: fontSize * 0.3, strokeLinejoin: 'round' }}
                  >
                    {getLabel(stateName)}
                  </text>
                );
              })}
            </g>
          )}

          {gameMode === 'capital' && highlightedStateId && (
            <g>
              {allFeatures.map((feat: Feature) => {
                const stateId = String(feat.id);
                if (stateId !== highlightedStateId) return null;

                const stateName = (feat.properties as { name: string }).name || "";
                const capitalName = capitalMap[stateName];
                let coords: [number, number] | null = null;
                
                if (capitalName && capitalCoordinates[capitalName] && typeof projection === 'function') {
                  const rawCoords = capitalCoordinates[capitalName];
                  if (isGlobe && isOnFarSide(rawCoords[0], rawCoords[1], rotation)) return null;
                  const projected = projection(rawCoords);
                  if (projected) coords = projected as [number, number];
                }

                if (!coords) {
                  coords = pathGenerator.centroid(feat as unknown as d3.GeoPermissibleObjects) as [number, number];
                }

                if (!coords || isNaN(coords[0])) return null;

                return (
                  <g key={`pin-${stateId}`}>
                    <circle cx={coords[0]} cy={coords[1]} r={14} fill="none" stroke="var(--color-map-highlight)" strokeWidth={2} className="animate-ping" style={{ transformOrigin: `${coords[0]}px ${coords[1]}px` }} />
                    <circle cx={coords[0]} cy={coords[1]} r={6} fill="var(--color-map-highlight)" stroke="white" strokeWidth={3} className="drop-shadow-lg" />
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
