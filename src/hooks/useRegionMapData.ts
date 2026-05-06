import { useQuery } from '@tanstack/react-query';

const fetchMapData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const useUSMapData = () => {
  return useQuery({
    queryKey: ['us-map-data'],
    queryFn: () => fetchMapData('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useBrazilMapData = () => {
  return useQuery({
    queryKey: ['brazil-map-data'],
    queryFn: () => fetchMapData('https://raw.githubusercontent.com/fititnt/gis-dataset-brasil/master/uf/topojson/uf.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useItalyMapData = () => {
  return useQuery({
    queryKey: ['italy-map-data'],
    queryFn: () => fetchMapData('https://code.highcharts.com/mapdata/countries/it/it-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useFranceMapData = () => {
  return useQuery({
    queryKey: ['france-map-data'],
    queryFn: () => fetchMapData('https://code.highcharts.com/mapdata/countries/fr/fr-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useCanadaMapData = () => {
  return useQuery({
    queryKey: ['canada-map-data'],
    queryFn: () => fetchMapData('https://code.highcharts.com/mapdata/countries/ca/ca-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useAustraliaMapData = () => {
  return useQuery({
    queryKey: ['australia-map-data'],
    queryFn: () => fetchMapData('https://code.highcharts.com/mapdata/countries/au/au-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
