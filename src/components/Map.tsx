'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import * as d3 from 'd3';
import { useMapStore } from '@/store/useMapStore';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import MapPolygons from './MapPolygons';

export default function Map() {
  const { data: mapData, status } = useWorldMapData();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  
  const { 
    position, 
    selectedContinent, tooltip, setTooltip,
    resetMap
  } = useMapStore();

  const width = 800;
  const height = 450;

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 2 + 50]);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initial position or when store position changes (e.g. from continent click)
    // We need to convert [lng, lat] to [x, y] and then to D3 transform
    const [lng, lat] = position.coordinates;
    const [x, y] = projection([lng, lat]) || [width / 2, height / 2];
    
    svg.transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(position.zoom)
          .translate(-x, -y)
      );

  }, [position, projection]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="relative w-full h-[650px] flex items-center justify-center bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
    >
      {status === 'pending' && (
        <div className="absolute flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-gray-500 font-medium">Loading World Map...</p>
        </div>
      )}

      {status === 'success' && (
        <React.Fragment>
          <div
            className="fixed z-50 px-5 py-2.5 bg-white text-gray-800 font-semibold text-sm rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-[120%] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-opacity duration-150 border border-gray-100 whitespace-nowrap"
            style={{ left: tooltip.x, top: tooltip.y, opacity: tooltip.show ? 1 : 0 }}
          >
            {tooltip.content}
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full outline-none"
          >
            <g ref={gRef}>
              <MapPolygons mapData={mapData} projection={projection} />
            </g>
          </svg>

          {selectedContinent && (
            <button
              onClick={resetMap}
              title="Return to World"
              className="absolute top-6 left-6 animate-in fade-in slide-in-from-left-4 duration-500 shadow-xl p-2 bg-white rounded-full hover:scale-105 transition-all group cursor-pointer"
            >
              <Image 
                src="/media/back_icon.svg" 
                alt="Return to World" 
                width={32} 
                height={32} 
                className="group-hover:invert-[0.3] sepia-[1] hue-rotate-[180deg] saturate-[3] transition-all"
              />
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
