-- Create reading_progress table to track where users left off
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  chapter_number integer not null,
  scroll_position integer default 0,
  progress_percentage integer default 0,
  last_read_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, novel_id)
);

-- Enable RLS
alter table public.reading_progress enable row level security;

-- RLS Policies: Users can only access their own reading progress
create policy "reading_progress_select_own"
  on public.reading_progress for select
  using (auth.uid() = user_id);

create policy "reading_progress_insert_own"
  on public.reading_progress for insert
  with check (auth.uid() = user_id);

create policy "reading_progress_update_own"
  on public.reading_progress for update
  using (auth.uid() = user_id);

create policy "reading_progress_delete_own"
  on public.reading_progress for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists idx_reading_progress_user_novel 
  on public.reading_progress(user_id, novel_id);

create index if not exists idx_reading_progress_last_read 
  on public.reading_progress(user_id, last_read_at desc);

-- Function to automatically update updated_at timestamp
create or replace function public.update_reading_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger to update updated_at on every update
drop trigger if exists reading_progress_updated_at on public.reading_progress;

create trigger reading_progress_updated_at
  before update on public.reading_progress
  for each row
  execute function public.update_reading_progress_updated_at();
