import type { GPSPoint } from '@/types';
import { bearing, angleDelta } from './geoUtils';

export interface TripMetrics {
  leftTurns: number;
  rightTurns: number;
  brakeEvents: number;
  totalStops: number;
  maxDecelerationMs2: number;
  maxAccelerationMs2: number;
  peakGForce: number;
  topCornerSpeedKmh: number;
  best0to100Seconds: number | null; // null if 0→100 km/h never achieved
}

// Thresholds
const TURN_DEG = 25;        // heading change (°) to count as a turn
const MIN_TURN_KMH = 10;    // only detect turns above this speed
const BRAKE_DELTA_KMH = 15; // speed drop in one GPS interval = brake event
const STOP_KMH = 5;         // below this = stopped
const KMH_TO_MS = 1 / 3.6;

/**
 * Compute all extended trip metrics from raw GPS points.
 * All values are derived purely from GPS: speed, heading, and timestamps.
 * Peak G-force is approximated from linear acceleration (not from accelerometer).
 */
export function computeTripMetrics(points: GPSPoint[]): TripMetrics {
  if (points.length < 2) {
    return {
      leftTurns: 0,
      rightTurns: 0,
      brakeEvents: 0,
      totalStops: 0,
      maxDecelerationMs2: 0,
      maxAccelerationMs2: 0,
      peakGForce: 0,
      topCornerSpeedKmh: 0,
      best0to100Seconds: null,
    };
  }

  let leftTurns = 0;
  let rightTurns = 0;
  let brakeEvents = 0;
  let totalStops = 0;
  let maxDecelerationMs2 = 0;
  let maxAccelerationMs2 = 0;
  let peakGForce = 0;
  let topCornerSpeedKmh = 0;

  // 0→100 detection state
  let accelStartTime: number | null = null;
  let accelStartSpeed: number | null = null;
  let best0to100Seconds: number | null = null;

  let wasMoving = points[0].speed >= STOP_KMH;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const dt = (curr.timestamp - prev.timestamp) / 1000; // seconds
    if (dt <= 0) continue;

    const dSpeedKmh = curr.speed - prev.speed;

    // Acceleration in m/s²
    const accelMs2 = (dSpeedKmh * KMH_TO_MS) / dt;

    if (accelMs2 > maxAccelerationMs2) maxAccelerationMs2 = accelMs2;
    if (-accelMs2 > maxDecelerationMs2) maxDecelerationMs2 = -accelMs2;

    // G-force from linear acceleration only (tangential component)
    const gForce = Math.abs(accelMs2) / 9.81;
    if (gForce > peakGForce) peakGForce = gForce;

    // Brake event: big deceleration in one interval
    if (prev.speed - curr.speed >= BRAKE_DELTA_KMH) brakeEvents++;

    // Stop transitions
    const isMoving = curr.speed >= STOP_KMH;
    if (wasMoving && !isMoving) totalStops++;
    wasMoving = isMoving;

    // 0→100 km/h timing
    // Start timing when speed drops below 10 km/h (near stop)
    if (curr.speed < 10 && (accelStartTime === null || prev.speed < 10)) {
      accelStartTime = curr.timestamp;
      accelStartSpeed = curr.speed;
    }
    // End timing when speed exceeds 100 km/h for the first time after a start
    if (accelStartTime !== null && curr.speed >= 100 && prev.speed < 100) {
      const elapsed = (curr.timestamp - accelStartTime) / 1000;
      if (elapsed > 0.5 && elapsed < 60) { // sanity: must be between 0.5s and 60s
        if (best0to100Seconds === null || elapsed < best0to100Seconds) {
          best0to100Seconds = Math.round(elapsed * 10) / 10;
        }
      }
      accelStartTime = null;
    }

    // Turn detection: compare consecutive bearings
    if (i >= 2 && curr.speed > MIN_TURN_KMH && prev.speed > MIN_TURN_KMH) {
      const pp = points[i - 2];
      const prevBearing = bearing(pp.lat, pp.lng, prev.lat, prev.lng);
      const currBearing = bearing(prev.lat, prev.lng, curr.lat, curr.lng);
      const delta = angleDelta(prevBearing, currBearing);

      if (Math.abs(delta) >= TURN_DEG) {
        if (delta > 0) {
          rightTurns++;
        } else {
          leftTurns++;
        }
        // Track fastest speed through a corner
        if (curr.speed > topCornerSpeedKmh) topCornerSpeedKmh = curr.speed;
      }
    }
  }

  return {
    leftTurns,
    rightTurns,
    brakeEvents,
    totalStops,
    maxDecelerationMs2: Math.round(maxDecelerationMs2 * 100) / 100,
    maxAccelerationMs2: Math.round(maxAccelerationMs2 * 100) / 100,
    peakGForce: Math.round(peakGForce * 100) / 100,
    topCornerSpeedKmh: Math.round(topCornerSpeedKmh),
    best0to100Seconds,
  };
}
