-- Add book_number column to novels table
ALTER TABLE novels ADD COLUMN IF NOT EXISTS book_number INTEGER;

-- Update existing novels with their book numbers based on titles
-- Book 1: Oath of Flame – The Dragon's Legacy
UPDATE novels SET book_number = 1 WHERE title LIKE '%Oath of Flame%';

-- Book 2: Depthspire – The Dungeon Below
UPDATE novels SET book_number = 2 WHERE title LIKE '%Depthspire%';

-- Book 3: Crownless – The Forgotten King
UPDATE novels SET book_number = 3 WHERE title LIKE '%Crownless%';

-- Book 4: Mimic Hollow – City of Lies
UPDATE novels SET book_number = 4 WHERE title LIKE '%Mimic Hollow%';

-- Book 5: Moonveil – Blood of the Eclipse
UPDATE novels SET book_number = 5 WHERE title LIKE '%Moonveil%';

-- Book 6: Relics of Chance – The Dice of Fate
UPDATE novels SET book_number = 6 WHERE title LIKE '%Relics of Chance%';

-- Book 7: Arcana – The Last Spell
UPDATE novels SET book_number = 7 WHERE title LIKE '%Arcana%';

-- Book 8: The Ironmarch Pact – Goblin King Rising
UPDATE novels SET book_number = 8 WHERE title LIKE '%Ironmarch%';

-- Book 9: Wyrmspire's Wake – Beneath the Ash
UPDATE novels SET book_number = 9 WHERE title LIKE '%Wyrmspire%';

-- Book 10: Initiate the End – Roll for Reality
UPDATE novels SET book_number = 10 WHERE title LIKE '%Initiate the End%';

-- Book 0: [TEST] Tale of Dragons (test book, set to 0)
UPDATE novels SET book_number = 0 WHERE title LIKE '%[TEST]%';
