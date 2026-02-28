-- Add series_order column to novels table
ALTER TABLE novels ADD COLUMN IF NOT EXISTS series_order INTEGER;

-- Update existing novels with their series order
-- Book 1: Oath of Flame – The Dragon's Legacy
UPDATE novels SET series_order = 1 WHERE title = 'Oath of Flame – The Dragon''s Legacy';

-- Book 2: [TEST] Tale of Dragons (this is your test book, setting as book 2)
UPDATE novels SET series_order = 2 WHERE title = '[TEST] Tale of Dragons';

-- Book 3: Depthspire – The Dungeon Below
UPDATE novels SET series_order = 3 WHERE title = 'Depthspire – The Dungeon Below';

-- Book 4: Crownless – The Forgotten King
UPDATE novels SET series_order = 4 WHERE title = 'Crownless – The Forgotten King';

-- Book 5: Mimic Hollow – City of Lies
UPDATE novels SET series_order = 5 WHERE title = 'Mimic Hollow – City of Lies';

-- Book 6: Moonveil – Blood of the Eclipse
UPDATE novels SET series_order = 6 WHERE title = 'Moonveil – Blood of the Eclipse';

-- Book 7: Relics of Chance – The Dice of Fate
UPDATE novels SET series_order = 7 WHERE title = 'Relics of Chance – The Dice of Fate';

-- Book 8: Arcana – The Last Spell
UPDATE novels SET series_order = 8 WHERE title = 'Arcana – The Last Spell';

-- Book 9: The Ironmarch Pact – Goblin King Rising
UPDATE novels SET series_order = 9 WHERE title = 'The Ironmarch Pact – Goblin King Rising';

-- Book 10: Wyrmspire's Wake – Beneath the Ash
UPDATE novels SET series_order = 10 WHERE title = 'Wyrmspire''s Wake – Beneath the Ash';

-- Book 11: Initiate the End – Roll for Reality
UPDATE novels SET series_order = 11 WHERE title = 'Initiate the End – Roll for Reality';
