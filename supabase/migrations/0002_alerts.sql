-- Marketcap: price alerts and in-app notifications.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- ---------- alerts ----------
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  name text not null default '',
  currency text not null default 'USD' check (currency in ('USD', 'NGN', 'EUR')),
  -- above / below: price crosses `target`; up / down: daily move of at least `target` percent
  condition text not null check (condition in ('above', 'below', 'up', 'down')),
  target numeric not null check (target > 0),
  active boolean not null default true,
  last_triggered_at timestamptz,
  last_price numeric,
  created_at timestamptz not null default now()
);
create index alerts_active_idx on public.alerts (active) where active;
create index alerts_user_id_idx on public.alerts (user_id);

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  alert_id uuid references public.alerts (id) on delete set null,
  symbol text,
  title text not null check (char_length(title) <= 200),
  body text not null default '' check (char_length(body) <= 1000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ---------- Row-Level Security ----------
alter table public.alerts enable row level security;
alter table public.notifications enable row level security;

create policy "Users manage own alerts" on public.alerts
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Users read and mark-as-read their notifications; only the server (secret key) creates them
create policy "Users read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users update own notifications" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete own notifications" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- Keep notifications to the latest 100 per user
create function public.trim_notifications()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.notifications
  where user_id = new.user_id
    and id not in (
      select id from public.notifications where user_id = new.user_id order by created_at desc limit 100
    );
  return null;
end;
$$;

create trigger trim_notifications_after_insert
  after insert on public.notifications
  for each row execute function public.trim_notifications();
