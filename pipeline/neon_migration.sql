-- VBook Pipeline — Neon DB Migration
-- Run this in your Neon SQL editor (console.neon.tech → SQL Editor)
-- Safe to run multiple times — uses IF NOT EXISTS / DO blocks throughout

-- ── 1. Add Drive + pipeline columns to chapters ───────────────────────────────

ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS drive_file_id        text,
  ADD COLUMN IF NOT EXISTS narration_drive_id   text,
  ADD COLUMN IF NOT EXISTS video_drive_id       text,
  ADD COLUMN IF NOT EXISTS scenes_count         integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pipeline_score       integer,
  ADD COLUMN IF NOT EXISTS pipeline_status      text DEFAULT 'pending';

-- ── 2. Drop content column from chapters (content now lives in Drive) ─────────
-- IMPORTANT: Only run this AFTER you have confirmed Drive integration is working
-- and all existing chapter content has been migrated to Drive files.
-- Comment this out if you want to keep content in the DB as a backup for now.

-- ALTER TABLE chapters DROP COLUMN IF EXISTS content;

-- ── 3. Create scenes table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scenes (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id        uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id          uuid NOT NULL REFERENCES novels(id)   ON DELETE CASCADE,
  chapter_number    integer NOT NULL,
  act_number        integer NOT NULL,
  scene_number      integer NOT NULL,
  description       text,
  drive_image_id    text,       -- Google Drive file ID
  image_embed_url   text,       -- thumbnail URL for <img> tags
  characters_present text[],   -- array of character names
  status            text DEFAULT 'generated',
  created_at        timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scenes_chapter_id_idx ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS scenes_novel_id_idx   ON scenes(novel_id);

-- ── 4. Create votes table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS votes (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  novel_id        uuid NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  chapter_number  integer NOT NULL,  -- the UPCOMING chapter being voted on
  option_a        text NOT NULL,
  option_b        text NOT NULL,
  option_c        text NOT NULL,
  votes_a         integer DEFAULT 0,
  votes_b         integer DEFAULT 0,
  votes_c         integer DEFAULT 0,
  winner          text,              -- 'a', 'b', or 'c'
  winner_text     text,
  is_open         boolean DEFAULT true,
  closes_at       timestamp with time zone,
  created_at      timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS votes_novel_chapter_idx ON votes(novel_id, chapter_number);

-- ── 5. Create vote_records table (one row per reader vote) ────────────────────

CREATE TABLE IF NOT EXISTS vote_records (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id         uuid NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  voter_ip        text,              -- IP-based deduplication (anonymous readers)
  option_chosen   text NOT NULL,     -- 'a', 'b', or 'c'
  created_at      timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vote_records_ip_idx ON vote_records(vote_id, voter_ip);

-- ── 6. Remove Supabase-only tables (not needed for anonymous readers) ─────────
-- Only run these if you are fully removing Supabase auth.
-- reading_progress requires user_id (Supabase auth) — either keep or drop.

-- DROP TABLE IF EXISTS reading_progress;

-- ── 7. Verify ────────────────────────────────────────────────────────────────

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
