-- Add missing metadata columns to chapters table
ALTER TABLE chapters
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS directors_notes TEXT,
ADD COLUMN IF NOT EXISTS plot_spoilers TEXT,
ADD COLUMN IF NOT EXISTS revision_notes TEXT,
ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_for_future BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS publication_time TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
CREATE INDEX IF NOT EXISTS idx_chapters_publication_date ON chapters(publication_date);

-- Add comment to document the schema
COMMENT ON COLUMN chapters.summary IS 'Brief 2-3 sentence summary shown on chapter list';
COMMENT ON COLUMN chapters.directors_notes IS 'Behind-the-scenes thoughts, optional for readers to view';
COMMENT ON COLUMN chapters.plot_spoilers IS 'Hidden by default with spoiler warning';
COMMENT ON COLUMN chapters.revision_notes IS 'Track changes and improvements between drafts';
