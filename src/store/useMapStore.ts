import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { GLOBE_SCALE_DEFAULT } from '@/config/mapConstants';

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
  viewMode: 'flat' | 'globe';
  masteryMode: boolean;
  // Live orthographic globe pose. Kept in the store (not component state)
  // because the Explorer's <Map> remounts on every /map ↔ /map/<x> navigation,
  // which would otherwise snap the globe back to its default orientation.
  globeRotation: [number, number];
  globeScale: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setPosition: (position: MapPosition) => void;
  setSelectedContinent: (continent: string | null) => void;
  setHoveredContinent: (continent: string | null) => void;
  setHoveredCountry: (country: string | null) => void;
  setTooltip: (tooltip: Tooltip) => void;
  setExploreMode: (mode: 'continent' | 'country') => void;
  setViewMode: (mode: 'flat' | 'globe') => void;
  setMasteryMode: (enabled: boolean) => void;
  setGlobeRotation: (rotation: [number, number]) => void;
  setGlobeScale: (scale: number) => void;
  handleContinentClick: (name: string, view: MapPosition) => void;
  clearActiveCountry: () => void;
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
      viewMode: 'flat',
      masteryMode: false,
      // orientationFor([10, 25]) — the default "world" globe orientation.
      globeRotation: [-10, -25],
      globeScale: GLOBE_SCALE_DEFAULT,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setPosition: (position) => set({ position }),
      setSelectedContinent: (selectedContinent) => set({ selectedContinent }),
      setHoveredContinent: (hoveredContinent) => set({ hoveredContinent }),
      setHoveredCountry: (hoveredCountry) => set({ hoveredCountry }),
      setTooltip: (tooltip) => set({ tooltip }),
      setExploreMode: (mode) => set({ exploreMode: mode }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setMasteryMode: (masteryMode) => set({ masteryMode }),
      setGlobeRotation: (globeRotation) => set({ globeRotation }),
      setGlobeScale: (globeScale) => set({ globeScale }),

      handleContinentClick: (name, view) =>
        set({
          selectedContinent: name,
          position: view,
          exploreMode: 'continent',
          hoveredContinent: null,
          hoveredCountry: null,
        }),

      clearActiveCountry: () =>
        set({
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
        viewMode: state.viewMode,
      }),
    }
  )
);
