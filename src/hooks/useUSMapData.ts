import { useQuery } from '@tanstack/react-query';

const US_GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const fetchUSMapData = async () => {
  const response = await fetch(US_GEO_URL);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const useUSMapData = () => {
  return useQuery({
    queryKey: ['us-map-data'],
    queryFn: fetchUSMapData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
