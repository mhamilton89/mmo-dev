const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('../database/db');
const auth = require('./auth');
const { CLASSES } = require('./classes');
const { generateWorldResources, RESOURCE_TYPES, calculateYield, canGather } = require('./resources');
const { startEnemyAI, stopEnemyAI } = require('./enemyAI');
const { loadMapData } = require('./tiledMapParser');
const { ResourceManager } = require('./resource-registry');
const { handleGatherStart, handleGatherComplete, handleGatherCancel } = require('./resourceGathering');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// HTML Page Routes (serve the UI screens) - MUST BE BEFORE static middleware
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.get('/character-select', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/character-select.html'));
});

app.get('/character-create', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/character-create.html'));
});

app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Disable caching for development
app.use(express.static(path.join(__dirname, '../client'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// Store active players in memory (characterId -> player data)
const activePlayers = new Map();

// Store active enemies in memory (enemyId -> enemy data)
const activeEnemies = new Map();

// Store active loot in memory (lootId -> loot data)
const activeLoot = new Map();

// Combat constants
const MELEE_ATTACK_RANGE = 64;  // Range in pixels for melee weapons
const ATTACK_COOLDOWN_MS = 1000; // Minimum 1 second between attacks

// Store world resources - will be loaded from database on startup
let worldResources = [];

// Enemy registry (mirrored from client/enemy-registry.js)
const ENEMY_REGISTRY = {
    skeleton: {
        // Basic Info
        name: 'Skeleton',
        type: 'undead',
        level: 1,

        // Stats
        maxHealth: 100,
        health: 100,
        attackDamage: 10,
        defense: 5,

        // Movement (pixels per second)
        moveSpeed: 80,        // Idle wander speed
        chaseSpeed: 60,       // Speed when chasing player (slower when aggro'd)
        wanderRadius: 100,    // How far from spawn point to wander

        // AI Behavior
        aggroRange: 150,      // Detection radius for players
        deaggroRange: 200,    // Distance from enemy before player escapes (about 6 tiles)
        attackRange: 50,      // Melee attack range
        attackSpeed: 2,       // Attacks per second
        attackCooldown: 2000, // Milliseconds between attacks (1/attackSpeed * 1000)
        returnToSpawnRange: 300, // Distance before giving up chase and returning

        // Respawn
        respawnTime: 30000,   // 30 seconds

        // Loot
        loot: {
            experience: 50,
            gold: { min: 5, max: 15 },
            items: [
                { id: 'bone', chance: 0.8, quantity: [1, 3] },      // 80% chance, 1-3 bones
                { id: 'rusty_sword', chance: 0.1, quantity: 1 }     // 10% chance, 1 sword
            ]
        }
    }
};

// Spawn points loaded from Tiled map (populated on server startup)
let spawnPoints = [];

/**
 * Spawn a single enemy at a spawn point
 */
function spawnEnemyAtPoint(spawnPoint) {
    const template = ENEMY_REGISTRY[spawnPoint.enemyType];
    if (!template) {
        console.error(`[SPAWN] Unknown enemy type: ${spawnPoint.enemyType} at spawn point ${spawnPoint.id}`);
        return null;
    }

    // Check maxCount
    if (spawnPoint.activeEnemies.length >= spawnPoint.maxCount) {
        console.log(`[SPAWN] Spawn point ${spawnPoint.id} already at max capacity (${spawnPoint.maxCount})`);
        return null;
    }

    const enemyId = `${spawnPoint.enemyType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enemy = {
        id: enemyId,
        type: spawnPoint.enemyType,
        name: template.name,
        x: spawnPoint.x,
        y: spawnPoint.y,
        spawnX: spawnPoint.x,
        spawnY: spawnPoint.y,
        health: template.maxHealth,
        maxHealth: template.maxHealth,
        attackDamage: template.attackDamage,
        defense: template.defense,
        level: template.level,
        loot: template.loot,
        state: 'idle',

        // AI state tracking
        target: null,              // Player ID if aggro'd
        lastAttackTime: 0,         // For attack cooldown
        wanderTarget: null,        // { x, y } for wander destination
        aggroTimeout: null,        // Timer to return to spawn
        lastMoveX: 0,              // For direction calculation
        lastMoveY: 0,              // For direction calculation

        // Loot tracking
        damagedBy: new Set(),      // Track players who damaged this enemy

        // Spawn point reference
        spawnPointId: spawnPoint.id
    };

    activeEnemies.set(enemyId, enemy);
    spawnPoint.activeEnemies.push(enemyId);

    console.log(`[SPAWN] Created ${enemy.name} at (${enemy.x}, ${enemy.y}) with ID: ${enemyId} (spawn: ${spawnPoint.id})`);

    // Broadcast new enemy to all players
    broadcast({
        type: 'enemySpawned',
        enemy: {
            id: enemy.id,
            type: enemy.type,
            name: enemy.name,
            level: enemy.level,
            x: enemy.x,
            y: enemy.y,
            health: enemy.health,
            maxHealth: enemy.maxHealth
        }
    });

    return enemy;
}

// Initialize world enemies on server startup
function spawnWorldEnemies() {
    console.log(`[SPAWN] Initializing ${spawnPoints.length} spawn points...`);

    spawnPoints.forEach((spawnPoint) => {
        spawnEnemyAtPoint(spawnPoint);
    });

    console.log(`[SPAWN] Spawned ${activeEnemies.size} enemies across ${spawnPoints.length} spawn points`);
}

// NOTE: Enemies will be spawned after server starts (need broadcast function to exist first)

// Authentication API endpoints
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Username, email and password required' });
    }

    const result = await auth.register(username, email, password);

    if (result.success) {
        req.session.accountId = result.account.id;
        req.session.email = result.account.email;
        req.session.username = result.account.username;
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const result = await auth.login(username, password);

    if (result.success) {
        req.session.accountId = result.account.id;
        req.session.email = result.account.email;
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/session', (req, res) => {
    if (req.session.accountId) {
        res.json({
            authenticated: true,
            accountId: req.session.accountId,
            email: req.session.email
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Character API endpoints
app.get('/api/characters', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characters = await auth.getCharacters(req.session.accountId);
    res.json(characters);
});

app.post('/api/characters', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, class: className } = req.body;

    if (!name || !className) {
        return res.status(400).json({ success: false, message: 'Name and class required' });
    }

    if (!CLASSES[className]) {
        return res.status(400).json({ success: false, message: 'Invalid class' });
    }

    const result = await auth.createCharacter(req.session.accountId, name, className);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

app.delete('/api/characters/:id', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characterId = parseInt(req.params.id);
    const result = await auth.deleteCharacter(characterId, req.session.accountId);

    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

app.get('/api/classes', (req, res) => {
    res.json(CLASSES);
});

// Inventory API endpoint
app.get('/api/inventory/:characterId', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characterId = parseInt(req.params.characterId);

    try {
        // Verify character belongs to this account
        const charResult = await db.query(
            'SELECT account_id FROM characters WHERE id = $1',
            [characterId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }

        if (charResult.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Get inventory
        const inventoryResult = await db.query(
            'SELECT item_name, quantity, item_type, properties FROM inventory WHERE character_id = $1 ORDER BY item_name',
            [characterId]
        );

        res.json(inventoryResult.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Equipment API endpoints
app.get('/api/equipment/:characterId', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characterId = parseInt(req.params.characterId);

    try {
        // Verify character belongs to this account
        const charResult = await db.query(
            'SELECT account_id FROM characters WHERE id = $1',
            [characterId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }

        if (charResult.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Get equipped items
        const equipmentResult = await db.query(
            'SELECT slot, item_name, properties FROM equipment WHERE character_id = $1',
            [characterId]
        );

        res.json(equipmentResult.rows);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/equipment/:characterId', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characterId = parseInt(req.params.characterId);
    const { slot, itemName, properties } = req.body;

    if (!slot || !itemName) {
        return res.status(400).json({ error: 'Slot and item name required' });
    }

    // Validate slot
    const validSlots = ['weapon', 'armor', 'helmet', 'boots', 'gloves', 'accessory'];
    if (!validSlots.includes(slot)) {
        return res.status(400).json({ error: 'Invalid equipment slot' });
    }

    try {
        // Verify character belongs to this account
        const charResult = await db.query(
            'SELECT account_id FROM characters WHERE id = $1',
            [characterId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }

        if (charResult.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Equip the item (upsert)
        const result = await db.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = $3, properties = $4
             RETURNING *`,
            [characterId, slot, itemName, properties || {}]
        );

        res.json({ success: true, equipment: result.rows[0] });
    } catch (error) {
        console.error('Error equipping item:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.delete('/api/equipment/:characterId/:slot', async (req, res) => {
    if (!req.session.accountId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const characterId = parseInt(req.params.characterId);
    const slot = req.params.slot;

    try {
        // Verify character belongs to this account
        const charResult = await db.query(
            'SELECT account_id FROM characters WHERE id = $1',
            [characterId]
        );

        if (charResult.rows.length === 0) {
            return res.status(404).json({ error: 'Character not found' });
        }

        if (charResult.rows[0].account_id !== req.session.accountId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Unequip the item
        const result = await db.query(
            'DELETE FROM equipment WHERE character_id = $1 AND slot = $2 RETURNING *',
            [characterId, slot]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No item equipped in that slot' });
        }

        res.json({ success: true, unequipped: result.rows[0] });
    } catch (error) {
        console.error('Error unequipping item:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    let characterId = null;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'join':
                    characterId = await handlePlayerJoin(ws, data);
                    break;

                case 'move':
                    await handlePlayerMove(characterId, data);
                    break;

                case 'chat':
                    handleChat(characterId, data.message);
                    break;

                case 'gather':
                    await handleGather(characterId, data.resourceId);
                    break;

                case 'gatherStart':
                    {
                        const player = activePlayers.get(characterId);
                        const resource = worldResources.find(r => r.id === data.resourceId);
                        const result = await handleGatherStart(characterId, data.resourceId, player.x, player.y, resource);
                        player.ws.send(JSON.stringify({ type: 'gatherStartResult', ...result }));
                    }
                    break;

                case 'gatherComplete':
                    {
                        const player = activePlayers.get(characterId);
                        const resource = worldResources.find(r => r.id === data.resourceId);
                        const result = await handleGatherComplete(characterId, data.resourceId, resource, worldResources, broadcast);
                        player.ws.send(JSON.stringify({ type: 'gatherCompleteResult', ...result }));
                    }
                    break;

                case 'gatherCancel':
                    {
                        const player = activePlayers.get(characterId);
                        const result = handleGatherCancel(characterId);
                        player.ws.send(JSON.stringify({ type: 'gatherCancelResult', ...result }));
                    }
                    break;

                case 'attack':
                    await handleAttack(characterId, data);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        if (characterId) {
            console.log(`Character ${characterId} disconnected`);
            activePlayers.delete(characterId);
            broadcastPlayerDisconnect(characterId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle player joining
async function handlePlayerJoin(ws, data) {
    const { characterId } = data;

    try {
        // Get character from database
        let result = await db.query(
            'SELECT * FROM characters WHERE id = $1',
            [characterId]
        );

        if (result.rows.length === 0) {
            ws.send(JSON.stringify({ type: 'error', message: 'Character not found' }));
            return null;
        }

        const character = result.rows[0];

        // Get equipped items
        const equipmentResult = await db.query(
            'SELECT slot, item_name, properties FROM equipment WHERE character_id = $1',
            [character.id]
        );
        const equipment = {};
        equipmentResult.rows.forEach(item => {
            equipment[item.slot] = {
                name: item.item_name,
                properties: item.properties
            };
        });

        // Update last played
        await db.query(
            'UPDATE characters SET last_played = CURRENT_TIMESTAMP WHERE id = $1',
            [character.id]
        );

        // Add to active players
        activePlayers.set(character.id, {
            id: character.id,
            name: character.name,
            class: character.class,
            x: character.x,
            y: character.y,
            health: character.health,
            max_health: character.max_health,
            mana: character.mana,
            max_mana: character.max_mana,
            level: character.level,
            experience: character.experience,
            gold: character.gold || 0,
            strength: character.strength,
            intelligence: character.intelligence,
            dexterity: character.dexterity,
            vitality: character.vitality,
            attack_power: character.attack_power,
            magic_power: character.magic_power,
            defense: character.defense,
            equipment: equipment,
            ws: ws
        });

        // Send player their data
        ws.send(JSON.stringify({
            type: 'init',
            character: {
                id: character.id,
                name: character.name,
                class: character.class,
                x: character.x,
                y: character.y,
                health: character.health,
                max_health: character.max_health,
                mana: character.mana,
                max_mana: character.max_mana,
                level: character.level,
                experience: character.experience,
                gold: character.gold || 0,
                strength: character.strength,
                intelligence: character.intelligence,
                dexterity: character.dexterity,
                vitality: character.vitality,
                attack_power: character.attack_power,
                magic_power: character.magic_power,
                defense: character.defense,
                equipment: equipment
            },
            players: Array.from(activePlayers.values()).map(p => ({
                id: p.id,
                name: p.name,
                class: p.class,
                x: p.x,
                y: p.y,
                health: p.health,
                max_health: p.max_health,
                level: p.level,
                equipment: p.equipment || {}
            })),
            resources: worldResources.map(r => ({
                id: r.id,
                type: r.type,
                x: r.x,
                y: r.y,
                available: r.available
            })),
            enemies: Array.from(activeEnemies.values()).map(e => ({
                id: e.id,
                type: e.type,
                name: e.name,
                x: e.x,
                y: e.y,
                health: e.health,
                maxHealth: e.maxHealth,
                level: e.level
            })),
            loot: Array.from(activeLoot.values()).map(l => ({
                id: l.id,
                x: l.x,
                y: l.y,
                gold: l.gold,
                items: l.items
            }))
        }));

        // Broadcast new player to others
        broadcast({
            type: 'playerJoined',
            player: {
                id: character.id,
                name: character.name,
                class: character.class,
                x: character.x,
                y: character.y,
                health: character.health,
                max_health: character.max_health,
                level: character.level,
                equipment: equipment
            }
        }, character.id);

        return character.id;

    } catch (error) {
        console.error('Error handling player join:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to join game' }));
        return null;
    }
}

// Check if player is close enough to collect loot
async function checkLootCollection(player) {
    const LOOT_COLLECTION_RANGE = 32;  // Player must be within 32 pixels of loot

    for (const [lootId, loot] of activeLoot.entries()) {
        const distance = Math.sqrt(
            Math.pow(player.x - loot.x, 2) + Math.pow(player.y - loot.y, 2)
        );

        if (distance <= LOOT_COLLECTION_RANGE) {
            // Check if this player owns this loot
            if (loot.ownerId !== player.id) {
                console.log(`[LOOT] Player ${player.id} tried to collect loot ${lootId} owned by ${loot.ownerId} - denied`);
                continue; // Skip this loot, check for others
            }

            // Player collected their loot
            console.log(`[LOOT] Player ${player.id} collected loot ${lootId} (${loot.gold} gold)`);

            // Update player gold in database
            try {
                const result = await db.query(
                    'UPDATE characters SET gold = gold + $1 WHERE id = $2 RETURNING gold',
                    [loot.gold, player.id]
                );

                // Update player's in-memory gold value
                if (result.rows.length > 0) {
                    player.gold = result.rows[0].gold;
                    console.log(`[LOOT] Player ${player.id} now has ${player.gold} gold`);
                }
            } catch (error) {
                console.error('[LOOT] Error updating player gold:', error);
            }

            // Remove loot from world
            activeLoot.delete(lootId);

            // Show collection message to player with updated total
            if (player.ws && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify({
                    type: 'lootPickup',
                    gold: loot.gold,
                    totalGold: player.gold,
                    items: loot.items,
                    lootId: lootId  // For client to remove sprite
                }));
            }

            // Only collect one loot item per movement update
            break;
        }
    }
}

// Handle player movement
async function handlePlayerMove(characterId, data) {
    const player = activePlayers.get(characterId);
    if (!player) return;

    player.x = data.x;
    player.y = data.y;

    // Check for loot collection
    checkLootCollection(player);

    // Update database
    await db.query(
        'UPDATE characters SET x = $1, y = $2 WHERE id = $3',
        [data.x, data.y, characterId]
    );

    // Broadcast movement to all players
    broadcast({
        type: 'playerMoved',
        playerId: characterId,
        x: data.x,
        y: data.y
    }, characterId);
}

// Handle chat messages
function handleChat(characterId, message) {
    const player = activePlayers.get(characterId);
    if (!player) return;

    broadcast({
        type: 'chat',
        playerId: characterId,
        name: player.name,
        message: message
    });
}

// Handle gathering resources
async function handleGather(characterId, resourceId) {
    const player = activePlayers.get(characterId);
    if (!player) return;

    // Find the resource
    const resource = worldResources.find(r => r.id === resourceId);
    if (!resource || !resource.available) {
        player.ws.send(JSON.stringify({
            type: 'gatherFailed',
            message: 'Resource not available'
        }));
        return;
    }

    // Check if player is close enough
    if (!canGather(player.x, player.y, resource.x, resource.y)) {
        player.ws.send(JSON.stringify({
            type: 'gatherFailed',
            message: 'Too far away'
        }));
        return;
    }

    // Mark resource as depleted
    resource.available = false;

    // Calculate yield
    const yields = calculateYield(resource.type);

    // Add items to inventory
    for (const item of yields) {
        await db.query(
            `INSERT INTO inventory (character_id, item_name, quantity, item_type)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (character_id, item_name)
             DO UPDATE SET quantity = inventory.quantity + $3`,
            [characterId, item.item, item.quantity, 'resource']
        );
    }

    // Send success message to player
    player.ws.send(JSON.stringify({
        type: 'gatherSuccess',
        resourceId: resourceId,
        yields: yields
    }));

    // Broadcast resource depletion to all players
    broadcast({
        type: 'resourceDepleted',
        resourceId: resourceId
    });

    // Schedule respawn
    const resourceConfig = RESOURCE_TYPES[resource.type];
    resource.respawnTimer = setTimeout(() => {
        resource.available = true;
        broadcast({
            type: 'resourceRespawned',
            resourceId: resourceId
        });
    }, resourceConfig.respawnTime);
}

// Handle player attack
async function handleAttack(characterId, data) {
    const player = activePlayers.get(characterId);
    if (!player) return;

    const { targetIds, attackType, playerPosition, playerDirection } = data;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
        console.log(`[COMBAT] Invalid attack from ${characterId}: no targets`);
        return;
    }

    // Check attack cooldown
    const now = Date.now();
    if (player.lastAttackTime && now - player.lastAttackTime < ATTACK_COOLDOWN_MS) {
        console.log(`[COMBAT] Attack rejected for ${characterId}: cooldown active`);
        return;
    }

    player.lastAttackTime = now;

    console.log(`[COMBAT] Processing attack from ${characterId} on ${targetIds.length} target(s)`);

    // Validate each target and calculate damage
    for (const targetId of targetIds) {
        const enemy = activeEnemies.get(targetId);

        if (!enemy) {
            console.log(`[COMBAT] Target ${targetId} not found in activeEnemies`);
            continue;
        }

        // Validate range - recalculate server-side distance
        const dx = enemy.x - playerPosition.x;
        const dy = enemy.y - playerPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > MELEE_ATTACK_RANGE) {
            console.log(`[COMBAT] Target ${targetId} out of range: ${distance.toFixed(1)}px (max: ${MELEE_ATTACK_RANGE}px)`);
            continue;
        }

        // Calculate damage (placeholder formula - use weapon stats)
        // TODO: Get actual weapon from player's equipment
        const baseDamage = 25;  // From weapon_waraxe config
        const damage = Math.floor(baseDamage * (0.8 + Math.random() * 0.4)); // Random 80-120%

        // Track player who damaged this enemy (for loot eligibility)
        enemy.damagedBy.add(characterId);

        // Update enemy health
        enemy.health -= damage;
        const isDead = enemy.health <= 0;

        if (isDead) {
            enemy.health = 0;
        }

        console.log(`[COMBAT] ${characterId} hit ${targetId} for ${damage} damage (${enemy.health}/${enemy.maxHealth} HP)`);

        // Broadcast damage event to all players
        broadcast({
            type: 'damage',
            attackerId: characterId,
            targetId: targetId,
            damage: damage,
            targetHealth: enemy.health,
            targetMaxHealth: enemy.maxHealth,
            hitTargets: targetIds  // All targets hit by this attack
        });

        // Handle enemy death
        if (isDead) {
            console.log(`[COMBAT] Enemy ${targetId} defeated!`);

            // Get enemy template for loot calculation
            const template = ENEMY_REGISTRY[enemy.type];

            // Calculate XP from registry
            const experience = template.loot?.experience || 50;

            // Get list of players who damaged this enemy
            const eligiblePlayers = Array.from(enemy.damagedBy);
            console.log(`[LOOT] Enemy defeated by ${eligiblePlayers.length} player(s): ${eligiblePlayers.join(', ')}`);

            // Create individual loot for each eligible player
            eligiblePlayers.forEach(playerId => {
                // Calculate gold from registry (each player gets their own random roll)
                const goldMin = template.loot?.gold?.min || 5;
                const goldMax = template.loot?.gold?.max || 15;
                const goldAmount = Math.floor(Math.random() * (goldMax - goldMin + 1)) + goldMin;

                // Create player-specific loot
                const lootId = `loot_${Date.now()}_${playerId}_${Math.random()}`;
                const lootData = {
                    id: lootId,
                    x: enemy.x,
                    y: enemy.y,
                    gold: goldAmount,
                    items: [],  // Future: roll for item drops
                    ownerId: playerId,  // Only this player can collect it
                    spawnTime: Date.now()
                };

                // Add to active loot tracking
                activeLoot.set(lootId, lootData);

                // Schedule loot despawn after 60 seconds
                setTimeout(() => {
                    if (activeLoot.has(lootId)) {
                        activeLoot.delete(lootId);

                        // Send despawn only to the owner
                        const player = activePlayers.get(playerId);
                        if (player && player.ws.readyState === WebSocket.OPEN) {
                            player.ws.send(JSON.stringify({
                                type: 'lootDespawn',
                                lootId: lootId
                            }));
                        }
                        console.log(`[LOOT] Despawned uncollected loot ${lootId} (owner: ${playerId})`);
                    }
                }, 60000);

                console.log(`[LOOT] Created ${goldAmount} gold for player ${playerId} at (${enemy.x}, ${enemy.y})`);

                // Send loot spawn only to the owner
                const player = activePlayers.get(playerId);
                if (player && player.ws.readyState === WebSocket.OPEN) {
                    player.ws.send(JSON.stringify({
                        type: 'lootSpawn',
                        loot: {
                            id: lootId,
                            x: enemy.x,
                            y: enemy.y,
                            gold: goldAmount
                        }
                    }));
                }

                // Give XP to each eligible player
                db.query(
                    `UPDATE characters SET experience = experience + $1 WHERE id = $2`,
                    [experience, playerId]
                ).catch(err => console.error('[LOOT] Error updating XP:', err));
            });

            const loot = { gold: 'player-specific', items: [] };

            // Broadcast enemy death (without loot info - loot is player-specific now)
            broadcast({
                type: 'enemyDeath',
                enemyId: targetId,
                killerId: characterId,
                loot: loot,
                experience: experience
            });

            // Find the spawn point for this enemy
            const spawnPointId = enemy.spawnPointId;
            const spawnPoint = spawnPoints.find(sp => sp.id === spawnPointId);

            // Remove enemy from activeEnemies and spawn point tracking
            activeEnemies.delete(targetId);
            if (spawnPoint) {
                const enemyIndex = spawnPoint.activeEnemies.indexOf(targetId);
                if (enemyIndex > -1) {
                    spawnPoint.activeEnemies.splice(enemyIndex, 1);
                }

                // Schedule respawn
                const template = ENEMY_REGISTRY[enemy.type];
                const respawnTime = template.respawnTime || 30000;

                console.log(`[SPAWN] Scheduling respawn for ${enemy.name} at spawn point ${spawnPointId} in ${respawnTime}ms`);

                setTimeout(() => {
                    spawnEnemyAtPoint(spawnPoint);
                }, respawnTime);
            }
        }
    }
}

// Broadcast to all players except sender
function broadcast(data, excludePlayerId = null) {
    const message = JSON.stringify(data);
    activePlayers.forEach((player, id) => {
        if (id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(message);
        }
    });
}

// Broadcast player disconnect
function broadcastPlayerDisconnect(playerId) {
    broadcast({
        type: 'playerLeft',
        playerId: playerId
    });
}

// REST API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        players: activePlayers.size,
        uptime: process.uptime()
    });
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, class, level, experience, created_at FROM characters ORDER BY level DESC, experience DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Broadcast enemy positions every 100ms
setInterval(() => {
    if (activeEnemies.size === 0) return;

    const enemyUpdates = Array.from(activeEnemies.values()).map(enemy => ({
        id: enemy.id,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        state: enemy.state,
        health: enemy.health,
        maxHealth: enemy.maxHealth,
        direction: calculateEnemyDirection(enemy)
    }));

    broadcast({
        type: 'enemyUpdate',
        enemies: enemyUpdates
    });
}, 100);

// Helper to calculate enemy direction for animation
function calculateEnemyDirection(enemy) {
    // Use last movement direction if available
    if (!enemy.lastMoveX && !enemy.lastMoveY) {
        return 'down'; // Default when not moving
    }

    const absX = Math.abs(enemy.lastMoveX);
    const absY = Math.abs(enemy.lastMoveY);

    // Determine primary direction based on larger movement component
    if (absX > absY) {
        return enemy.lastMoveX > 0 ? 'right' : 'left';
    } else {
        return enemy.lastMoveY > 0 ? 'down' : 'up';
    }
}

// Start server
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);

    // Load map data on startup (registry pattern - no DB dependency)
    try {
        // Parse Tiled map (no DB dependency - always parses on startup)
        const { resources: resourcePositions, spawns: parsedSpawns } = loadMapData();

        // Create resource instances from registry templates + positions
        worldResources = resourcePositions.map(pos =>
            ResourceManager.createResourceInstance(pos.type, pos)
        ).filter(r => r !== null);  // Filter out any invalid types

        console.log(`Loaded ${worldResources.length} resources from map`);

        // Initialize spawn points with runtime state
        spawnPoints = parsedSpawns.map(spawn => ({
            ...spawn,
            activeEnemies: [],     // Array of enemy IDs currently spawned here
            respawnQueue: []       // Enemies waiting to respawn
        }));
        console.log(`Loaded ${spawnPoints.length} enemy spawn points from map`);
    } catch (error) {
        console.error('Error loading map data:', error);
        console.log('Continuing with empty resource and spawn lists');
        worldResources = [];
        spawnPoints = [];
    }

    // Spawn world enemies (now that broadcast function exists)
    spawnWorldEnemies();

    // Start enemy AI system
    startEnemyAI({
        activeEnemies,
        activePlayers,
        ENEMY_REGISTRY,
        broadcast
    });
});