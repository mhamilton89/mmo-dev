-- Migration: Create enemy_spawn_points table
-- Stores parsed Tiled map enemy spawn points from object layer

CREATE TABLE IF NOT EXISTS enemy_spawn_points (
    id SERIAL PRIMARY KEY,
    spawn_id VARCHAR(100) UNIQUE NOT NULL,
    enemy_type VARCHAR(50) NOT NULL,
    world_x FLOAT NOT NULL,
    world_y FLOAT NOT NULL,
    level_min INTEGER DEFAULT 1,
    level_max INTEGER DEFAULT 1,
    respawn_time INTEGER DEFAULT 30000,
    wander_radius INTEGER DEFAULT 100,
    max_count INTEGER DEFAULT 1,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enemy_spawns_position ON enemy_spawn_points(world_x, world_y);
CREATE INDEX IF NOT EXISTS idx_enemy_spawns_type ON enemy_spawn_points(enemy_type);
