import { useQuery } from '@tanstack/react-query';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

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
