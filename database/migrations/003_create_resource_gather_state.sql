-- Migration: Create resource_gather_state table
-- Tracks multi-hit gathering progress per character per resource

CREATE TABLE IF NOT EXISTS resource_gather_state (
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    resource_id VARCHAR(100) NOT NULL,
    hits INTEGER DEFAULT 0,
    last_hit_time BIGINT,
    PRIMARY KEY (character_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_gather_character ON resource_gather_state(character_id);
CREATE INDEX IF NOT EXISTS idx_resource_gather_resource ON resource_gather_state(resource_id);
