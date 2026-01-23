-- Migration: Add new equipment slots for full armor set
-- Adds: arms, bracers, legs, shoulder slots

-- Drop the old constraint
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_slot_check;

-- Add new constraint with all slots including new ones
ALTER TABLE equipment ADD CONSTRAINT equipment_slot_check
    CHECK (slot IN ('weapon', 'armor', 'helmet', 'boots', 'gloves', 'accessory', 'arms', 'bracers', 'legs', 'shoulder'));

-- Verify constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'equipment'::regclass AND conname = 'equipment_slot_check';
