import { create } from 'zustand';
import type { GPSPoint, Trip } from '@/types';
import type { LocationObject } from 'expo-location';

interface TripStore {
  isTracking: boolean;
  gpsPoints: GPSPoint[];
  currentTrip: Partial<Trip> | null;
  setTracking: (val: boolean) => void;
  addGPSPoints: (locations: LocationObject[]) => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripStore>((set) => ({
  isTracking: false,
  gpsPoints: [],
  currentTrip: null,
  setTracking: (val) => set({ isTracking: val }),
  addGPSPoints: (locations) =>
    set((state) => ({
      gpsPoints: [
        ...state.gpsPoints,
        ...locations.map((l) => ({
          lat: l.coords.latitude,
          lng: l.coords.longitude,
          speed: Math.max(0, (l.coords.speed ?? 0) * 3.6), // m/s → km/h
          timestamp: l.timestamp,
        })),
      ],
    })),
  resetTrip: () => set({ gpsPoints: [], currentTrip: null, isTracking: false }),
}));
