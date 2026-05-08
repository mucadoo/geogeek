'use client';

import * as d3 from 'd3';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { feature } from 'topojson-client';

import MapPolygons from './MapPolygons';
import MapSidebar from './MapSidebar';

import { useWorldMapData } from '@/hooks/useWorldMapData';
import { useMapStore } from '@/store/useMapStore';
import { CONTINENT_VIEWS } from '@/config/mapConstants';
import { countryService } from '@/lib/countryService';

interface MapProps {
  slug?: string;
}

export default function Map({ slug }: MapProps) {
  const t = useTranslations('Map');
  const router = useRouter();
  const { data: mapData, status } = useWorldMapData();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [activeCountry, setActiveCountry] = useState<any>(null);
  
  const { 
    position, 
    selectedContinent, tooltip, setTooltip,
    resetMap, handleContinentClick
  } = useMapStore();

  const width = 800;
  const height = 450;

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 2 + 50]);
  }, []);

  // Sync URL slug with Store on mount
  useEffect(() => {
    async function initView() {
      if (!slug) {
        resetMap();
        setActiveCountry(null);
        return;
      }

      const continentName = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      // Try as continent
      const view = CONTINENT_VIEWS[continentName as keyof typeof CONTINENT_VIEWS];
      if (view) {
        handleContinentClick(continentName, view);
        setActiveCountry(null);
        return;
      }

      // Try as country
      const country = await countryService.getCountryByIso(slug.toUpperCase());
      if (country) {
        setActiveCountry(country);
        // Zooming logic will be triggered by re-rendering with new country state
      }
    }
    initView();
  }, [slug, handleContinentClick, resetMap]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .touchable(true)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    // If a country is active, focus on it
    if (activeCountry && mapData) {
      // Convert TopoJSON to GeoJSON
      const world = feature(mapData as any, mapData.objects.countries as any) as any;
      const featureData = world.features.find((f: any) => f.id === activeCountry.ISO_code);
      
      if (featureData) {
        const path = d3.geoPath().projection(projection);
        const [[x0, y0], [x1, y1]] = path.bounds(featureData);
        
        // Offset centering to the left 60%
        const centerX = width * 0.3; 
        const centerY = height / 2;
        const scale = Math.min(8, 0.7 / Math.max((x1 - x0) / width, (y1 - y0) / height));
        const translate = [centerX - scale * (x0 + x1) / 2, centerY - scale * (y0 + y1) / 2];

        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        return;
      }
    }

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

  }, [position, projection, activeCountry, mapData]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="absolute inset-0 h-full w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
    >
      {status === 'pending' && (
        <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center gap-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="font-medium text-gray-500">{t('loading')}</p>
        </div>
      )}

      {status === 'success' && (
        <React.Fragment>
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[120%] transform rounded-full border border-gray-100 bg-white/95 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-gray-800 shadow-xl backdrop-blur transition-opacity duration-150"
            style={{ left: tooltip.x, top: tooltip.y, opacity: tooltip.show ? 1 : 0 }}
          >
            {tooltip.content}
          </div>

          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full outline-none cursor-grab active:cursor-grabbing touch-none"
          >
            <g ref={gRef}>
              <MapPolygons mapData={mapData} projection={projection} />
            </g>
          </svg>

          {(selectedContinent || activeCountry) && (
            <button
              onClick={() => router.push('/map')}
              title={t('returnToWorld')}
              className="animate-in fade-in slide-in-from-left-4 group absolute top-24 left-6 z-20 cursor-pointer rounded-full bg-white p-3 shadow-xl transition-all duration-500 hover:scale-105 pointer-events-auto md:left-10"
            >
              <Image 
                src="/media/back_icon.svg" 
                alt={t('returnToWorld')} 
                width={32} 
                height={32} 
                className="hue-rotate-[180deg] saturate-[3] sepia-[1] transition-all group-hover:invert-[0.3]"
              />
            </button>
          )}

          {activeCountry && (
            <MapSidebar type="country" title={activeCountry.name} data={activeCountry} />
          )}
        </React.Fragment>
      )}
    </div>
  );
}
