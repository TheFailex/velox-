export interface GPSPoint {
  lat: number;
  lng: number;
  speed: number;       // km/h
  altitude: number;    // meters above sea level
  timestamp: number;   // Unix ms
}

export interface Trip {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  distance_km: number;
  duration_seconds: number;
  top_speed_kmh: number;
  avg_speed_kmh: number;
  driving_score: number;  // 0-100
  route: GPSPoint[];
  created_at: string;

  // Vehicle + location (populated at trip save time from profile)
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_type?: string | null;
  country?: string | null;

  // Extended maneuver stats (computed from GPS)
  left_turns?: number;
  right_turns?: number;
  brake_events?: number;
  total_stops?: number;
  max_deceleration_ms2?: number;
  max_acceleration_ms2?: number;
  peak_g_force?: number;
  top_corner_speed_kmh?: number;
  best_0_100_seconds?: number | null;
}

export interface UserStats {
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  topSpeedKmh: number;
  avgDrivingScore: number;
  // Extended aggregates
  totalLeftTurns: number;
  totalRightTurns: number;
  totalBrakeEvents: number;
  totalStops: number;
  peakGForce: number;
  maxDecelerationMs2: number;
  maxAccelerationMs2: number;
  topCornerSpeedKmh: number;
  best0to100Seconds: number | null;
  avgTripLengthKm: number;
}

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;
  summary: string;
  created_at: string;
}

export interface VehicleEntry {
  type: 'Car' | 'Motorbike';
  make: string;
  model: string;
}

export interface Profile {
  id: string;
  user_id: string;
  vehicle_name: string | null;
  vehicle_type: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  username: string | null;
  country: string | null;
  speed_unit: 'kmh' | 'mph';
  vehicles: VehicleEntry[];
  created_at: string;
}
