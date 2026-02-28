-- Create novels table
create table if not exists public.novels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image text,
  genre text,
  status text default 'draft',
  total_chapters integer default 0,
  published_chapters integer default 0,
  views integer default 0,
  likes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create chapters table
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  novel_id uuid not null references public.novels(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  content text not null,
  word_count integer default 0,
  status text default 'draft',
  published_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(novel_id, chapter_number)
);

-- Create indexes for better query performance
create index if not exists idx_chapters_novel_id on public.chapters(novel_id);
create index if not exists idx_chapters_status on public.chapters(status);
create index if not exists idx_novels_status on public.novels(status);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers to automatically update updated_at
drop trigger if exists update_novels_updated_at on public.novels;
create trigger update_novels_updated_at
  before update on public.novels
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_chapters_updated_at on public.chapters;
create trigger update_chapters_updated_at
  before update on public.chapters
  for each row
  execute function public.update_updated_at_column();

-- Create function to update novel chapter counts
create or replace function public.update_novel_chapter_counts()
returns trigger as $$
begin
  update public.novels
  set 
    total_chapters = (
      select count(*) 
      from public.chapters 
      where novel_id = coalesce(new.novel_id, old.novel_id)
    ),
    published_chapters = (
      select count(*) 
      from public.chapters 
      where novel_id = coalesce(new.novel_id, old.novel_id) 
      and status = 'published'
    )
  where id = coalesce(new.novel_id, old.novel_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- Create trigger to automatically update chapter counts
drop trigger if exists update_novel_counts_on_chapter_change on public.chapters;
create trigger update_novel_counts_on_chapter_change
  after insert or update or delete on public.chapters
  for each row
  execute function public.update_novel_chapter_counts();
