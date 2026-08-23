'use client';

import * as d3 from 'd3';
import { Feature, FeatureCollection } from 'geojson';
import React, { useMemo } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { useGameStore } from '@/store/useGameStore';

interface GameMapProps {
  mapData: Topology;
  highlightedStateId: string | null;
  projection: d3.GeoProjection | d3.GeoIdentityTransform;
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
  mapData, highlightedStateId, projection, validNames,
  width = 960, height = 600,
  showOnlyValid = false, gameMode = 'name', capitalMap = {}, capitalCoordinates = {},
  onRegionClick,
  hideBorders = false,
  noMapHints = false,
  showLabels = false,
  getLabel = (name: string) => name,
}: GameMapProps) {
  const { correctlyGuessedIds, lastGuessCorrect, autoZoom } = useGameStore();
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

  // Compute smooth zoom focus transformation style
  const focusTransformStyle = useMemo(() => {
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
  }, [highlightedStateId, allFeatures, pathGenerator, width, height, autoZoom]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full max-h-[600px] w-full outline-none bg-[var(--ocean-bg)] overflow-hidden rounded-2xl">
        <defs>
          <pattern id="ocean-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" className="fill-black dark:fill-white opacity-10" />
          </pattern>
        </defs>
        
        <rect width="100%" height="100%" fill="url(#ocean-dots)" />
        
        {/* Dynamic Zooming Group Wrapper */}
        <g style={focusTransformStyle} className="will-change-transform">
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
                className={`transition-colors duration-300 ${animationClass} ${onRegionClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRegionClick?.(stateId, stateName)}
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
