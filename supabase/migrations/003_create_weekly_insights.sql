-- Weekly insights: AI-generated driving summaries (one per user per week)
create table public.weekly_insights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  week_start date not null,
  summary    text not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_insights enable row level security;

-- Users can read their own insights
create policy "Users can view own insights"
  on public.weekly_insights for select
  using (auth.uid() = user_id);

-- Only the service role (Edge Function) can write insights
create policy "Service role can insert insights"
  on public.weekly_insights for insert
  with check (true);

create index weekly_insights_user_week_idx
  on public.weekly_insights (user_id, week_start desc);
