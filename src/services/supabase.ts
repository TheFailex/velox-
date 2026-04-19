import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Trip, Profile, WeeklyInsight } from '@/types';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // required for React Native
      flowType: 'implicit',     // avoids PKCE code exchange issues with deep links
    },
  }
);

export const tripsService = {
  async save(trip: Omit<Trip, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async hasTripToday(): Promise<boolean> {
    // Uses server clock via RPC — not bypassable by changing device date
    const { data, error } = await supabase.rpc('has_trip_today');
    if (error) {
      console.warn('[Velox] hasTripToday RPC failed, falling back:', error.message);
      // Fallback: last-24h window (harder to spoof than midnight comparison)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: fb } = await supabase.from('trips').select('id').gte('started_at', since).limit(1);
      return (fb?.length ?? 0) > 0;
    }
    return data === true;
  },

  async list(limit = 20) {
    // Exclude `route` (full GPS JSONB) — not needed for list cards, fetched only in detail view
    const { data, error } = await supabase
      .from('trips')
      .select('id, started_at, ended_at, distance_km, duration_seconds, top_speed_kmh, avg_speed_kmh, driving_score, vehicle_make, vehicle_model, vehicle_type, country, left_turns, right_turns, brake_events, total_stops, max_deceleration_ms2, max_acceleration_ms2, peak_g_force, top_corner_speed_kmh, best_0_100_seconds, created_at')
      .order('started_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

export const profilesService = {
  async get(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    // Uses a SECURITY DEFINER RPC to bypass RLS — otherwise the SELECT policy
    // (auth.uid() = user_id) would filter out other users' rows, making every
    // username appear available.
    const { data, error } = await supabase.rpc('check_username_available', {
      p_username: username,
      p_user_id: user?.id ?? null,
    });
    if (error) throw error;
    return data === true;
  },

  async upsert(update: {
    vehicle_name?: string | null;
    vehicle_type?: string;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    username?: string | null;
    country?: string | null;
    speed_unit?: 'kmh' | 'mph';
    vehicles?: import('@/types').VehicleEntry[];
  }): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, ...update }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const weeklyInsightsService = {
  async getLatest(): Promise<WeeklyInsight | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('weekly_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
