import { useQuery } from '@tanstack/react-query';
import { tripsService } from '@/services/supabase';
import type { Trip, UserStats } from '@/types';

export function useStats() {
  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ['trips', 'all'],
    queryFn: () => tripsService.list(1000) as Promise<Trip[]>,
  });

  const stats: UserStats = {
    totalTrips: trips.length,
    totalDistanceKm: trips.reduce((s, t) => s + t.distance_km, 0),
    totalDurationSeconds: trips.reduce((s, t) => s + t.duration_seconds, 0),
    topSpeedKmh: trips.reduce((max, t) => Math.max(max, t.top_speed_kmh), 0),
    avgDrivingScore:
      trips.length > 0
        ? Math.round(trips.reduce((s, t) => s + t.driving_score, 0) / trips.length)
        : 0,
  };

  return { stats, trips, isLoading };
}
