// Global game state
const gameState = {
    ws: null,
    character: null,
    selectedClass: null,
    classes: {},
    phaserGame: null,
    currentScene: null,
    inventory: []
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    // Check if already logged in
    const session = await checkSession();
    if (session.authenticated) {
        showCharacterSelect();
    } else {
        showAuthScreen();
    }

    setupAuthListeners();
    setupCharacterSelectListeners();
    setupCharacterCreateListeners();
}

// ===== AUTH SCREEN =====
function showAuthScreen() {
    hideAllScreens();
    document.getElementById('auth-screen').style.display = 'flex';
}

function setupAuthListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Login
    document.getElementById('login-button').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Register
    document.getElementById('register-button').addEventListener('click', handleRegister);
    document.getElementById('register-confirm').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    document.querySelector(`.tab-button[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.textContent = '';

    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showCharacterSelect();
        } else {
            errorDiv.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error';
        console.error('Login error:', error);
    }
}

async function handleRegister() {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorDiv = document.getElementById('register-error');

    errorDiv.textContent = '';

    if (!email || !password || !confirm) {
        errorDiv.textContent = 'Please fill in all fields';
        return;
    }

    if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showCharacterSelect();
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error';
        console.error('Register error:', error);
    }
}

async function checkSession() {
    try {
        const response = await fetch('/api/session', { credentials: 'include' });
        return await response.json();
    } catch (error) {
        return { authenticated: false };
    }
}

// ===== CHARACTER SELECT SCREEN =====
async function showCharacterSelect() {
    hideAllScreens();
    document.getElementById('character-select-screen').style.display = 'flex';
    await loadCharacters();
}

function setupCharacterSelectListeners() {
    document.getElementById('create-character-button').addEventListener('click', showCharacterCreate);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
}

async function loadCharacters() {
    try {
        const response = await fetch('/api/characters', { credentials: 'include' });
        const characters = await response.json();

        const listDiv = document.getElementById('character-list');
        listDiv.innerHTML = '';

        if (characters.length === 0) {
            listDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No characters yet. Create one to start playing!</p>';
            return;
        }

        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            const spriteUrl = `assets/characters/${char.class.toLowerCase()}_south.png`;
            card.innerHTML = `
                <img src="${spriteUrl}" alt="${char.class}" class="character-sprite" style="width: 96px; height: 96px; image-rendering: pixelated; image-rendering: crisp-edges;">
                <div class="character-info">
                    <h3>${char.name}</h3>
                    <p>${char.class} - Level ${char.level}</p>
                </div>
                <div class="character-stats">
                    <p>Experience: ${char.experience}</p>
                    <p>Last Played: ${new Date(char.last_played).toLocaleDateString()}</p>
                </div>
                <button class="delete-button" onclick="deleteCharacter(${char.id}, event)">Delete</button>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-button')) {
                    selectCharacter(char.id);
                }
            });

            listDiv.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

