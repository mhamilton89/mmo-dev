-- Add gold column to characters table
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0;

-- Set default gold for existing characters
UPDATE characters SET gold = 0 WHERE gold IS NULL;
