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
}

export interface UserStats {
  totalTrips: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  topSpeedKmh: number;
  avgDrivingScore: number;
}

export interface WeeklyInsight {
  id: string;
  user_id: string;
  week_start: string;
  summary: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  vehicle_name: string | null;
  vehicle_type: string;
  created_at: string;
}
