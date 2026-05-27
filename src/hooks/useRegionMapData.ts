// file: src/hooks/useRegionMapData.ts
import { useQuery } from '@tanstack/react-query';

// --- THE NORMALIZER ---
// This cleans the messy external data so your components don't have to.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeTopoJson = (mapData: any) => {
  // 1. Find the object with the most geometries (e.g., target "states" instead of "nation")
  const objectKey = Object.keys(mapData.objects).reduce((a, b) => 
    mapData.objects[a].geometries.length > mapData.objects[b].geometries.length ? a : b
  );
  const geometries = mapData.objects[objectKey].geometries;

  // 2. Loop through and standardize every region
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometries.forEach((geo: any) => {
    const props = geo.properties || {};
    
    // Find the name wherever it might be hiding
    const standardizedName = 
      props.name || 
      props.Name || 
      props.NAME || 
      props['woe-name'] || 
      props['hc-a2'] || 
      "Unknown";

    // Force the standard name and ID
    geo.properties.name = standardizedName;
    geo.id = geo.id ? String(geo.id) : standardizedName;
  });

  // 3. Rename the root object to a standard name: "regions"
  // This means GameMap NEVER has to guess the objectName again!
  if (objectKey !== "regions") {
    mapData.objects["regions"] = mapData.objects[objectKey];
    delete mapData.objects[objectKey];
  }

  return mapData;
};

const fetchAndNormalizeMapData = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  const rawData = await response.json();
  
  return normalizeTopoJson(rawData);
};

// --- THE HOOKS ---
export const useUSMapData = () => {
  return useQuery({
    queryKey: ['us-map-data'],
    queryFn: () => fetchAndNormalizeMapData('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useBrazilMapData = () => {
  return useQuery({
    queryKey:['brazil-map-data'],
    // Switched to Highcharts for consistency!
    queryFn: () => fetchAndNormalizeMapData('https://code.highcharts.com/mapdata/countries/br/br-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useItalyMapData = () => {
  return useQuery({
    queryKey: ['italy-map-data'],
    queryFn: () => fetchAndNormalizeMapData('https://code.highcharts.com/mapdata/countries/it/it-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useFranceMapData = () => {
  return useQuery({
    queryKey: ['france-map-data'],
    queryFn: () => fetchAndNormalizeMapData('https://code.highcharts.com/mapdata/countries/fr/fr-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useCanadaMapData = () => {
  return useQuery({
    queryKey: ['canada-map-data'],
    queryFn: () => fetchAndNormalizeMapData('https://code.highcharts.com/mapdata/countries/ca/ca-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useAustraliaMapData = () => {
  return useQuery({
    queryKey:['australia-map-data'],
    queryFn: () => fetchAndNormalizeMapData('https://code.highcharts.com/mapdata/countries/au/au-all.topo.json'),
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useCountrySubMap = (isoCode: string | null) => {
  return useQuery({
    queryKey: ['sub-map', isoCode],
    queryFn: async () => {
      if (!isoCode) return null;
      let url = '';
      switch (isoCode.toLowerCase()) {
        case 'us': url = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'; break;
        case 'br': url = 'https://code.highcharts.com/mapdata/countries/br/br-all.topo.json'; break;
        case 'it': url = 'https://code.highcharts.com/mapdata/countries/it/it-all.topo.json'; break;
        case 'fr': url = 'https://code.highcharts.com/mapdata/countries/fr/fr-all.topo.json'; break;
        case 'ca': url = 'https://code.highcharts.com/mapdata/countries/ca/ca-all.topo.json'; break;
        case 'au': url = 'https://code.highcharts.com/mapdata/countries/au/au-all.topo.json'; break;
        default: return null;
      }
      return await fetchAndNormalizeMapData(url);
    },
    enabled: !!isoCode,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
