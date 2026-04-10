// Velox — weekly-insights Edge Function
// Triggered weekly (via pg_cron or manually via POST /functions/v1/weekly-insights)
// Generates an AI driving summary for every user who drove in the last 7 days.
//
// Deploy: supabase functions deploy weekly-insights
// Env vars required in Supabase dashboard:
//   ANTHROPIC_API_KEY
//   SUPABASE_URL (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.52.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

interface TripRow {
  user_id: string;
  distance_km: number;
  duration_seconds: number;
  top_speed_kmh: number;
  avg_speed_kmh: number;
  driving_score: number;
  started_at: string;
}

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

function buildPrompt(trips: TripRow[]): string {
  const totalKm = trips.reduce((s, t) => s + t.distance_km, 0).toFixed(1);
  const totalTrips = trips.length;
  const avgScore = Math.round(
    trips.reduce((s, t) => s + t.driving_score, 0) / totalTrips,
  );
  const topSpeed = Math.max(...trips.map((t) => t.top_speed_kmh)).toFixed(0);
  const avgSpeedAll = (
    trips.reduce((s, t) => s + t.avg_speed_kmh, 0) / totalTrips
  ).toFixed(0);

  return `You are Velox, a concise AI driving analyst. Write a 2–3 sentence weekly driving insight for a user based on their data below. Be specific, encouraging, and data-driven. No generic filler.

Weekly data:
- Trips: ${totalTrips}
- Total distance: ${totalKm} km
- Average driving score: ${avgScore}/100
- Top speed recorded: ${topSpeed} km/h
- Average speed across all trips: ${avgSpeedAll} km/h

Write the insight now (2–3 sentences, no bullet points, no greeting):`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const weekStart = getMondayOfCurrentWeek();

  // Get all trips from the past 7 days
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('user_id, distance_km, duration_seconds, top_speed_kmh, avg_speed_kmh, driving_score, started_at')
    .gte('started_at', since.toISOString());

  if (tripsError) {
    return new Response(JSON.stringify({ error: tripsError.message }), { status: 500 });
  }

  if (!trips || trips.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
  }

  // Group trips by user
  const byUser = new Map<string, TripRow[]>();
  for (const trip of trips as TripRow[]) {
    const list = byUser.get(trip.user_id) ?? [];
    list.push(trip);
    byUser.set(trip.user_id, list);
  }

  let processed = 0;
  const errors: string[] = [];

  for (const [userId, userTrips] of byUser) {
    // Skip if insight already exists for this week
    const { data: existing } = await supabase
      .from('weekly_insights')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (existing) continue;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: buildPrompt(userTrips) }],
      });

      const summary =
        message.content[0].type === 'text' ? message.content[0].text.trim() : '';

      if (summary) {
        await supabase.from('weekly_insights').insert({
          user_id: userId,
          week_start: weekStart,
          summary,
        });
        processed++;
      }
    } catch (err) {
      errors.push(`${userId}: ${(err as Error).message}`);
    }
  }

  return new Response(
    JSON.stringify({ processed, errors: errors.length ? errors : undefined }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
