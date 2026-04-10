-- Trips table: one row per completed drive
create table public.trips (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  distance_km      real not null default 0,
  duration_seconds integer not null default 0,
  top_speed_kmh    real not null default 0,
  avg_speed_kmh    real not null default 0,
  driving_score    integer not null default 0 check (driving_score between 0 and 100),
  route            jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "Users can view own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "Users can insert own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- Index for fast reverse-chronological queries per user
create index trips_user_started_idx
  on public.trips (user_id, started_at desc);
