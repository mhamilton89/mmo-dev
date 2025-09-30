const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const db = require('../database/db');
const auth = require('./auth');
const { CLASSES } = require('./classes');

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
app.use(express.static(path.join(__dirname, '../client')));

// Store active players in memory (characterId -> player data)
const activePlayers = new Map();

// Authentication API endpoints
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const result = await auth.register(email, password);

    if (result.success) {
        req.session.accountId = result.account.id;
        req.session.email = result.account.email;
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const result = await auth.login(email, password);

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
            strength: character.strength,
            intelligence: character.intelligence,
            dexterity: character.dexterity,
            vitality: character.vitality,
            attack_power: character.attack_power,
            magic_power: character.magic_power,
            defense: character.defense,
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
                strength: character.strength,
                intelligence: character.intelligence,
                dexterity: character.dexterity,
                vitality: character.vitality,
                attack_power: character.attack_power,
                magic_power: character.magic_power,
                defense: character.defense
            },
            players: Array.from(activePlayers.values()).map(p => ({
                id: p.id,
                name: p.name,
                class: p.class,
                x: p.x,
                y: p.y,
                health: p.health,
                max_health: p.max_health,
                level: p.level
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
                level: character.level
            }
        }, character.id);

        return character.id;

    } catch (error) {
        console.error('Error handling player join:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to join game' }));
        return null;
    }
}

// Handle player movement
async function handlePlayerMove(characterId, data) {
    const player = activePlayers.get(characterId);
    if (!player) return;

    player.x = data.x;
    player.y = data.y;

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

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});