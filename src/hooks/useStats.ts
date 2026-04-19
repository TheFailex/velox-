import { useQuery } from '@tanstack/react-query';
import { tripsService } from '@/services/supabase';
import type { Trip, UserStats } from '@/types';

export function useStats(vehicleFilter?: string) {
  const { data: trips = [], isLoading, isError, refetch } = useQuery<Trip[]>({
    queryKey: ['trips', 'all'],
    queryFn: () => tripsService.list(1000) as Promise<Trip[]>,
    retry: 1,
  });

  // Trips filtered by vehicle (make + model string like "Ford Focus")
  const filteredTrips = vehicleFilter
    ? trips.filter((t) => {
        const label = [t.vehicle_make, t.vehicle_model].filter(Boolean).join(' ');
        return label === vehicleFilter;
      })
    : trips;

  // Unique vehicle labels across all trips (for the filter picker)
  const vehicleOptions: string[] = Array.from(
    new Set(
      trips
        .map((t) => [t.vehicle_make, t.vehicle_model].filter(Boolean).join(' '))
        .filter((v) => v.trim().length > 0)
    )
  );

  const stats: UserStats = {
    totalTrips: filteredTrips.length,
    totalDistanceKm: filteredTrips.reduce((s, t) => s + t.distance_km, 0),
    totalDurationSeconds: filteredTrips.reduce((s, t) => s + t.duration_seconds, 0),
    topSpeedKmh: filteredTrips.reduce((max, t) => Math.max(max, t.top_speed_kmh), 0),
    avgDrivingScore:
      filteredTrips.length > 0
        ? Math.round(filteredTrips.reduce((s, t) => s + t.driving_score, 0) / filteredTrips.length)
        : 0,
    // Extended aggregates
    totalLeftTurns: filteredTrips.reduce((s, t) => s + (t.left_turns ?? 0), 0),
    totalRightTurns: filteredTrips.reduce((s, t) => s + (t.right_turns ?? 0), 0),
    totalBrakeEvents: filteredTrips.reduce((s, t) => s + (t.brake_events ?? 0), 0),
    totalStops: filteredTrips.reduce((s, t) => s + (t.total_stops ?? 0), 0),
    peakGForce: filteredTrips.reduce((max, t) => Math.max(max, t.peak_g_force ?? 0), 0),
    maxDecelerationMs2: filteredTrips.reduce((max, t) => Math.max(max, t.max_deceleration_ms2 ?? 0), 0),
    maxAccelerationMs2: filteredTrips.reduce((max, t) => Math.max(max, t.max_acceleration_ms2 ?? 0), 0),
    topCornerSpeedKmh: filteredTrips.reduce((max, t) => Math.max(max, t.top_corner_speed_kmh ?? 0), 0),
    best0to100Seconds: filteredTrips.reduce<number | null>((best, t) => {
      const v = t.best_0_100_seconds ?? null;
      if (v === null) return best;
      if (best === null) return v;
      return Math.min(best, v);
    }, null),
    avgTripLengthKm:
      filteredTrips.length > 0
        ? filteredTrips.reduce((s, t) => s + t.distance_km, 0) / filteredTrips.length
        : 0,
  };

  return { stats, trips, filteredTrips, vehicleOptions, isLoading, isError, refetch };
}
