-- ═══════════════════════════════════════════════════════════════
-- VISITRADE — Schéma Supabase (comptes réels + persistance)
-- À coller dans Supabase → SQL Editor → Run.
-- Ré-exécutable sans risque (idempotent).
-- ═══════════════════════════════════════════════════════════════

-- ── Profil (1 par utilisateur) ────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  name          text,
  plan          text default 'free',
  onboarded     boolean default false,
  trading_style text,
  level         text,
  markets       text[],
  created_at    timestamptz default now()
);

-- ── Watchlist ─────────────────────────────────────────────────
create table if not exists public.watchlist (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users on delete cascade not null,
  symbol    text not null,
  added_at  timestamptz default now(),
  unique (user_id, symbol)
);

-- ── Positions (portefeuille) ──────────────────────────────────
create table if not exists public.positions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  symbol     text not null,
  qty        numeric not null,
  avg_price  numeric not null,
  created_at timestamptz default now()
);

-- ── Alertes ───────────────────────────────────────────────────
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  symbol     text not null,
  type       text not null,
  detail     text,
  target     numeric,
  dir        text,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ── Journal ───────────────────────────────────────────────────
create table if not exists public.journal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  date       date not null,
  symbol     text not null,
  side       text,
  entry      numeric,
  exit       numeric,
  result     text,
  r_multiple numeric,
  note       text,
  created_at timestamptz default now()
);

-- ── Sécurité : Row Level Security (chacun ne voit que SES données)
alter table public.profiles  enable row level security;
alter table public.watchlist enable row level security;
alter table public.positions enable row level security;
alter table public.alerts    enable row level security;
alter table public.journal   enable row level security;

drop policy if exists "own profile"   on public.profiles;
drop policy if exists "own watchlist" on public.watchlist;
drop policy if exists "own positions" on public.positions;
drop policy if exists "own alerts"    on public.alerts;
drop policy if exists "own journal"   on public.journal;

create policy "own profile"   on public.profiles  for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own watchlist" on public.watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own positions" on public.positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own alerts"    on public.alerts    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal"   on public.journal   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Création automatique du profil à l'inscription ────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Quota d'analyses complètes (plan Free) ────────────────────
-- 1 analyse complète / mois : le compteur vit ici, côté serveur,
-- et non plus dans le localStorage du navigateur (falsifiable).
create table if not exists public.analysis_unlocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  month      text not null,                -- "2026-09"
  symbol     text not null,
  created_at timestamptz default now(),
  unique (user_id, month, symbol)
);

create index if not exists analysis_unlocks_user_month
  on public.analysis_unlocks (user_id, month);

alter table public.analysis_unlocks enable row level security;

drop policy if exists "own unlocks" on public.analysis_unlocks;
create policy "own unlocks" on public.analysis_unlocks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
