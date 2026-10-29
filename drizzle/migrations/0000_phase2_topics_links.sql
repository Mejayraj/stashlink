create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  parent_id uuid references public.topics(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  domain text not null,
  image_url text,
  note text not null default '' check (char_length(note) <= 120),
  topic_id uuid references public.topics(id) on delete set null,
  keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index topics_user_id_idx on public.topics (user_id);
create index links_user_id_idx on public.links (user_id);
create index links_topic_id_idx on public.links (topic_id);

grant select, insert, update, delete on public.topics to authenticated;
grant all on public.topics to service_role;
grant select, insert, update, delete on public.links to authenticated;
grant all on public.links to service_role;

alter table public.topics enable row level security;
alter table public.links enable row level security;

create policy "Users select own topics"
  on public.topics for select to authenticated
  using (auth.uid() = user_id);
create policy "Users insert own topics"
  on public.topics for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update own topics"
  on public.topics for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users delete own topics"
  on public.topics for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users select own links"
  on public.links for select to authenticated
  using (auth.uid() = user_id);
create policy "Users insert own links"
  on public.links for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users update own links"
  on public.links for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users delete own links"
  on public.links for delete to authenticated
  using (auth.uid() = user_id);
