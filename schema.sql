create table if not exists marks (
  id bigint generated always as identity primary key,
  item_id text not null,
  issue text not null,
  mark text not null check (mark in ('up', 'down')),
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id bigint generated always as identity primary key,
  item_id text not null,
  issue text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists suggested_sources (
  id bigint generated always as identity primary key,
  name text not null,
  url text,
  note text,
  created_at timestamptz not null default now()
);

alter table marks enable row level security;
alter table notes enable row level security;
alter table suggested_sources enable row level security;

drop policy if exists "anon can insert marks" on marks;
create policy "anon can insert marks" on marks for insert to anon with check (true);
drop policy if exists "anon can read marks" on marks;
create policy "anon can read marks" on marks for select to anon using (true);

drop policy if exists "anon can insert notes" on notes;
create policy "anon can insert notes" on notes for insert to anon with check (true);
drop policy if exists "anon can read notes" on notes;
create policy "anon can read notes" on notes for select to anon using (true);

drop policy if exists "anon can insert sources" on suggested_sources;
create policy "anon can insert sources" on suggested_sources for insert to anon with check (true);
drop policy if exists "anon can read sources" on suggested_sources;
create policy "anon can read sources" on suggested_sources for select to anon using (true);
