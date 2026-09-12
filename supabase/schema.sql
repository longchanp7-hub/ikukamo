create type public.event_confidence as enum ('confirmed', 'high', 'unverified');
create type public.feedback_action as enum ('want', 'save', 'dismiss', 'went', 'open_detail');
create table if not exists public.categories (id text primary key, name text not null, weight numeric not null default 1);
create table if not exists public.events (
  id text primary key, title text not null, description text, category text not null references public.categories(id),
  start_at timestamptz not null, end_at timestamptz not null, venue_name text, city text, prefecture text,
  latitude double precision, longitude double precision, distance_from_toyohashi numeric, drive_minutes integer,
  score integer not null default 0, confidence public.event_confidence not null default 'unverified',
  image_url text, official_url text, x_url text, instagram_url text, is_sample boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.event_sources (
  id uuid primary key default gen_random_uuid(), event_id text not null references public.events(id) on delete cascade,
  source_type text not null, source_url text, source_name text, published_at timestamptz, fetched_at timestamptz not null default now()
);
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(), event_id text not null references public.events(id) on delete cascade,
  action public.feedback_action not null, created_at timestamptz not null default now()
);
alter table public.events enable row level security;
alter table public.event_sources enable row level security;
alter table public.user_feedback enable row level security;
alter table public.categories enable row level security;
create policy "public read events" on public.events for select using (true);
create policy "public read sources" on public.event_sources for select using (true);
create policy "public read categories" on public.categories for select using (true);
create policy "public insert feedback" on public.user_feedback for insert with check (true);
insert into public.categories (id, name, weight) values
 ('food','食',1.15),('car','車',1.15),('night_market','夜市',1.1),('morning_market','朝市',1.05),('festival','祭り',1),
 ('wine','ワイン',1.12),('sake','日本酒',1.12),('beer','ビール',1.12),('ramen','ラーメン',1.08),('sushi','寿司',1.08),
 ('hotel','ホテル',1.05),('onsen','温泉',1.1),('music','音楽',0.95),('local','地域',1.05),('other','その他',0.85)
on conflict (id) do nothing;
