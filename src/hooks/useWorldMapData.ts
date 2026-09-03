import { useQuery } from '@tanstack/react-query';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

// A crisper (1:10m) cut of the same world-atlas topology, ~3.6MB. Shares the
// numeric ISO country ids and `properties.name` with the 50m file, so a
// feature can be swapped for its hi-res twin one-for-one. Only fetched once
// the player zooms into a region (see GameMap's detail swap) and cached for
// the rest of the session.
const GEO_URL_DETAIL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json';

const fetchMapData = async () => {
  const response = await fetch(GEO_URL);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const useWorldMapData = () => {
  return useQuery({
    queryKey: ['world-map-data'],
    queryFn: fetchMapData,
    staleTime: Infinity, // Data rarely changes
    gcTime: Infinity, // Keep in cache indefinitely
  });
};

export const useWorldMapDetail = (enabled: boolean) => {
  return useQuery({
    queryKey: ['world-map-data-detail-10m'],
    queryFn: async () => {
      const response = await fetch(GEO_URL_DETAIL);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
