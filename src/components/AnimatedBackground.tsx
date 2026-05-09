'use client';

import * as d3 from 'd3';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { useWorldMapData } from '@/hooks/useWorldMapData';

// Helper to generate random coordinates on Earth
const randomCoords = (): [number, number] =>[
  (Math.random() - 0.5) * 360, // Longitude: -180 to 180
  (Math.random() - 0.5) * 140, // Latitude: -70 to 70 (keeps it away from the extreme poles)
];

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: mapData } = useWorldMapData();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  
  const isFullscreen = pathname === '/map' || (pathname.startsWith('/games/') && pathname !== '/games');

  useEffect(() => {
    // DO NOT animate if we are on a fullscreen map page!
    if (!mapData || !canvasRef.current || isFullscreen || !resolvedTheme) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base
    if (!context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Mouse tracking for interactive tilt
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates from -1 to 1
      targetMouseX = (e.clientX / width) * 2 - 1;
      targetMouseY = (e.clientY / height) * 2 - 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.scale(dpr, dpr);
    };
    
    setSize();
    window.addEventListener('resize', setSize);

    // Prepare map data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const land = feature(mapData as Topology, mapData.objects.countries as any);
    const graticule = d3.geoGraticule10();

    // Data Streams (Flying arcs) Array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streams: any[] =[];
    const maxStreams = 15; // How many lines flying at once

    const spawnStream = () => {
      const origin = randomCoords();
      const target = randomCoords();
      streams.push({
        origin,
        target,
        interpolate: d3.geoInterpolate(origin, target), // D3 math for curved earth paths
        progress: 0,
        speed: 0.003 + Math.random() * 0.005, // Random flight speeds
      });
    };

    let rotation = 0;
    let animationFrameId: number;

    const isDark = resolvedTheme === 'dark';

    const draw = () => {
      rotation += 0.1; // Base slow spin

      // Smoothly interpolate current mouse to target mouse for silky camera movement
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      const isMobile = width < 768;
      const translateX = isMobile ? width * 0.5 : width * 0.85;
      const translateY = isMobile ? height * 0.2 : height * 0.5;
      const scale = isMobile ? Math.min(width, height) * 0.6 : Math.min(width, height) * 0.7;

      // Apply mouse tilt to the projection
      const tiltX = rotation + currentMouseX * 30; // Spin changes with mouse X
      const tiltY = -15 + currentMouseY * 30;      // Tilt changes with mouse Y

      const projection = d3.geoOrthographic()
        .scale(scale)
        .translate([translateX, translateY])
        .rotate([tiltX, tiltY, 0]);

      const path = d3.geoPath(projection, context);

      // 1. Clear background - matching globals.css variables
      context.fillStyle = isDark ? '#141614' : '#f0f4f2';
      context.fillRect(0, 0, width, height);

      // 2. Draw Sphere Background (Ocean glow)
      context.beginPath();
      path({ type: 'Sphere' } as d3.GeoPermissibleObjects);
      context.fillStyle = isDark ? 'rgba(0, 168, 181, 0.01)' : 'rgba(0, 168, 181, 0.02)';
      context.fill();

      // 3. Draw Graticule (Grid Lines)
      context.beginPath();
      path(graticule as unknown as d3.GeoPermissibleObjects);
      context.strokeStyle = isDark ? 'rgba(0, 168, 181, 0.04)' : 'rgba(0, 168, 181, 0.08)';
      context.lineWidth = 1;
      context.stroke();

      // 4. Draw Landmasses
      context.beginPath();
      path(land as unknown as d3.GeoPermissibleObjects);
      context.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(44, 62, 80, 0.04)'; 
      context.fill();
      context.strokeStyle = isDark ? 'rgba(0, 168, 181, 0.1)' : 'rgba(0, 168, 181, 0.2)'; 
      context.lineWidth = 0.8;
      context.stroke();

      // 5. Draw Flying Data Streams
      streams.forEach((stream, index) => {
        stream.progress += stream.speed;

        if (stream.progress >= 1) {
          streams.splice(index, 1);
          spawnStream();
        } else {
          const currentPos = stream.interpolate(stream.progress);
          
          context.beginPath();
          path({ type: 'LineString', coordinates: [stream.origin, currentPos] } as d3.GeoPermissibleObjects);
          context.strokeStyle = `rgba(0, 168, 181, ${Math.max(0, 1 - stream.progress * 1.5)})`; 
          context.lineWidth = 2;
          context.stroke();

          context.beginPath();
          path({ type: 'Point', coordinates: currentPos } as d3.GeoPermissibleObjects);
          context.fillStyle = '#ffcd42'; 
          context.fill();
          
          context.beginPath();
          path({ type: 'Point', coordinates: currentPos } as d3.GeoPermissibleObjects);
          context.strokeStyle = 'rgba(255, 205, 66, 0.5)';
          context.lineWidth = 4;
          context.stroke();
        }
      });

      if (Math.random() < 0.05 && streams.length < maxStreams) {
        spawnStream();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  },[mapData, resolvedTheme, isFullscreen]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
