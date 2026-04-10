import { useState, useEffect, useCallback } from 'react';
import { useTripStore } from '@/store/tripStore';
import { locationService } from '@/services/location';
import { tripsService, supabase } from '@/services/supabase';
import { totalDistanceKm } from '@/utils/distance';
import { scoreDrive } from '@/utils/scoring';

export interface LiveStats {
  speed: number;      // current km/h (last GPS point)
  distance: number;   // km
  duration: number;   // seconds
  topSpeed: number;   // km/h
  avgSpeed: number;   // km/h
  altitude: number;   // meters above sea level
}

const EMPTY_STATS: LiveStats = {
  speed: 0,
  distance: 0,
  duration: 0,
  topSpeed: 0,
  avgSpeed: 0,
  altitude: 0,
};

export function useTrip() {
  const { isTracking, gpsPoints, setTracking, resetTrip } = useTripStore();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // 1-second elapsed timer
  useEffect(() => {
    if (!isTracking || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const liveStats: LiveStats =
    gpsPoints.length === 0
      ? { ...EMPTY_STATS, duration: elapsed }
      : {
          speed: gpsPoints[gpsPoints.length - 1].speed,
          distance: totalDistanceKm(gpsPoints),
          duration: elapsed,
          topSpeed: gpsPoints.reduce((max, p) => Math.max(max, p.speed), 0),
          avgSpeed: gpsPoints.reduce((sum, p) => sum + p.speed, 0) / gpsPoints.length,
          altitude: gpsPoints[gpsPoints.length - 1].altitude,
        };

  const startTrip = useCallback(async () => {
    const granted = await locationService.requestPermissions();
    if (!granted) return;
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setTracking(true);
    await locationService.startTracking();
  }, [setTracking]);

  const stopTrip = useCallback(async () => {
    setTracking(false);
    await locationService.stopTracking();

    if (gpsPoints.length > 1 && startTime) {
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const distance = totalDistanceKm(gpsPoints);
          const duration = Math.floor((Date.now() - startTime) / 1000);
          const topSpeed = gpsPoints.reduce((max, p) => Math.max(max, p.speed), 0);
          const avgSpeed = gpsPoints.reduce((sum, p) => sum + p.speed, 0) / gpsPoints.length;

          await tripsService.save({
            user_id: user.id,
            started_at: new Date(startTime).toISOString(),
            ended_at: new Date().toISOString(),
            distance_km: distance,
            duration_seconds: duration,
            top_speed_kmh: topSpeed,
            avg_speed_kmh: avgSpeed,
            driving_score: scoreDrive(gpsPoints),
            route: gpsPoints,
          });
        }
      } catch (e) {
        console.error('[Velox] Failed to save trip:', e);
      } finally {
        setIsSaving(false);
      }
    }

    resetTrip();
    setStartTime(null);
    setElapsed(0);
  }, [gpsPoints, startTime, setTracking, resetTrip]);

  return { isTracking, liveStats, startTrip, stopTrip, isSaving };
}
