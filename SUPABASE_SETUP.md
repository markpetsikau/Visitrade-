# Activer les vrais comptes (Supabase)

Aujourd'hui VISITRADE fonctionne en **mode démo** : la session est un cookie et les
données (watchlist, portfolio, alertes) sont sauvegardées dans le navigateur.
C'est déjà persistant sur ton appareil, mais pas de vrais comptes sécurisés ni de
synchronisation entre appareils.

Pour passer aux **vrais comptes** (mots de passe chiffrés, données côté serveur,
multi-appareils), il faut brancher Supabase — gratuit, ~5 minutes.

## 1. Créer le projet (2 min)

1. Va sur [supabase.com](https://supabase.com) → **New project**.
2. Note l'URL du projet et les clés dans **Settings → API** :
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret)

## 2. Renseigner les clés

Dans `~/visitrade/.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

## 3. Créer les tables (copier-coller dans l'éditeur SQL Supabase)

Supabase → **SQL Editor** → colle ceci → **Run** :

```sql
-- Profil (1 par utilisateur)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  plan text default 'free',
  onboarded boolean default false,
  trading_style text,
  level text,
  markets text[],
  created_at timestamptz default now()
);

-- Watchlist
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  added_at timestamptz default now(),
  unique (user_id, symbol)
);

-- Positions (portefeuille)
create table positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  qty numeric not null,
  avg_price numeric not null,
  created_at timestamptz default now()
);

-- Alertes
create table alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  type text not null,
  detail text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Journal
create table journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  symbol text not null,
  side text,
  entry numeric,
  exit numeric,
  result text,
  r_multiple numeric,
  note text,
  created_at timestamptz default now()
);

-- Sécurité : chaque utilisateur ne voit que SES données (RLS)
alter table profiles  enable row level security;
alter table watchlist enable row level security;
alter table positions enable row level security;
alter table alerts    enable row level security;
alter table journal   enable row level security;

create policy "own profile"   on profiles  for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own watchlist" on watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own positions" on positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own alerts"    on alerts    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journal"   on journal   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Créer automatiquement un profil à l'inscription
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 4. Me le dire

Une fois les 3 étapes faites, dis-moi « Supabase est prêt » : je bascule
l'authentification et la sauvegarde des données de la démo vers Supabase (le code
est déjà préparé, `lib/supabase/`), et je vérifie que tout marche. Le reste de
l'app ne change pas.

> Tant que ces clés ne sont pas présentes, VISITRADE reste en mode démo — rien ne casse.
