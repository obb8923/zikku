import { create } from 'zustand';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  currentLocation: Coordinates | null;
  setCurrentLocation: (coords: Coordinates) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (coords) => set({ currentLocation: coords }),
}));


