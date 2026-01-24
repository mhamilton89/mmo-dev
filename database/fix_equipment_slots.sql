-- Drop the existing check constraint
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_slot_check;

-- Add new check constraint with all the equipment slots the game uses
ALTER TABLE equipment ADD CONSTRAINT equipment_slot_check
CHECK (slot IN (
    'weapon',
    'torso',
    'arms',
    'head',
    'legs',
    'boots',
    'gloves',
    'shoulder',
    'bracers'
));
