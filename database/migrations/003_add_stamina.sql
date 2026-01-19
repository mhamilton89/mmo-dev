-- Migration: Add stamina attribute and remove defense stat
-- This migration converts the defense stat to stamina attribute

-- Step 1: Add stamina column if it doesn't exist
ALTER TABLE characters ADD COLUMN IF NOT EXISTS stamina INTEGER DEFAULT 10;

-- Step 2: Migrate existing defense values to stamina
-- Convert defense to stamina (1:1 ratio for existing characters)
UPDATE characters
SET stamina = COALESCE(defense, 10)
WHERE stamina IS NULL OR stamina = 0;

-- Step 3: Drop defense column
ALTER TABLE characters DROP COLUMN IF EXISTS defense;

-- Verify migration
SELECT
    id,
    name,
    class,
    stamina,
    strength,
    intelligence,
    dexterity,
    vitality
FROM characters
LIMIT 5;
