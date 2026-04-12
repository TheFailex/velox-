-- =============================================
-- Velox — Initial schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- Trips ----------------------------------------------------------
create table public.trips (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users(id) on delete cascade not null,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  distance_km      numeric     not null default 0,
  duration_seconds integer     not null default 0,
  top_speed_kmh    numeric     not null default 0,
  avg_speed_kmh    numeric     not null default 0,
  driving_score    integer     not null default 0 check (driving_score between 0 and 100),
  route            jsonb       not null default '[]',
  created_at       timestamptz not null default now()
);

create index trips_user_started_idx on public.trips (user_id, started_at desc);

alter table public.trips enable row level security;

create policy "users manage own trips" on public.trips
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- Profiles -------------------------------------------------------
create table public.profiles (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        references auth.users(id) on delete cascade not null unique,
  vehicle_name text,
  vehicle_type text        not null default 'Car',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users manage own profile" on public.profiles
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- Weekly insights ------------------------------------------------
create table public.weekly_insights (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references auth.users(id) on delete cascade not null,
  week_start date        not null,
  summary    text        not null,
  created_at timestamptz not null default now()
);

create index insights_user_week_idx on public.weekly_insights (user_id, week_start desc);

alter table public.weekly_insights enable row level security;

create policy "users manage own insights" on public.weekly_insights
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
