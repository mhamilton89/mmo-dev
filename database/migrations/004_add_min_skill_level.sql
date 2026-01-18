-- Add min_skill_level column to map_resources
ALTER TABLE map_resources ADD COLUMN IF NOT EXISTS min_skill_level INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_map_resources_skill ON map_resources(min_skill_level);
