-- Create all public tables on Neon (migrated from Supabase backup)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Novels table
CREATE TABLE IF NOT EXISTS novels (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    cover_image text,
    genre text,
    status text DEFAULT 'draft'::text,
    total_chapters integer DEFAULT 0,
    published_chapters integer DEFAULT 0,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    series_order integer,
    book_number integer,
    author text,
    setting text,
    tone_and_style text,
    world_rules jsonb DEFAULT '[]'::jsonb,
    act1 text,
    act2 text,
    act3 text,
    themes text,
    outline text
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    novel_id uuid NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_number integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    word_count integer DEFAULT 0,
    status text DEFAULT 'draft'::text,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    summary text,
    directors_notes text,
    plot_spoilers text,
    revision_notes text,
    publication_date timestamp with time zone,
    scheduled_for_future boolean DEFAULT false,
    publication_time text
);

-- Character profiles table
CREATE TABLE IF NOT EXISTS character_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    novel_id uuid NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text DEFAULT 'supporting'::text,
    background text,
    personality text,
    abilities text,
    relationships jsonb DEFAULT '[]'::jsonb,
    image_url text,
    first_appearance_chapter integer,
    status text DEFAULT 'active'::text,
    internal_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Acts table
CREATE TABLE IF NOT EXISTS acts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    act_number integer NOT NULL,
    title text,
    content text NOT NULL,
    word_count integer DEFAULT 0,
    status text DEFAULT 'draft'::text,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Act versions table
CREATE TABLE IF NOT EXISTS act_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    act_id uuid NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    version integer NOT NULL,
    content text NOT NULL,
    word_count integer DEFAULT 0,
    created_by text DEFAULT 'system'::text,
    created_at timestamp with time zone DEFAULT now()
);

-- Conflicts table
CREATE TABLE IF NOT EXISTS conflicts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    act_id uuid NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    conflict_type text NOT NULL,
    severity text DEFAULT 'medium'::text,
    description text NOT NULL,
    detected_by text DEFAULT 'system'::text,
    status text DEFAULT 'open'::text,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone
);

-- LLM reviews table
CREATE TABLE IF NOT EXISTS llm_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    act_id uuid NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    version integer NOT NULL,
    llm_model text NOT NULL,
    iteration integer DEFAULT 1 NOT NULL,
    quality_score integer,
    coherence_score integer,
    grammar_score integer,
    creativity_score integer,
    consistency_score integer,
    feedback text,
    suggestions jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT llm_reviews_coherence_score_check CHECK ((coherence_score >= 1) AND (coherence_score <= 10)),
    CONSTRAINT llm_reviews_consistency_score_check CHECK ((consistency_score >= 1) AND (consistency_score <= 10)),
    CONSTRAINT llm_reviews_creativity_score_check CHECK ((creativity_score >= 1) AND (creativity_score <= 10)),
    CONSTRAINT llm_reviews_grammar_score_check CHECK ((grammar_score >= 1) AND (grammar_score <= 10)),
    CONSTRAINT llm_reviews_quality_score_check CHECK ((quality_score >= 1) AND (quality_score <= 10))
);

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    novel_id uuid NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_number integer NOT NULL,
    scroll_position integer DEFAULT 0,
    progress_percentage integer DEFAULT 0,
    last_read_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create unique constraint on reading_progress for user + novel
CREATE UNIQUE INDEX IF NOT EXISTS reading_progress_user_novel_idx ON reading_progress(user_id, novel_id);
