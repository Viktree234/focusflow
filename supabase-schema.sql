-- Supabase schema for Student Productivity Dashboard

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text default 'medium' check (priority in ('low','medium','high')),
  status text default 'todo' check (status in ('todo','doing','done')),
  sort_order bigint default (floor(extract(epoch from now()) * 1000)),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists planner_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  color text default 'blue',
  linked_task_id uuid references tasks(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text default '',
  pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table planner_blocks enable row level security;
alter table notes enable row level security;

create or replace function public.is_self(uid uuid) returns boolean as $$
  select auth.uid() = uid;
$$ language sql security definer;

create policy "users manage own profiles" on profiles for select using (auth.uid() = id);
create policy "users manage own tasks" on tasks for all using (auth.uid() = user_id);
create policy "users manage own planner blocks" on planner_blocks for all using (auth.uid() = user_id);
create policy "users manage own notes" on notes for all using (auth.uid() = user_id);
