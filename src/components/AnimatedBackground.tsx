'use client';

import * as d3 from 'd3';
import React, { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import { Topology } from 'topojson-specification';

import { useWorldMapData } from '@/hooks/useWorldMapData';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: mapData } = useWorldMapData();

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Handle high-DPI displays (Retina screens) so the globe is crisp
    let width = window.innerWidth;
    let height = window.innerHeight;
    
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
    const graticule = d3.geoGraticule10(); // Creates the lat/lon grid lines

    let rotation = 0;
    let animationFrameId: number;

    const draw = () => {
      rotation += 0.15; // Controls the spin speed

      // Position the globe on the right side for desktop, centered top for mobile
      const isMobile = width < 768;
      const translateX = isMobile ? width * 0.5 : width * 0.85;
      const translateY = isMobile ? height * 0.2 : height * 0.5;
      const scale = isMobile ? Math.min(width, height) * 0.6 : Math.min(width, height) * 0.7;

      const projection = d3.geoOrthographic()
        .scale(scale)
        .translate([translateX, translateY])
        .rotate([rotation, -15, 0]); // Slowly spin on Y axis, tilted slightly up

      const path = d3.geoPath(projection, context);

      // Clear previous frame
      context.clearRect(0, 0, width, height);

      // 1. Draw Graticule (The Grid Lines)
      context.beginPath();
      path(graticule as unknown as d3.GeoPermissibleObjects);
      context.strokeStyle = 'rgba(0, 168, 181, 0.08)'; // Very faint primary color
      context.lineWidth = 1;
      context.stroke();

      // 2. Draw Landmasses
      context.beginPath();
      path(land as unknown as d3.GeoPermissibleObjects);
      context.fillStyle = 'rgba(44, 62, 80, 0.03)'; // Faint foreground color
      context.fill();
      context.strokeStyle = 'rgba(0, 168, 181, 0.2)'; // Brighter primary for borders
      context.lineWidth = 0.8;
      context.stroke();

      // 3. Draw Outer Glow/Atmosphere (optional)
      const sphere = { type: 'Sphere' };
      context.beginPath();
      path(sphere as unknown as d3.GeoPermissibleObjects);
      context.strokeStyle = 'rgba(0, 168, 181, 0.3)';
      context.lineWidth = 2;
      context.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mapData]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
