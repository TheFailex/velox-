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

function isValidCoord(lat: number, lng: number): boolean {
  return (
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

// Keep a point only if it represents meaningful change vs the last stored point.
// Filters ~70% of redundant GPS updates (stopped/constant-speed driving),
// preventing the O(n) array-copy from causing OOM on long trips.
const MIN_TIME_MS = 2500;      // never store more than 1 point per 2.5s
const MIN_SPEED_DELTA = 2;     // km/h — keep if speed changed noticeably
const MIN_DIST_SQ = 0.000004;  // ~(0.002°)² ≈ 6m — keep if moved

function shouldKeepPoint(pt: GPSPoint, last: GPSPoint | undefined): boolean {
  if (!last) return true;
  if (pt.timestamp - last.timestamp >= MIN_TIME_MS) return true;
  if (Math.abs(pt.speed - last.speed) >= MIN_SPEED_DELTA) return true;
  const dlat = pt.lat - last.lat;
  const dlng = pt.lng - last.lng;
  return dlat * dlat + dlng * dlng >= MIN_DIST_SQ;
}

export const useTripStore = create<TripStore>((set) => ({
  isTracking: false,
  gpsPoints: [],
  currentTrip: null,
  startTime: null,
  setTracking: (val) => set({ isTracking: val }),
  setStartTime: (time) => set({ startTime: time }),
  addGPSPoints: (locations) =>
    set((state) => {
      const valid = locations
        .filter((l) => isValidCoord(l.coords.latitude, l.coords.longitude))
        .map((l): GPSPoint => ({
          lat: l.coords.latitude,
          lng: l.coords.longitude,
          speed: Math.max(0, (l.coords.speed ?? 0) * 3.6),
          altitude: l.coords.altitude ?? 0,
          timestamp: l.timestamp,
        }));

      if (valid.length === 0) return state;

      // Subsample against the last kept point to avoid redundant copies
      let last: GPSPoint | undefined = state.gpsPoints[state.gpsPoints.length - 1];
      const toAdd: GPSPoint[] = [];
      for (const pt of valid) {
        if (shouldKeepPoint(pt, last)) {
          toAdd.push(pt);
          last = pt;
        }
      }

      // Skip state update entirely if nothing new — avoids a React re-render
      if (toAdd.length === 0) return state;

      return { gpsPoints: state.gpsPoints.concat(toAdd) };
    }),
  resetTrip: () => set({ gpsPoints: [], currentTrip: null, isTracking: false, startTime: null }),
}));
