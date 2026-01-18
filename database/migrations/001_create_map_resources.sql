-- Migration: Create map_resources table
-- Stores parsed Tiled map resources (oak trees, iron ore, etc.)

CREATE TABLE IF NOT EXISTS map_resources (
    id SERIAL PRIMARY KEY,
    resource_id VARCHAR(100) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL,  -- "oak_tree" or "iron_ore"
    tile_x INTEGER NOT NULL,
    tile_y INTEGER NOT NULL,
    world_x FLOAT NOT NULL,
    world_y FLOAT NOT NULL,
    layer_name VARCHAR(50) NOT NULL,
    gid INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_map_resources_position ON map_resources(world_x, world_y);
CREATE INDEX IF NOT EXISTS idx_map_resources_type ON map_resources(resource_type);
