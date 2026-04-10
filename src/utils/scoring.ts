import type { GPSPoint } from '@/types';

// Thresholds
const SPEED_LIMIT_KMH = 120;
const VERY_HIGH_SPEED_KMH = 160;
const HARSH_DELTA_KMH = 30; // speed change between consecutive GPS points

// Maximum penalties (points deducted)
const MAX_VIOLATION_PENALTY = 40; // time over speed limit
const VERY_HIGH_PENALTY = 15;     // ever exceeded 160 km/h
const MAX_HARSH_PENALTY = 25;     // harsh acceleration / braking events
const HARSH_EVENT_PENALTY = 5;    // per harsh event

/**
 * Compute a 0–100 driving score for a completed trip.
 *
 * Scoring model:
 *  - Start at 100
 *  - Penalty proportional to % of GPS points above SPEED_LIMIT_KMH (max –40)
 *  - Flat penalty if any point exceeded VERY_HIGH_SPEED_KMH (–15)
 *  - Per-event penalty for harsh speed changes between consecutive points (max –25)
 */
export function scoreDrive(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  // 1. Speed limit violations
  const violatingCount = points.filter((p) => p.speed > SPEED_LIMIT_KMH).length;
  const violationPenalty = (violatingCount / points.length) * MAX_VIOLATION_PENALTY;

  // 2. Very high speed
  const hadVeryHighSpeed = points.some((p) => p.speed > VERY_HIGH_SPEED_KMH);
  const veryHighPenalty = hadVeryHighSpeed ? VERY_HIGH_PENALTY : 0;

  // 3. Harsh acceleration / braking
  let harshEvents = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = Math.abs(points[i].speed - points[i - 1].speed);
    if (delta > HARSH_DELTA_KMH) harshEvents++;
  }
  const harshPenalty = Math.min(MAX_HARSH_PENALTY, harshEvents * HARSH_EVENT_PENALTY);

  const raw = 100 - violationPenalty - veryHighPenalty - harshPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
