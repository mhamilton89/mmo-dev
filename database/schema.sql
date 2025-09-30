-- 2D MMO Database Schema

-- Accounts table (user login)
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters table (multiple characters per account)
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(50) UNIQUE NOT NULL,
    class VARCHAR(20) NOT NULL CHECK (class IN ('Warrior', 'Mage', 'Paladin', 'Rogue')),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,

    -- Position
    x FLOAT DEFAULT 0,
    y FLOAT DEFAULT 0,

    -- Stats
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    mana INTEGER DEFAULT 100,
    max_mana INTEGER DEFAULT 100,

    -- Attributes
    strength INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    dexterity INTEGER DEFAULT 10,
    vitality INTEGER DEFAULT 10,

    -- Additional stats
    attack_power INTEGER DEFAULT 10,
    magic_power INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- World objects table (trees, rocks, NPCs, etc.)
CREATE TABLE IF NOT EXISTS world_objects (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1,
    item_type VARCHAR(50),
    properties JSONB DEFAULT '{}'::jsonb,
    UNIQUE(character_id, item_name)
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    slot VARCHAR(20) NOT NULL CHECK (slot IN ('weapon', 'armor', 'helmet', 'boots', 'gloves', 'accessory')),
    item_name VARCHAR(100),
    properties JSONB DEFAULT '{}'::jsonb,
    UNIQUE(character_id, slot)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_characters_account ON characters(account_id);
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_position ON characters(x, y);
CREATE INDEX IF NOT EXISTS idx_world_objects_position ON world_objects(x, y);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_equipment_character ON equipment(character_id);