import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, NativeModules } from 'react-native';
import { useTripStore } from '@/store/tripStore';
import { locationService } from '@/services/location';
import { tripsService, profilesService, supabase } from '@/services/supabase';
import { totalDistanceKm } from '@/utils/distance';
import { scoreDrive } from '@/utils/scoring';
import { computeTripMetrics } from '@/utils/tripMetrics';
import type { VehicleEntry } from '@/types';
import {
  requestNotificationPermission,
  setupNotifications,
} from '@/services/notifications';

export interface LiveStats {
  speed: number;
  distance: number;
  duration: number;
  topSpeed: number;
  avgSpeed: number;
  altitude: number;
}

const EMPTY_STATS: LiveStats = {
  speed: 0, distance: 0, duration: 0, topSpeed: 0, avgSpeed: 0, altitude: 0,
};

const DEFAULT_METRICS = {
  leftTurns: 0, rightTurns: 0, brakeEvents: 0, totalStops: 0,
  maxDecelerationMs2: 0, maxAccelerationMs2: 0, peakGForce: 0,
  topCornerSpeedKmh: 0, best0to100Seconds: null as number | null,
};

export function useTrip() {
  const { isTracking, gpsPoints, startTime, setTracking, setStartTime, resetTrip } = useTripStore();
  const [elapsed, setElapsed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleEntry | null>(null);

  // selectedVehicleRef — always reflects current selection for async reads
  const selectedVehicleRef = useRef<VehicleEntry | null>(null);
  selectedVehicleRef.current = selectedVehicle;

  // startVehicleRef — captured at trip start; vehicle shown on the saved trip
  const startVehicleRef = useRef<VehicleEntry | null>(null);

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
          speed:    gpsPoints[gpsPoints.length - 1].speed,
          distance: totalDistanceKm(gpsPoints),
          duration: elapsed,
          topSpeed: gpsPoints.reduce((max, p) => Math.max(max, p.speed), 0),
          avgSpeed: gpsPoints.length > 0
            ? gpsPoints.reduce((sum, p) => sum + p.speed, 0) / gpsPoints.length
            : 0,
          altitude: gpsPoints[gpsPoints.length - 1].altitude,
        };

  const startTrip = useCallback(async () => {
    const granted = await locationService.requestPermissions();
    if (!granted) return;
    await setupNotifications();
    await requestNotificationPermission();
    // Capture the selected vehicle NOW — not at stop time
    startVehicleRef.current = selectedVehicleRef.current;
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setTracking(true);
    await locationService.startTracking();
  }, [setTracking, setStartTime]);

  const stopTrip = useCallback(async () => {
    // Snapshot GPS points immediately — background task may still be writing
    const gpsCopy = [...gpsPoints];
    const tripStartTime = startTime;

    setTracking(false);
    await locationService.stopTracking();
    NativeModules.TripNotification?.dismiss();

    if (gpsCopy.length > 1 && tripStartTime) {
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const distance = totalDistanceKm(gpsCopy);
          const duration = Math.floor((Date.now() - tripStartTime) / 1000);
          const topSpeed = gpsCopy.reduce((max, p) => Math.max(max, p.speed), 0);
          const avgSpeed = gpsCopy.length > 0
            ? gpsCopy.reduce((sum, p) => sum + p.speed, 0) / gpsCopy.length
            : 0;

          // Compute metrics with fallback — never let a metric error kill the save
          let metrics = DEFAULT_METRICS;
          try {
            metrics = computeTripMetrics(gpsCopy);
          } catch (metricsErr) {
            console.error('[Velox] Metric computation failed, using defaults:', metricsErr);
          }

          // Vehicle: use vehicle captured at trip START
          let vehicleMake: string | null = null;
          let vehicleModel: string | null = null;
          let vehicleType: string | null = null;
          let country: string | null = null;
          const sv = startVehicleRef.current;
          try {
            const profile = await profilesService.get();
            country = profile?.country ?? null;
            if (sv) {
              vehicleMake = sv.make;
              vehicleModel = sv.model;
              vehicleType = sv.type;
            } else {
              vehicleMake = profile?.vehicle_make ?? null;
              vehicleModel = profile?.vehicle_model ?? null;
              vehicleType = profile?.vehicle_type ?? null;
            }
          } catch {
            if (sv) {
              vehicleMake = sv.make;
              vehicleModel = sv.model;
              vehicleType = sv.type;
            }
          }

          await tripsService.save({
            user_id: user.id,
            started_at: new Date(tripStartTime).toISOString(),
            ended_at: new Date().toISOString(),
            distance_km: distance,
            duration_seconds: duration,
            top_speed_kmh: topSpeed,
            avg_speed_kmh: avgSpeed,
            driving_score: scoreDrive(gpsCopy),
            route: gpsCopy,
            vehicle_make: vehicleMake,
            vehicle_model: vehicleModel,
            vehicle_type: vehicleType,
            country,
            left_turns: metrics.leftTurns,
            right_turns: metrics.rightTurns,
            brake_events: metrics.brakeEvents,
            total_stops: metrics.totalStops,
            max_deceleration_ms2: metrics.maxDecelerationMs2,
            max_acceleration_ms2: metrics.maxAccelerationMs2,
            peak_g_force: metrics.peakGForce,
            top_corner_speed_kmh: metrics.topCornerSpeedKmh,
            best_0_100_seconds: metrics.best0to100Seconds ?? undefined,
          });
        }
      } catch (e) {
        console.error('[Velox] Failed to save trip:', e);
        Alert.alert(
          'Trip not saved',
          'Your trip could not be saved. Check your connection and try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsSaving(false);
      }
    }

    resetTrip();
    setElapsed(0);
  }, [gpsPoints, startTime, setTracking, resetTrip]);

  return { isTracking, liveStats, startTrip, stopTrip, isSaving, selectedVehicle, setSelectedVehicle };
}
