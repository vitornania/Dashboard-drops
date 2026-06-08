-- Dropship Ops Dashboard — initial schema

create extension if not exists "pgcrypto";

-- Profiles linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#0075FF',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#0075FF')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shopify connection (single workspace store)
create table if not exists public.shopify_connections (
  id uuid primary key default gen_random_uuid(),
  shop_domain text not null unique,
  access_token text not null,
  scopes text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cached Shopify orders for charts
create table if not exists public.orders_cache (
  id bigint primary key,
  shop_domain text not null,
  order_number text,
  customer_email text,
  financial_status text,
  fulfillment_status text,
  currency text not null default 'USD',
  gross_total numeric(12, 2) not null default 0,
  net_total numeric(12, 2) not null default 0,
  refund_total numeric(12, 2) not null default 0,
  ordered_at timestamptz not null,
  raw jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists orders_cache_shop_ordered_at on public.orders_cache (shop_domain, ordered_at desc);

-- Manual costs: ad spend, COGS, expenses
create table if not exists public.manual_costs (
  id uuid primary key default gen_random_uuid(),
  cost_date date not null default current_date,
  category text not null check (category in ('ad_spend', 'cogs', 'expense', 'other')),
  amount numeric(12, 2) not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Time tracking
create table if not exists public.time_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists time_sessions_user_clock_in on public.time_sessions (user_id, clock_in desc);

-- Team chat
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null default 'general',
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created on public.chat_messages (channel_id, created_at asc);

-- Whiteboards
create table if not exists public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled board',
  snapshot jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: authenticated team members only
alter table public.profiles enable row level security;
alter table public.shopify_connections enable row level security;
alter table public.orders_cache enable row level security;
alter table public.manual_costs enable row level security;
alter table public.time_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.whiteboards enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "shopify_connections_all" on public.shopify_connections for all to authenticated using (true) with check (true);
create policy "orders_cache_all" on public.orders_cache for all to authenticated using (true) with check (true);
create policy "manual_costs_all" on public.manual_costs for all to authenticated using (true) with check (true);

create policy "time_sessions_select" on public.time_sessions for select to authenticated using (true);
create policy "time_sessions_insert_own" on public.time_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "time_sessions_update_own" on public.time_sessions for update to authenticated using (auth.uid() = user_id);

create policy "chat_messages_all" on public.chat_messages for all to authenticated using (true) with check (true);
create policy "whiteboards_all" on public.whiteboards for all to authenticated using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.whiteboards;
