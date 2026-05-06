import { useQuery } from '@tanstack/react-query';

const BRAZIL_GEO_URL = 'https://raw.githubusercontent.com/luizpedone/brazil-topojson/master/brazil-states.json';

const fetchBrazilMapData = async () => {
  const response = await fetch(BRAZIL_GEO_URL);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const useBrazilMapData = () => {
  return useQuery({
    queryKey: ['brazil-map-data'],
    queryFn: fetchBrazilMapData,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
