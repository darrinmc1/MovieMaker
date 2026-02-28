-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Acts Table
create table if not exists acts (
  id text primary key, -- Keeping original string IDs like 'doc-act-1' for now to avoid breaking links
  chapter_id text not null,
  heading text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Versions Table (One-to-Many with Acts)
create table if not exists act_versions (
  id uuid default uuid_generate_v4() primary key,
  act_id text references acts(id) on delete cascade not null,
  version_id text not null, -- e.g. 'v1-12345'
  text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_current boolean default false
);

-- Characters Table
create table if not exists characters (
  id text primary key, -- 'caelin-thorne'
  name text not null,
  core_want text,
  core_flaw text,
  current_state text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews Table (To store the AI reviews persistently)
create table if not exists reviews (
  id uuid default uuid_generate_v4() primary key,
  act_id text references acts(id) on delete cascade not null,
  version_id text not null,
  persona text not null, -- 'developmental_editor', etc.
  content jsonb not null, -- Full JSON output from Gemini
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table acts enable row level security;
alter table act_versions enable row level security;
alter table characters enable row level security;
alter table reviews enable row level security;

-- Create Policies (Public Read/Write for now for simplicity, can restrict later)
create policy "Public Access Acts" on acts for all using (true);
create policy "Public Access Versions" on act_versions for all using (true);
create policy "Public Access Characters" on characters for all using (true);
create policy "Public Access Reviews" on reviews for all using (true);
