# Velox — API & Database Schema

## Supabase Tables

### `profiles`

One row per user. Created on first profile save (upsert).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | FK auth.users, unique |
| `vehicle_name` | text | nullable, user-provided nickname |
| `vehicle_type` | text | 'Car' \| 'Motorcycle' \| 'Truck' \| 'Van', default 'Car' |
| `created_at` | timestamptz | default now() |

RLS: user can select/insert/update own row only.

---

### `trips`

One row per completed drive session.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, gen_random_uuid() |
| `user_id` | uuid | FK auth.users |
| `started_at` | timestamptz | when tracking began |
| `ended_at` | timestamptz | nullable, when tracking stopped |
| `distance_km` | real | haversine-computed total |
| `duration_seconds` | integer | wall-clock seconds |
| `top_speed_kmh` | real | max GPS speed in km/h |
| `avg_speed_kmh` | real | mean GPS speed in km/h |
| `driving_score` | integer | 0–100, from scoreDrive() |
| `route` | jsonb | GPSPoint[] array |
| `created_at` | timestamptz | default now() |

Index: `(user_id, started_at DESC)` for fast reverse-chronological queries.

RLS: user can select/insert/delete own rows only.

#### `route` JSONB structure

```json
[
  { "lat": 40.4168, "lng": -3.7038, "speed": 52.3, "timestamp": 1712000000000 },
  ...
]
```

`speed` is in km/h. `timestamp` is Unix ms.

---

### `weekly_insights`

One AI-generated insight per user per week (Monday = week_start).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK auth.users |
| `week_start` | date | ISO date of the Monday |
| `summary` | text | 2–3 sentence AI summary |
| `created_at` | timestamptz | default now() |

Unique constraint: `(user_id, week_start)`.

RLS: user can select own rows; service role inserts via Edge Function.

---

## Edge Functions

### `weekly-insights`

**Trigger:** POST `/functions/v1/weekly-insights`
Intended to be called by a pg_cron job every Monday at 08:00 UTC:

```sql
select cron.schedule(
  'weekly-velox-insights',
  '0 8 * * 1',
  $$
    select net.http_post(
      url := current_setting('app.functions_url') || '/weekly-insights',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    )
  $$
);
```

**Behavior:**
1. Queries all trips from the past 7 days.
2. Groups by `user_id`.
3. For each user without an existing insight for the current week, calls Claude Haiku to generate a 2–3 sentence summary.
4. Inserts to `weekly_insights`.

**Environment variables required:**
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

---

## Auth

Supabase Auth with email/password. Sessions persisted to AsyncStorage on the device. The root layout (`src/app/_layout.tsx`) checks session on mount and routes accordingly:

- Session exists → `/(tabs)`
- No session + onboarding not done → `/onboarding`
- No session + onboarding done → stays on current route (e.g. sign-in)

---

## Environment Variables

All variables are prefixed with `EXPO_PUBLIC_` so Expo bundles them into the JS bundle (client-visible — only use anon/public keys here):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_RC_IOS_KEY=appl_...
EXPO_PUBLIC_RC_ANDROID_KEY=goog_...
```
