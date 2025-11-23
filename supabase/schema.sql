-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This triggers a profile creation when a user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Scans Table
create table scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  url text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table scans enable row level security;

create policy "Users can view their own scans." on scans
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own scans." on scans
  for insert with check ((select auth.uid()) = user_id);

-- Features Table (Gherkin Files)
create table features (
  id uuid default gen_random_uuid() primary key,
  scan_id uuid references scans on delete cascade not null,
  title text not null,
  description text,
  file_path text not null,
  content text not null, -- The full Gherkin content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table features enable row level security;

create policy "Users can view features of their scans." on features
  for select using (
    exists (
      select 1 from scans
      where scans.id = features.scan_id
      and scans.user_id = (select auth.uid())
    )
  );

-- Function to update updated_at on scans
create function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_scan_updated
  before update on scans
  for each row execute procedure public.handle_updated_at();
