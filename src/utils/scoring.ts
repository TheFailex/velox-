import type { GPSPoint } from '@/types';
import { bearing, angleDelta, haversineKm } from './geoUtils';

/**
 * SKILL-BASED DRIVING SCORE — 0 to 100.
 *
 * Starts at 0 and earns points for daring, skilled driving.
 * A careful/slow driver scores low. A fast-but-controlled driver scores high.
 *
 * Points earned (up to 100 total):
 *
 *   1. Speed performance   0–35 pts
 *      – Avg moving speed  0–20  (max at 130 km/h avg)
 *      – Top speed reached 0–15  (max at 200 km/h)
 *
 *   2. Cornering skill     0–25 pts
 *      – Smooth corners at >60 km/h:  +1 pt each (capped at 15)
 *      – Smooth corners at >100 km/h: bonus +2 pt each (capped at +10)
 *
 *   3. Acceleration mastery 0–20 pts
 *      – Confident inputs 1.5–5.5 m/s²: earn pts proportional to count
 *      – Very gentle driving (peak <1 m/s²): 0 pts
 *
 *   4. Distance & commitment 0–10 pts
 *      – Scales from 1 km → 10 pts at 25 km+
 *
 *   5. High-speed consistency 0–10 pts
 *      – Low speed variation while moving fast (smooth pace holding)
 *
 * Penalties (deducted from earned total):
 *   – Panic braking >8 m/s²:       –5 per event (max –15)
 *   – Wild cornering >55° at >80 km/h: –3 per event (max –12)
 *
 * Minimum score for trips < 0.5 km: capped at 20 (insufficient data).
 */
export function scoreDrive(points: GPSPoint[]): number {
  if (points.length < 2) return 0;

  // ── Per-segment pass ───────────────────────────────────────────────────────
  let totalDistKm = 0;
  let maxAccelMs2 = 0;
  let maxDecelMs2 = 0;
  let confidentAccelCount = 0;  // 1.5–5.5 m/s² inputs
  let panicBrakeEvents = 0;     // >8 m/s² decel

  for (let i = 1; i < points.length; i++) {
    totalDistKm += haversineKm(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng,
    );
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (dt > 0) {
      const a = (points[i].speed - points[i - 1].speed) / 3.6 / dt; // m/s²
      if (a > maxAccelMs2) maxAccelMs2 = a;
      if (-a > maxDecelMs2) maxDecelMs2 = -a;
      if (a >= 1.5 && a <= 5.5) confidentAccelCount++;
      if (-a > 8) panicBrakeEvents++;
    }
  }

  // ── 1. Speed performance (0–35) ───────────────────────────────────────────
  const movingSpeeds = points.map((p) => p.speed).filter((s) => s > 5);
  const avgMoving = movingSpeeds.length > 0
    ? movingSpeeds.reduce((s, v) => s + v, 0) / movingSpeeds.length
    : 0;
  const topSpeed = points.reduce((m, p) => Math.max(m, p.speed), 0);

  const avgSpeedPts = Math.min(20, (avgMoving / 130) * 20);
  const topSpeedPts = Math.min(15, (topSpeed / 200) * 15);
  const speedPts = avgSpeedPts + topSpeedPts;

  // ── 2. Cornering skill (0–25) ─────────────────────────────────────────────
  let smoothMidCorners = 0;   // 60–100 km/h
  let smoothHighCorners = 0;  // >100 km/h
  let wildCorners = 0;        // >55° at >80 km/h (loss of control)

  if (points.length >= 3) {
    for (let i = 2; i < points.length; i++) {
      const spd = points[i].speed;
      if (spd < 60) continue;
      const b1 = bearing(points[i - 2].lat, points[i - 2].lng, points[i - 1].lat, points[i - 1].lng);
      const b2 = bearing(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
      const delta = Math.abs(angleDelta(b1, b2));
      if (delta >= 15 && delta < 55) {
        if (spd >= 100) smoothHighCorners++;
        else smoothMidCorners++;
      } else if (delta >= 55 && spd > 80) {
        wildCorners++;
      }
    }
  }

  const baseCornering = Math.min(15, smoothMidCorners * 1);
  const highCornerBonus = Math.min(10, smoothHighCorners * 2);
  const cornerPts = Math.max(0, baseCornering + highCornerBonus);

  // ── 3. Acceleration mastery (0–20) ───────────────────────────────────────
  // Reward confident, assertive throttle use
  const accelPts = Math.min(20, confidentAccelCount * 0.8);

  // ── 4. Distance & commitment (0–10) ──────────────────────────────────────
  const distPts = Math.min(10, (totalDistKm / 25) * 10);

  // ── 5. High-speed consistency (0–10) ─────────────────────────────────────
  // Reward maintaining a high, steady pace (low CV among fast points)
  const fastSpeeds = movingSpeeds.filter((s) => s > 60);
  let consistencyPts = 0;
  if (fastSpeeds.length > 4) {
    const mean = fastSpeeds.reduce((s, v) => s + v, 0) / fastSpeeds.length;
    const variance = fastSpeeds.reduce((s, v) => s + (v - mean) ** 2, 0) / fastSpeeds.length;
    const cv = Math.sqrt(variance) / (mean || 1);
    // Low CV = consistent pace = more points
    consistencyPts = Math.min(10, Math.max(0, (1 - cv * 2) * 10));
  }

  // ── Penalties ─────────────────────────────────────────────────────────────
  const panicPenalty = Math.min(15, panicBrakeEvents * 5);
  const wildCornerPenalty = Math.min(12, wildCorners * 3);

  // ── Total ─────────────────────────────────────────────────────────────────
  const raw = speedPts + cornerPts + accelPts + distPts + consistencyPts
    - panicPenalty - wildCornerPenalty;

  let score = Math.max(0, Math.min(100, Math.round(raw)));

  if (totalDistKm < 0.5) score = Math.min(score, 20);

  return score;
}
