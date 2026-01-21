-- Migration: Add gold column to characters table
-- Gold is the in-game currency earned from defeating enemies

ALTER TABLE characters ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0;

-- Update any existing characters to have 0 gold if they don't have a value
UPDATE characters SET gold = 0 WHERE gold IS NULL;

-- Verify migration
SELECT id, name, gold FROM characters LIMIT 5;
