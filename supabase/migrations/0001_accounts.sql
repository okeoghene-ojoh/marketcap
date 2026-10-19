-- Marketcap: accounts, watchlists and holdings.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Row-Level Security makes every table private to its owner.

-- ---------- profiles: one row per user ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 80),
  base_currency text not null default 'USD' check (base_currency in ('USD', 'NGN', 'EUR')),
  created_at timestamptz not null default now()
);

-- ---------- watchlists: named lists (the app uses the first one for now) ----------
create table public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My watchlist' check (char_length(name) <= 60),
  created_at timestamptz not null default now()
);
create index watchlists_user_id_idx on public.watchlists (user_id);

create table public.watchlist_items (
  watchlist_id uuid not null references public.watchlists (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  name text not null default '',
  exchange text not null default '',
  currency text not null default 'USD' check (currency in ('USD', 'NGN', 'EUR')),
  added_at timestamptz not null default now(),
  primary key (watchlist_id, symbol)
);

-- ---------- holdings ----------
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  name text not null default '',
  exchange text not null default '',
  asset_class text not null check (asset_class in ('us', 'crypto', 'ngx', 'cash')),
  currency text not null default 'USD' check (currency in ('USD', 'NGN', 'EUR')),
  shares numeric not null check (shares > 0),
  buy_price numeric not null check (buy_price >= 0),
  buy_date date,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
create index holdings_user_id_idx on public.holdings (user_id);

-- ---------- Row-Level Security ----------
alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.holdings enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users manage own watchlists" on public.watchlists
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Users manage items in own watchlists" on public.watchlist_items
  for all to authenticated
  using (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())))
  with check (exists (select 1 from public.watchlists w where w.id = watchlist_id and w.user_id = (select auth.uid())));

create policy "Users manage own holdings" on public.holdings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- new users get a profile and an empty watchlist ----------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), 80));
  insert into public.watchlists (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
