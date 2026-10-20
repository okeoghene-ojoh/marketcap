-- Marketcap: paper trading (practice account with pretend money).
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Users can READ their own practice data; every change goes through the functions
-- below, which only the server (secret key) may call, with a price it fetched itself.

create table public.paper_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cash numeric not null check (cash >= 0),
  starting_cash numeric not null default 100000 check (starting_cash > 0),
  started_at timestamptz not null default now()
);

create table public.paper_positions (
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  name text not null default '',
  qty numeric not null check (qty > 0),
  avg_cost numeric not null check (avg_cost >= 0),
  primary key (user_id, symbol)
);

create table public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  name text not null default '',
  side text not null check (side in ('buy', 'sell')),
  qty numeric not null check (qty > 0),
  price numeric not null check (price > 0),
  -- profit or loss locked in by a sale (null for buys)
  realized numeric,
  created_at timestamptz not null default now()
);
create index paper_trades_user_created_idx on public.paper_trades (user_id, created_at desc);

alter table public.paper_accounts enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_trades enable row level security;

create policy "Users read own paper account" on public.paper_accounts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read own paper positions" on public.paper_positions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read own paper trades" on public.paper_trades
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- execute one market order at a server-supplied price ----------
create function public.paper_execute(
  p_user uuid, p_symbol text, p_name text, p_side text, p_qty numeric, p_price numeric
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_cash numeric;
  v_pos public.paper_positions%rowtype;
  v_amount numeric := round(p_qty * p_price, 2);
  v_realized numeric;
begin
  if p_side not in ('buy', 'sell') then raise exception 'bad_side'; end if;
  if p_qty is null or p_qty <= 0 or p_price is null or p_price <= 0 then raise exception 'bad_amount'; end if;

  -- First trade opens the account with $100,000
  insert into public.paper_accounts (user_id, cash) values (p_user, 100000) on conflict (user_id) do nothing;
  -- Lock the account so two trades at once can't spend the same cash
  select cash into v_cash from public.paper_accounts where user_id = p_user for update;
  select * into v_pos from public.paper_positions where user_id = p_user and symbol = p_symbol;

  if p_side = 'buy' then
    if v_amount > v_cash then raise exception 'insufficient_cash'; end if;
    update public.paper_accounts set cash = cash - v_amount where user_id = p_user;
    insert into public.paper_positions (user_id, symbol, name, qty, avg_cost)
      values (p_user, p_symbol, p_name, p_qty, p_price)
      on conflict (user_id, symbol) do update
        set qty = public.paper_positions.qty + excluded.qty,
            avg_cost = (public.paper_positions.qty * public.paper_positions.avg_cost + excluded.qty * excluded.avg_cost)
                       / (public.paper_positions.qty + excluded.qty),
            name = excluded.name;
  else
    if v_pos.qty is null or p_qty > v_pos.qty then raise exception 'insufficient_shares'; end if;
    v_realized := round(p_qty * (p_price - v_pos.avg_cost), 2);
    update public.paper_accounts set cash = cash + v_amount where user_id = p_user;
    if p_qty = v_pos.qty then
      delete from public.paper_positions where user_id = p_user and symbol = p_symbol;
    else
      update public.paper_positions set qty = qty - p_qty where user_id = p_user and symbol = p_symbol;
    end if;
  end if;

  insert into public.paper_trades (user_id, symbol, name, side, qty, price, realized)
    values (p_user, p_symbol, p_name, p_side, p_qty, p_price, v_realized);

  select cash into v_cash from public.paper_accounts where user_id = p_user;
  return jsonb_build_object('cash', v_cash, 'amount', v_amount, 'realized', v_realized);
end;
$$;

-- ---------- start over with $100,000 ----------
create function public.paper_reset(p_user uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.paper_positions where user_id = p_user;
  delete from public.paper_trades where user_id = p_user;
  insert into public.paper_accounts (user_id, cash, started_at) values (p_user, 100000, now())
    on conflict (user_id) do update set cash = public.paper_accounts.starting_cash, started_at = now();
end;
$$;

-- Only the server may call these (users could otherwise pick their own price)
revoke all on function public.paper_execute(uuid, text, text, text, numeric, numeric) from public, anon, authenticated;
revoke all on function public.paper_reset(uuid) from public, anon, authenticated;
grant execute on function public.paper_execute(uuid, text, text, text, numeric, numeric) to service_role;
grant execute on function public.paper_reset(uuid) to service_role;
