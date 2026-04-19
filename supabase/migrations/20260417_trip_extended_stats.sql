-- Extended trip statistics: maneuvers, physics metrics, and vehicle info
-- All columns are nullable with defaults so existing trips are unaffected.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS vehicle_make         TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_model        TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type         TEXT,
  ADD COLUMN IF NOT EXISTS left_turns           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS right_turns          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS brake_events         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_stops          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_deceleration_ms2 NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_acceleration_ms2 NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peak_g_force         NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_corner_speed_kmh NUMERIC(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_0_100_seconds   NUMERIC(5,1);  -- nullable: null if 0→100 never reached
