import { create } from 'zustand';
import type { GPSPoint, Trip } from '@/types';
import type { LocationObject } from 'expo-location';

interface TripStore {
  isTracking: boolean;
  gpsPoints: GPSPoint[];
  currentTrip: Partial<Trip> | null;
  startTime: number | null;
  setTracking: (val: boolean) => void;
  setStartTime: (time: number | null) => void;
  addGPSPoints: (locations: LocationObject[]) => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripStore>((set) => ({
  isTracking: false,
  gpsPoints: [],
  currentTrip: null,
  startTime: null,
  setTracking: (val) => set({ isTracking: val }),
  setStartTime: (time) => set({ startTime: time }),
  addGPSPoints: (locations) =>
    set((state) => ({
      gpsPoints: [
        ...state.gpsPoints,
        ...locations.map((l) => ({
          lat: l.coords.latitude,
          lng: l.coords.longitude,
          speed: Math.max(0, (l.coords.speed ?? 0) * 3.6), // m/s → km/h
          altitude: l.coords.altitude ?? 0,
          timestamp: l.timestamp,
        })),
      ],
    })),
  resetTrip: () => set({ gpsPoints: [], currentTrip: null, isTracking: false, startTime: null }),
}));
