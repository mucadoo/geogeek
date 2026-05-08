import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Tooltip {
  show: boolean;
  content: string;
  x: number;
  y: number;
}

interface MapPosition {
  coordinates: [number, number];
  zoom: number;
}

interface MapState {
  position: MapPosition;
  selectedContinent: string | null;
  hoveredContinent: string | null;
  hoveredCountry: string | null;
  tooltip: Tooltip;
  exploreMode: 'continent' | 'country';
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setPosition: (position: MapPosition) => void;
  setSelectedContinent: (continent: string | null) => void;
  setHoveredContinent: (continent: string | null) => void;
  setHoveredCountry: (country: string | null) => void;
  setTooltip: (tooltip: Tooltip) => void;
  setExploreMode: (mode: 'continent' | 'country') => void;
  handleContinentClick: (name: string, view: MapPosition) => void;
  resetMap: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      position: { coordinates: [0, 20], zoom: 1 },
      selectedContinent: null,
      hoveredContinent: null,
      hoveredCountry: null,
      tooltip: { show: false, content: '', x: 0, y: 0 },
      exploreMode: 'continent',
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setPosition: (position) => set({ position }),
      setSelectedContinent: (selectedContinent) => set({ selectedContinent }),
      setHoveredContinent: (hoveredContinent) => set({ hoveredContinent }),
      setHoveredCountry: (hoveredCountry) => set({ hoveredCountry }),
      setTooltip: (tooltip) => set({ tooltip }),
      setExploreMode: (mode) => set({ exploreMode: mode }),

      handleContinentClick: (name, view) =>
        set({
          selectedContinent: name,
          position: view,
          hoveredContinent: null,
          hoveredCountry: null,
        }),

      resetMap: () =>
        set((state) => ({
          selectedContinent: null,
          position: { coordinates: [0, 20], zoom: 1 },
          hoveredContinent: null,
          hoveredCountry: null,
          tooltip: { ...state.tooltip, show: false },
        })),
    }),
    {
      name: 'map-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        position: state.position,
        selectedContinent: state.selectedContinent,
        exploreMode: state.exploreMode,
      }),
    }
  )
);
