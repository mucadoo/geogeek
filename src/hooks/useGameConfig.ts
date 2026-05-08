import { useQuery } from '@tanstack/react-query';

export const useGameConfig = () => {
  return useQuery({
    queryKey: ['game-config'],
    queryFn: async () => {
      const response = await fetch('/data/game-configs.json');
      if (!response.ok) throw new Error('Failed to fetch game configuration');
      return response.json();
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
};
