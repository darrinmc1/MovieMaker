import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function migrate() {
  console.log("Starting Neon migration...");

  // Drop existing tables to recreate with correct schema
  await sql`DROP TABLE IF EXISTS public.reading_progress CASCADE`;
  await sql`DROP TABLE IF EXISTS public.llm_reviews CASCADE`;
  await sql`DROP TABLE IF EXISTS public.act_versions CASCADE`;
  await sql`DROP TABLE IF EXISTS public.acts CASCADE`;
  await sql`DROP TABLE IF EXISTS public.conflicts CASCADE`;
  await sql`DROP TABLE IF EXISTS public.character_profiles CASCADE`;
  await sql`DROP TABLE IF EXISTS public.chapters CASCADE`;
  await sql`DROP TABLE IF EXISTS public.novels CASCADE`;
  console.log("Dropped existing tables");

  // 1. Create novels table (exact schema from backup)
  await sql`
    CREATE TABLE public.novels (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      title text NOT NULL,
      description text,
      cover_image text,
      genre text,
      status text DEFAULT 'draft',
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
      world_rules jsonb DEFAULT '[]',
      act1 text,
      act2 text,
      act3 text,
      themes text,
      outline text
    )
  `;
  console.log("Created novels table");

  // 2. Create chapters table (exact schema from backup)
  await sql`
    CREATE TABLE public.chapters (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
      chapter_number integer NOT NULL,
      title text NOT NULL,
      content text NOT NULL,
      word_count integer DEFAULT 0,
      status text DEFAULT 'draft',
      published_at timestamp with time zone,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      summary text,
      directors_notes text,
      plot_spoilers text,
      revision_notes text
    )
  `;
  console.log("Created chapters table");

  // 3. Create character_profiles table
  await sql`
    CREATE TABLE public.character_profiles (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE,
      name text NOT NULL,
      role text DEFAULT 'supporting',
      description text,
      traits text[] DEFAULT '{}',
      image_url text,
      first_appearance integer,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `;
  console.log("Created character_profiles table");

  // 4. Create acts table (exact schema from backup)
  await sql`
    CREATE TABLE public.acts (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
      act_number integer NOT NULL,
      title text,
      content text NOT NULL,
      word_count integer DEFAULT 0,
      status text DEFAULT 'draft',
      version integer DEFAULT 1,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `;
  console.log("Created acts table");

  // 5. Create act_versions table (exact schema from backup)
  await sql`
    CREATE TABLE public.act_versions (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      act_id uuid NOT NULL REFERENCES public.acts(id) ON DELETE CASCADE,
      version integer NOT NULL,
      content text NOT NULL,
      word_count integer DEFAULT 0,
      created_by text DEFAULT 'system',
      created_at timestamp with time zone DEFAULT now()
    )
  `;
  console.log("Created act_versions table");

  // 6. Create conflicts table
  await sql`
    CREATE TABLE public.conflicts (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      novel_id uuid REFERENCES public.novels(id) ON DELETE CASCADE,
      title text NOT NULL,
      type text,
      description text,
      status text DEFAULT 'active',
      introduced_chapter integer,
      resolved_chapter integer,
      created_at timestamp with time zone DEFAULT now()
    )
  `;
  console.log("Created conflicts table");

  // 7. Create llm_reviews table
  await sql`
    CREATE TABLE public.llm_reviews (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
      review_type text,
      content text,
      rating integer,
      created_at timestamp with time zone DEFAULT now()
    )
  `;
  console.log("Created llm_reviews table");

  // 8. Create reading_progress table
  await sql`
    CREATE TABLE public.reading_progress (
      id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      user_id uuid NOT NULL,
      novel_id uuid NOT NULL,
      chapter_number integer NOT NULL,
      scroll_position double precision DEFAULT 0,
      progress_percentage double precision DEFAULT 0,
      updated_at timestamp with time zone DEFAULT now(),
      created_at timestamp with time zone DEFAULT now(),
      UNIQUE(user_id, novel_id, chapter_number)
    )
  `;
  console.log("Created reading_progress table");

  console.log("All tables created successfully!");
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