async function deleteCharacter(characterId, event) {
    event.stopPropagation();

    if (!confirm('Are you sure you want to delete this character?')) {
        return;
    }

    try {
        const response = await fetch(`/api/characters/${characterId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            await loadCharacters();
        }
    } catch (error) {
        console.error('Error deleting character:', error);
    }
}

function selectCharacter(characterId) {
    startGame(characterId);
}

async function handleLogout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        showAuthScreen();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ===== CHARACTER CREATE SCREEN =====
async function showCharacterCreate() {
    hideAllScreens();
    document.getElementById('character-create-screen').style.display = 'flex';
    await loadClasses();
}

function setupCharacterCreateListeners() {
    document.getElementById('confirm-create-button').addEventListener('click', handleCreateCharacter);
    document.getElementById('cancel-create-button').addEventListener('click', showCharacterSelect);
}

async function loadClasses() {
    try {
        const response = await fetch('/api/classes');
        gameState.classes = await response.json();

        const grid = document.getElementById('class-selection');
        grid.innerHTML = '';

        Object.keys(gameState.classes).forEach(className => {
            const classData = gameState.classes[className];
            const card = document.createElement('div');
            card.className = 'class-card';
            card.dataset.class = className;
            const spriteUrl = `assets/characters/${className.toLowerCase()}_south.png`;
            card.innerHTML = `
                <img src="${spriteUrl}" alt="${className}" class="class-sprite" style="width: 96px; height: 96px; image-rendering: pixelated; image-rendering: crisp-edges;">
                <h3>${className}</h3>
            `;

            card.addEventListener('click', () => selectClass(className));
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function selectClass(className) {
    // Update selection
    document.querySelectorAll('.class-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.class-card[data-class="${className}"]`).classList.add('selected');

    gameState.selectedClass = className;

    // Show class info
    const classData = gameState.classes[className];
    document.getElementById('class-info-name').textContent = className;
    document.getElementById('class-info-description').textContent = classData.description;

    const statsDiv = document.getElementById('class-info-stats');
    statsDiv.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Health</span>
            <span class="stat-value">${classData.health}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Mana</span>
            <span class="stat-value">${classData.mana}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Strength</span>
            <span class="stat-value">${classData.strength}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Intelligence</span>
            <span class="stat-value">${classData.intelligence}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Dexterity</span>
            <span class="stat-value">${classData.dexterity}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Vitality</span>
            <span class="stat-value">${classData.vitality}</span>
        </div>
    `;
}

async function handleCreateCharacter() {
    const name = document.getElementById('character-name-input').value.trim();
    const errorDiv = document.getElementById('character-create-error');

    errorDiv.textContent = '';

    if (!name) {
        errorDiv.textContent = 'Please enter a character name';
        return;
    }

    if (!gameState.selectedClass) {
        errorDiv.textContent = 'Please select a class';
        return;
    }

    try {
        const response = await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, class: gameState.selectedClass })
        });

        const data = await response.json();

        if (data.success) {
            showCharacterSelect();
        } else {
            errorDiv.textContent = data.message || 'Character creation failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error';
        console.error('Create character error:', error);
    }
}

// ===== PHASER GAME =====

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
        this.player = null;
        this.players = new Map();
        this.playerSprites = new Map();
        this.cursors = null;
        this.wasd = null;
        this.resources = new Map();
        this.resourceSprites = new Map();
        this.nearestResource = null;
        this.interactionText = null;
    }

    preload() {
        // Load pixel art character sprites
        const classes = ['Warrior', 'Mage', 'Paladin', 'Rogue'];
        const directions = ['south', 'north', 'east', 'west'];

        console.log('Preloading character sprites...');

        classes.forEach(className => {
            directions.forEach(dir => {
                const key = `${className.toLowerCase()}_${dir}`;
                const path = `assets/characters/${className.toLowerCase()}_${dir}.png`;
                console.log(`Loading: ${key} from ${path}`);
                this.load.image(key, path);
            });
        });

        // Load resource sprites
        console.log('Preloading resource sprites...');
        this.load.image('tree', 'assets/resources/tree.png');
        this.load.image('iron_ore', 'assets/resources/iron_ore.png');
        this.load.image('copper_ore', 'assets/resources/copper_ore.png');

        // Load tilemap
        console.log('Preloading tilemap...');
        this.load.tilemapTiledJSON('map', 'assets/resources/map_1.json');
        this.load.image('tiles', 'assets/resources/32x32_map_tile v3.1 [MARGINLESS].png');

        this.load.on('filecomplete', (key, type, data) => {
            console.log('Loaded:', key);
        });

        this.load.on('loaderror', (file) => {
            console.error('Load error:', file.key, file.src);
        });
    }

    create() {
        // Create red triangle texture for test items
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.beginPath();
        graphics.moveTo(16, 0);
        graphics.lineTo(32, 32);
        graphics.lineTo(0, 32);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('test_item', 32, 32);
        graphics.destroy();

        // Map dimensions: 30 tiles × 20 tiles × 32px = 960x640
        const mapWidth = 960;
        const mapHeight = 640;

        // Set world bounds to match map
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        // Create tilemap
        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('map_tiles', 'tiles');

        // Create layers
        const baseLayer = map.createLayer('Tile Layer 1', tileset, 0, 0);
        const objectLayer = map.createLayer('Tile Layer 2', tileset, 0, 0);

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // Store scene reference globally
        gameState.currentScene = this;
        console.log('Scene created and ready');

        // Setup camera
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

        // Now that scene is ready, send join message if WebSocket is connected
        if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN && gameState.pendingCharacterId) {
            console.log('Scene ready, sending delayed join message');
            gameState.ws.send(JSON.stringify({
                type: 'join',
                characterId: gameState.pendingCharacterId
            }));
            gameState.pendingCharacterId = null;
        }
    }

    createPlayer(character) {
        // Create player sprite with class-specific texture
        const spriteKey = `${character.class.toLowerCase()}_south`;
        console.log('Creating player with sprite key:', spriteKey, 'at position:', character.x, character.y);
        console.log('Texture exists:', this.textures.exists(spriteKey));
        const sprite = this.physics.add.sprite(character.x, character.y, spriteKey);
        sprite.setCollideWorldBounds(true);
        sprite.currentDirection = 'south';
        sprite.className = character.class;
        // Scale up the sprite (48px sprites are small)
        sprite.setScale(2);
        console.log('Player sprite created:', sprite, 'Display size:', sprite.displayWidth, 'x', sprite.displayHeight);

        // Add name text
        const nameText = this.add.text(0, -40, character.name, {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        nameText.setOrigin(0.5);

        // Add class text
        const classText = this.add.text(0, -25, character.class, {
            fontSize: '12px',
            fill: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 2
        });
        classText.setOrigin(0.5);

        // Create health bar
        const healthBarBg = this.add.rectangle(0, 25, 40, 5, 0x000000, 0.5);
        const healthBar = this.add.rectangle(0, 25, 40, 5, 0x22c55e);
        healthBar.setOrigin(0, 0.5);
        healthBarBg.setOrigin(0, 0.5);

        sprite.nameText = nameText;
        sprite.classText = classText;
        sprite.healthBar = healthBar;
        sprite.healthBarBg = healthBarBg;
        sprite.characterData = character;

        this.player = sprite;

        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        return sprite;
    }

    createOtherPlayer(playerData) {
        const spriteKey = `${playerData.class.toLowerCase()}_south`;
        const sprite = this.physics.add.sprite(playerData.x, playerData.y, spriteKey);
        sprite.setCollideWorldBounds(true);
        sprite.currentDirection = 'south';
        sprite.className = playerData.class;
        // Scale up the sprite (48px sprites are small)
        sprite.setScale(2);

        // Add name text
        const nameText = this.add.text(0, -40, playerData.name, {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        nameText.setOrigin(0.5);

        // Add class text
        const classText = this.add.text(0, -25, playerData.class, {
            fontSize: '12px',
            fill: '#fbbf24',
            stroke: '#000000',
            strokeThickness: 2
        });
        classText.setOrigin(0.5);

        // Create health bar
        const healthBarBg = this.add.rectangle(0, 25, 40, 5, 0x000000, 0.5);
        const healthPercent = playerData.health / playerData.max_health;
        const barColor = healthPercent > 0.5 ? 0x22c55e : healthPercent > 0.25 ? 0xf59e0b : 0xef4444;
        const healthBar = this.add.rectangle(0, 25, 40 * healthPercent, 5, barColor);
        healthBar.setOrigin(0, 0.5);
        healthBarBg.setOrigin(0, 0.5);

        sprite.nameText = nameText;
        sprite.classText = classText;
        sprite.healthBar = healthBar;
        sprite.healthBarBg = healthBarBg;
        sprite.playerData = playerData;

        this.playerSprites.set(playerData.id, sprite);
        this.players.set(playerData.id, playerData);

        return sprite;
    }

    removePlayer(playerId) {
        const sprite = this.playerSprites.get(playerId);
        if (sprite) {
            sprite.nameText.destroy();
            sprite.classText.destroy();
            sprite.healthBar.destroy();
            sprite.healthBarBg.destroy();
            sprite.destroy();
            this.playerSprites.delete(playerId);
            this.players.delete(playerId);
        }
    }

    updateOtherPlayer(playerId, x, y) {
        const sprite = this.playerSprites.get(playerId);
        if (sprite) {
            // Smooth interpolation
            this.tweens.add({
                targets: sprite,
                x: x,
                y: y,
                duration: 100,
                ease: 'Linear'
            });
        }
    }

    update() {
        if (!this.player) return;

        // Handle player movement
        let velocityX = 0;
        let velocityY = 0;
        const speed = 200;

        if (this.cursors.left.isDown || this.wasd.a.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.wasd.d.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.wasd.w.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.wasd.s.isDown) {
            velocityY = speed;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        this.player.setVelocity(velocityX, velocityY);

        // Update sprite direction based on movement
        if (velocityX !== 0 || velocityY !== 0) {
            let newDirection = 'south';
            if (Math.abs(velocityX) > Math.abs(velocityY)) {
                // Moving horizontally
                newDirection = velocityX > 0 ? 'east' : 'west';
            } else {
                // Moving vertically
                newDirection = velocityY > 0 ? 'south' : 'north';
            }

            if (this.player.currentDirection !== newDirection) {
                this.player.currentDirection = newDirection;
                const spriteKey = `${this.player.className.toLowerCase()}_${newDirection}`;
                this.player.setTexture(spriteKey);
            }
        }

        // Update name and health bar positions
        this.updatePlayerUI(this.player);

        // Update other players' UI
        this.playerSprites.forEach(sprite => {
            this.updatePlayerUI(sprite);
        });

        // Send position to server if moved
        if (velocityX !== 0 || velocityY !== 0) {
            if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                gameState.ws.send(JSON.stringify({
                    type: 'move',
                    x: this.player.x,
                    y: this.player.y
                }));
            }
        }

        // Find nearest resource
        this.nearestResource = null;
        let nearestDistance = Infinity;
        const gatherDistance = 100; // Must be within 100 pixels

        this.resources.forEach((resource, id) => {
            if (!resource.available) return;

            const sprite = this.resourceSprites.get(id);
            if (!sprite) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                sprite.x, sprite.y
            );

            if (distance < gatherDistance && distance < nearestDistance) {
                nearestDistance = distance;
                this.nearestResource = { id, distance, sprite, resource };
            }
        });

        // Update interaction text
        if (this.nearestResource) {
            if (!this.interactionText) {
                this.interactionText = this.add.text(0, 0, '', {
                    fontSize: '16px',
                    fill: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                });
                this.interactionText.setDepth(1000);
                this.interactionText.setScrollFactor(0);
            }

            const resourceName = this.nearestResource.resource.type.replace('_', ' ');
            this.interactionText.setText(`Press E to gather ${resourceName}`);
            this.interactionText.setPosition(
                this.cameras.main.width / 2 - this.interactionText.width / 2,
                this.cameras.main.height - 50
            );
            this.interactionText.setVisible(true);
        } else if (this.interactionText) {
            this.interactionText.setVisible(false);
        }

        // Handle E key for gathering
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
            if (this.nearestResource) {
                console.log('Gathering resource:', this.nearestResource.resource.type);
                if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                    gameState.ws.send(JSON.stringify({
                        type: 'gather',
                        resourceId: this.nearestResource.id
                    }));
                }
            }
        }
    }

    updatePlayerUI(sprite) {
        if (sprite.nameText) {
            sprite.nameText.setPosition(sprite.x, sprite.y - 40);
        }
        if (sprite.classText) {
            sprite.classText.setPosition(sprite.x, sprite.y - 25);
        }
        if (sprite.healthBar) {
            sprite.healthBar.setPosition(sprite.x - 20, sprite.y + 25);
        }
        if (sprite.healthBarBg) {
            sprite.healthBarBg.setPosition(sprite.x - 20, sprite.y + 25);
        }
    }

    renderResources(resources) {
        console.log(`Rendering ${resources.length} resources`);
        resources.forEach(resource => {
            this.resources.set(resource.id, resource);

            // Create sprite based on resource type
            const sprite = this.add.sprite(resource.x, resource.y, resource.type);

            // Scale resources appropriately
            if (resource.type === 'tree') {
                sprite.setScale(1.5); // Trees are larger
            } else {
                sprite.setScale(1); // Ore nodes normal size
            }

            sprite.setDepth(0); // Resources behind players
            this.resourceSprites.set(resource.id, sprite);

            // Store resource ID on sprite for easy access
            sprite.resourceId = resource.id;

            // Hide if not available
            if (!resource.available) {
                sprite.setAlpha(0.3);
            }
        });
    }
}

function startGame(characterId) {
    hideAllScreens();
    document.getElementById('game-container').style.display = 'flex';

    setupChatInput();
    setupInventoryListeners();

    // Calculate game dimensions
    const hudHeight = 50;
    const chatHeight = 200;
    const gameHeight = window.innerHeight - hudHeight - chatHeight;
    const gameWidth = window.innerWidth;

    // Create Phaser game
    const config = {
        type: Phaser.AUTO,
        width: gameWidth,
        height: gameHeight,
        parent: 'phaser-game',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: MainScene,
        backgroundColor: '#2d5016'
    };

    gameState.phaserGame = new Phaser.Game(config);

    // Connect to server
    connectToServer(characterId);
}

function connectToServer(characterId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port || 3000}`;

    gameState.ws = new WebSocket(wsUrl);
    gameState.pendingCharacterId = characterId;

    gameState.ws.onopen = () => {
        console.log('Connected to server');
        // Don't send join immediately - wait for scene to be ready
        if (gameState.currentScene) {
            console.log('Scene ready, sending join');
            gameState.ws.send(JSON.stringify({
                type: 'join',
                characterId: characterId
            }));
        } else {
            console.log('Scene not ready yet, waiting...');
        }
    };

    gameState.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
    };

    gameState.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addChatMessage('Connection error', 'system');
    };

    gameState.ws.onclose = () => {
        console.log('Disconnected from server');
        addChatMessage('Disconnected from server', 'system');
    };
}

