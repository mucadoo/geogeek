'use client';

import * as d3 from 'd3';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';

import { Country } from '@/types';
import MapPolygons from './MapPolygons';
import MapSidebar from './MapSidebar';

import { getCountryByIsoAction } from '@/app/actions';
import { CONTINENT_VIEWS, NUMERIC_TO_ALPHA2, NUMERIC_TO_CONTINENT } from '@/config/mapConstants';
import { useCountrySubMap } from '@/hooks/useRegionMapData';
import { useWorldMapData } from '@/hooks/useWorldMapData';
import { getLocalizedValue } from '@/lib/i18n-utils';
import { useMapStore } from '@/store/useMapStore';

interface MapProps {
  slug?: string;
}

// Linear interpolator prevents the "swoop out" effect and flies directly to the target zoom
const linearZoomInterpolator = (a: d3.ZoomView, b: d3.ZoomView) => {
  const x = d3.interpolateNumber(a[0], b[0]);
  const y = d3.interpolateNumber(a[1], b[1]);
  const k = d3.interpolateNumber(a[2], b[2]);
  return (t: number) => [x(t), y(t), k(t)] as d3.ZoomView;
};

export default function Map({ slug }: MapProps) {
  const t = useTranslations('Map');
  const locale = useLocale();
  const router = useRouter();
  const { data: mapData, status } = useWorldMapData();
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [activeCountry, setActiveCountry] = useState<Country | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const slugParts = Array.isArray(slug) ? slug : (slug ? slug.split('/') : []);
  
  const ALPHA2_TO_NUMERIC = useMemo(() => {
    return Object.fromEntries(
      Object.entries(NUMERIC_TO_ALPHA2).map(([num, alpha]) => [alpha.toUpperCase(), num])
    );
  },[]);

  const { 
    position, selectedContinent, tooltip, setTooltip,
    exploreMode, setExploreMode, resetMap, handleContinentClick
  } = useMapStore();

  const { data: subMapData } = useCountrySubMap(activeCountry?.isoCode || null);
  
  const isSubMap = !!(activeCountry && subMapData);
  const renderMapData = isSubMap ? subMapData : mapData;

  const handleBackClick = () => {
    if (activeRegion) {
      router.push(`/map/${slugParts[0]}`);
    } else if (activeCountry?.isoCode) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const continent = NUMERIC_TO_CONTINENT[numericId];
      if (continent) {
        const continentSlug = continent.toLowerCase().replace(/\s+/g, '-');
        router.push('/map/' + continentSlug);
      } else {
        router.push('/map');
      }
    } else if (selectedContinent) {
      router.push('/map');
    }
  };

  const width = 800;
  const height = 450;

  const projection = useMemo(() => {
    return d3.geoMercator().scale(120).translate([width / 2, height / 2 + 50]);
  },[]);

  const targetIso = activeCountry?.isoCode?.toLowerCase() || (slugParts.length === 1 && slugParts[0].length === 2 ? slugParts[0].toLowerCase() : undefined);

  useEffect(() => {
    async function initView() {
      if (slugParts.length === 0) {
        resetMap();
        setActiveCountry(null);
        setActiveRegion(null);
        return;
      }

      const firstPart = slugParts[0];
      const secondPart = slugParts[1];

      // Handle Continent
      const continentName = firstPart.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const view = CONTINENT_VIEWS[continentName as keyof typeof CONTINENT_VIEWS];
      
      if (view) {
        handleContinentClick(continentName, view);
        setActiveCountry(null);
        setActiveRegion(null);
        return;
      }

      // Handle Country
      if (firstPart.length === 2) {
        const country = await getCountryByIsoAction(firstPart.toUpperCase());
        if (country) {
          setActiveCountry(country);
          setActiveRegion(secondPart || null);
        }
      }
    }
    initView();
  }, [slug, handleContinentClick, resetMap]);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const isInitialized = !!svg.property('__zoom');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .touchable(true)
      .interpolate(linearZoomInterpolator)
      .on('start', () => {
        svg.attr('shape-rendering', 'optimizeSpeed');
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
      .on('end', () => {
        svg.attr('shape-rendering', 'geometricPrecision');
      });

    svg.call(zoom);
    svg.on('dblclick.zoom', null);

    if (!isInitialized) {
      const [lng, lat] = position.coordinates;
      const [x, y] = projection([lng, lat]) ||[width / 2, height / 2];
      const initialTransform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(position.zoom)
          .translate(-x, -y);
      svg.call(zoom.transform, initialTransform);
    }

    if (activeCountry?.isoCode && mapData) {
      const numericId = ALPHA2_TO_NUMERIC[activeCountry.isoCode.toUpperCase()];
      const world = feature(mapData as any, mapData.objects.countries as any) as any;
      const featureData = world.features.find((f: any) => String(f.id).padStart(3, '0') === numericId);
      
      if (featureData) {
        const path = d3.geoPath().projection(projection);
        const [[x0, y0], [x1, y1]] = path.bounds(featureData);
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        
        const targetWidth = width * 0.6;
        const scale = Math.min(8, 0.8 / Math.max(dx / targetWidth, dy / height));
        const translate =[
          (targetWidth / 2) - scale * x,
          (height / 2) - scale * y
        ];

        svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        return;
      }
    }

    if (isInitialized && !activeCountry) {
      const[lng, lat] = position.coordinates;
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
    }

  },[position, projection, activeCountry, mapData, ALPHA2_TO_NUMERIC]);

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
          
          {/* View Toggles on World Map */}
          {!selectedContinent && !activeCountry && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded-full border border-gray-100 bg-white/90 p-1.5 shadow-xl backdrop-blur-md">
              <button 
                onClick={() => setExploreMode('continent')}
                className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${exploreMode === 'continent' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                Continents
              </button>
              <button 
                onClick={() => setExploreMode('country')}
                className={`rounded-full px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all ${exploreMode === 'country' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-primary'}`}
              >
                Countries
              </button>
            </div>
          )}

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
            <g ref={gRef} className="will-change-transform">
              {renderMapData && (
                <MapPolygons 
                  mapData={renderMapData} 
                  projection={projection} 
                  activeCountryIso={targetIso} 
                  isSubMap={isSubMap} 
                />
              )}
              {(activeCountry as any)?.capitalCoordinates && (
                <g>
                  <circle 
                    cx={projection((activeCountry as any).capitalCoordinates)?.[0]} 
                    cy={projection((activeCountry as any).capitalCoordinates)?.[1]} 
                    r={4} 
                    fill="var(--primary)" 
                    stroke="white" 
                    strokeWidth={1} 
                  />
                  <text 
                    x={(projection((activeCountry as any).capitalCoordinates)?.[0] || 0) + 8} 
                    y={(projection((activeCountry as any).capitalCoordinates)?.[1] || 0) + 4} 
                    className="font-game-mono text-xs fill-[var(--foreground)]"
                  >
                    {getLocalizedValue((activeCountry as any).capital, locale)}
                  </text>
                </g>
              )}
            </g>
          </svg>

          {(selectedContinent || activeCountry) && (
            <button
              onClick={handleBackClick}
              title={activeCountry ? t('returnToContinent') : t('returnToWorld')}
              className="animate-in fade-in slide-in-from-left-4 group absolute top-24 left-6 z-20 cursor-pointer rounded-full bg-white p-3 shadow-xl transition-all duration-500 hover:scale-105 pointer-events-auto md:left-10"
            >
              <Image 
                src="/media/back_icon.svg" 
                alt={activeCountry ? t('returnToContinent') : t('returnToWorld')} 
                width={32} 
                height={32} 
                className="hue-rotate-[180deg] saturate-[3] sepia-[1] transition-all group-hover:invert-[0.3]"
              />
            </button>
          )}

          {activeCountry && (
            <MapSidebar type="country" title={getLocalizedValue(activeCountry.name, locale)} data={activeCountry} />
          )}
        </React.Fragment>
      )}
    </div>
  );
}
