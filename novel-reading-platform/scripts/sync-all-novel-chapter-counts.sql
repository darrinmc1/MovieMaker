-- Sync chapter counts for all novels
-- This updates total_chapters and published_chapters based on actual chapter data

UPDATE novels
SET 
  total_chapters = (
    SELECT COUNT(*)
    FROM chapters
    WHERE chapters.novel_id = novels.id
  ),
  published_chapters = (
    SELECT COUNT(*)
    FROM chapters
    WHERE chapters.novel_id = novels.id
    AND chapters.status = 'published'
  ),
  updated_at = NOW()
WHERE id IN (SELECT DISTINCT novel_id FROM chapters);

-- Also set counts to 0 for novels with no chapters
UPDATE novels
SET 
  total_chapters = 0,
  published_chapters = 0,
  updated_at = NOW()
WHERE id NOT IN (SELECT DISTINCT novel_id FROM chapters WHERE novel_id IS NOT NULL);