function handleServerMessage(data) {
    const scene = gameState.currentScene;
    console.log('Server message:', data.type, 'Scene exists:', !!scene);

    switch (data.type) {
        case 'init':
            console.log('Init message received, character:', data.character);
            gameState.character = data.character;

            // Create player in scene
            if (scene) {
                console.log('Scene exists, calling createPlayer');
                scene.createPlayer(data.character);
            } else {
                console.error('Scene does not exist yet!');
            }

            // Create other players
            data.players.forEach(p => {
                if (p.id !== gameState.character.id && scene) {
                    scene.createOtherPlayer(p);
                }
            });

            // Render resources
            if (scene && data.resources) {
                scene.renderResources(data.resources);
            }

            updateHUD();
            addChatMessage(`Welcome, ${gameState.character.name}!`, 'system');
            document.getElementById('online-players').textContent = data.players.length;

            // Load inventory
            loadInventory();
            break;

        case 'playerJoined':
            if (scene) {
                scene.createOtherPlayer(data.player);
            }
            addChatMessage(`${data.player.name} joined the game`, 'system');
            document.getElementById('online-players').textContent = scene.players.size + 1;
            break;

        case 'playerLeft':
            if (scene) {
                const player = scene.players.get(data.playerId);
                if (player) {
                    addChatMessage(`${player.name} left the game`, 'system');
                    scene.removePlayer(data.playerId);
                }
                document.getElementById('online-players').textContent = scene.players.size + 1;
            }
            break;

        case 'playerMoved':
            if (scene) {
                scene.updateOtherPlayer(data.playerId, data.x, data.y);
            }
            break;

        case 'chat':
            addChatMessage(`${data.name}: ${data.message}`, 'user');
            break;

        case 'gatherSuccess':
            if (scene) {
                const resource = scene.resources.get(data.resourceId);
                if (resource) {
                    resource.available = false;
                    const sprite = scene.resourceSprites.get(data.resourceId);
                    if (sprite) {
                        sprite.setAlpha(0.3);
                    }
                }

                // Show yields to player
                const yieldText = data.yields.map(y => `${y.quantity}x ${y.item}`).join(', ');
                addChatMessage(`Gathered: ${yieldText}`, 'system');

                // Update inventory UI
                data.yields.forEach(y => {
                    updateInventoryItem(y.item, y.quantity);
                });
            }
            break;

        case 'gatherFailed':
            addChatMessage(data.message, 'system');
            break;

        case 'resourceDepleted':
            if (scene) {
                const resource = scene.resources.get(data.resourceId);
                if (resource) {
                    resource.available = false;
                    const sprite = scene.resourceSprites.get(data.resourceId);
                    if (sprite) {
                        sprite.setAlpha(0.3);
                    }
                }
            }
            break;

        case 'resourceRespawned':
            if (scene) {
                const resource = scene.resources.get(data.resourceId);
                if (resource) {
                    resource.available = true;
                    const sprite = scene.resourceSprites.get(data.resourceId);
                    if (sprite) {
                        sprite.setAlpha(1.0);
                    }
                }
            }
            break;

        case 'error':
            alert(data.message);
            break;
    }
}

