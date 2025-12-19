-- Update the CHECK constraint to allow Wizard instead of Mage
-- First, drop the old constraint
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_class_check;

-- Add the new constraint with Wizard
ALTER TABLE characters ADD CONSTRAINT characters_class_check
CHECK (class IN ('Warrior', 'Wizard', 'Paladin', 'Rogue'));

-- Update any existing Mage characters to Wizard
UPDATE characters SET class = 'Wizard' WHERE class = 'Mage';

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'characters'::regclass AND conname = 'characters_class_check';
