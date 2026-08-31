import { useQuery } from '@tanstack/react-query';
import { Topology } from 'topojson-specification';

// Prebuilt by scripts/build-continent-geometry.mjs. Geometries are country
// (sub)units, each `id` = the sovereign state's ISO 3166-1 alpha-2 code and
// `properties.continent` = the continent it physically sits in. Russia,
// Kazakhstan, Turkey and Egypt appear as two pieces (one per continent).
const GEO_URL = '/data/continents-geometry.topo.json';

const fetchContinentsGeometry = async (): Promise<Topology> => {
  const response = await fetch(GEO_URL);
  if (!response.ok) throw new Error('Failed to load continent geometry');
  return response.json();
};

export const useContinentsGeometry = () => {
  return useQuery({
    queryKey: ['continents-geometry'],
    queryFn: fetchContinentsGeometry,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
