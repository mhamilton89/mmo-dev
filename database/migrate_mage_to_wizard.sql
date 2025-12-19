-- Migration: Rename Mage class to Wizard
-- Run this to update existing Mage characters to Wizard

UPDATE characters
SET class = 'Wizard'
WHERE class = 'Mage';

-- Verify the update
SELECT id, name, class FROM characters WHERE class = 'Wizard';