function setupChatInput() {
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim()) {
            sendChat(chatInput.value.trim());
            chatInput.value = '';
        }
    });
}

function updateHUD() {
    if (!gameState.character) return;
    document.getElementById('player-name').textContent = gameState.character.name;
    document.getElementById('player-class').textContent = gameState.character.class;
    document.getElementById('player-level').textContent = gameState.character.level;
    document.getElementById('player-health').textContent = gameState.character.health;
    document.getElementById('player-max-health').textContent = gameState.character.max_health;
    document.getElementById('player-mana').textContent = gameState.character.mana;
    document.getElementById('player-max-mana').textContent = gameState.character.max_mana;
}

function addChatMessage(message, type) {
    const div = document.createElement('div');
    div.className = `chat-${type}`;
    div.textContent = message;
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChat(message) {
    if (!gameState.ws) return;
    gameState.ws.send(JSON.stringify({
        type: 'chat',
        message: message
    }));
}

// ===== INVENTORY =====
async function loadInventory() {
    try {
        const response = await fetch(`/api/inventory/${gameState.character.id}`, {
            credentials: 'include'
        });
        const inventory = await response.json();
        gameState.inventory = inventory;
        renderInventory();
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function renderInventory() {
    const inventoryItems = document.getElementById('inventory-items');
    inventoryItems.innerHTML = '';

    if (gameState.inventory.length === 0) {
        inventoryItems.innerHTML = '<div class="inventory-empty">No items yet</div>';
        return;
    }

    gameState.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `
            <span class="inventory-item-name">${item.item_name}</span>
            <span class="inventory-item-quantity">x${item.quantity}</span>
        `;
        inventoryItems.appendChild(itemDiv);
    });
}

function setupInventoryListeners() {
    const toggleBtn = document.getElementById('inventory-toggle');
    const content = document.getElementById('inventory-content');

    toggleBtn.addEventListener('click', () => {
        content.classList.toggle('collapsed');
        toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '-';
    });
}

function updateInventoryItem(itemName, quantity) {
    // Find existing item
    const existingItem = gameState.inventory.find(i => i.item_name === itemName);

    if (existingItem) {
        existingItem.quantity += quantity;
        if (existingItem.quantity <= 0) {
            // Remove item if quantity is 0 or less
            gameState.inventory = gameState.inventory.filter(i => i.item_name !== itemName);
        }
    } else if (quantity > 0) {
        // Add new item
        gameState.inventory.push({
            item_name: itemName,
            quantity: quantity,
            item_type: 'resource'
        });
    }

    renderInventory();
}

// ===== UTILITY =====
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
}