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

        characters.forEach(async char => {
            const card = document.createElement('div');
            card.className = 'character-card';

            // Fetch equipment for this character
            let equipment = {};
            try {
                const equipmentResponse = await fetch(`/api/equipment/${char.id}`, { credentials: 'include' });
                const equipmentData = await equipmentResponse.json();
                equipmentData.forEach(item => {
                    equipment[item.slot] = item;
                });
            } catch (error) {
                console.error('Error fetching equipment:', error);
            }

            // Create sprite element
            let spriteElement;
            if (char.class === 'Warrior' || char.class === 'Wizard') {
                // For Warrior and Wizard, extract sprite from sprite sheet
                const canvas = document.createElement('canvas');
                canvas.width = 96;
                canvas.height = 96;
                canvas.className = 'character-sprite';
                canvas.style.imageRendering = 'pixelated';
                canvas.style.imageRendering = 'crisp-edges';
                const ctx = canvas.getContext('2d');

                const img = new Image();
                img.onload = () => {
                    // Extract down-facing idle frame (row 10, column 0)
                    const frameWidth = 64;
                    const frameHeight = 64;
                    const row = 10; // Walk down row
                    const col = 0; // First frame (idle)

                    const sourceX = col * frameWidth;
                    const sourceY = row * frameHeight;

                    // Draw the frame scaled up
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, sourceX, sourceY, frameWidth, frameHeight, 0, 0, 96, 96);

                    // If armor is equipped, layer it on top
                    if (equipment.armor) {
                        const armorImg = new Image();
                        armorImg.onload = () => {
                            ctx.drawImage(armorImg, sourceX, sourceY, frameWidth, frameHeight, 0, 0, 96, 96);
                        };
                        armorImg.src = `assets/equipment/${equipment.armor.item_name}.png`;
                    }
                };
                img.src = `assets/characters/${char.class.toLowerCase()}/${char.class.toLowerCase()}_class.png`;
                spriteElement = canvas;
            } else {
                // For other classes, use static image
                const spriteUrl = `assets/characters/${char.class.toLowerCase()}_south.png`;
                spriteElement = document.createElement('img');
                spriteElement.src = spriteUrl;
                spriteElement.alt = char.class;
                spriteElement.className = 'character-sprite';
                spriteElement.style.width = '96px';
                spriteElement.style.height = '96px';
                spriteElement.style.imageRendering = 'pixelated';
                spriteElement.style.imageRendering = 'crisp-edges';
            }

            card.innerHTML = `
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

            // Insert sprite at the beginning
            card.insertBefore(spriteElement, card.firstChild);

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

            if (className === 'Warrior' || className === 'Wizard') {
                // For Warrior and Wizard, extract sprite from sprite sheet
                const canvas = document.createElement('canvas');
                canvas.width = 96;
                canvas.height = 96;
                canvas.style.imageRendering = 'pixelated';
                canvas.style.imageRendering = 'crisp-edges';
                const ctx = canvas.getContext('2d');

                const img = new Image();
                img.onload = () => {
                    // Extract down-facing idle frame (row 10, column 0)
                    // Row 10 = walk section row 8 + down direction offset 2
                    const frameWidth = 64;
                    const frameHeight = 64;
                    const row = 10; // Walk down row (13 cols per row in sprite sheet)
                    const col = 0; // First frame (idle)

                    const sourceX = col * frameWidth;
                    const sourceY = row * frameHeight;

                    // Draw the frame scaled up to fill the canvas
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, sourceX, sourceY, frameWidth, frameHeight, 0, 0, 96, 96);
                };
                img.src = `assets/characters/${className.toLowerCase()}/${className.toLowerCase()}_class.png`;

                card.innerHTML = `<h3>${className}</h3>`;
                card.insertBefore(canvas, card.firstChild);
            } else {
                // For other classes, use static image
                const spriteUrl = `assets/characters/${className.toLowerCase()}_south.png`;
                card.innerHTML = `
                    <img src="${spriteUrl}" alt="${className}" class="class-sprite" style="width: 96px; height: 96px; image-rendering: pixelated; image-rendering: crisp-edges;">
                    <h3>${className}</h3>
                `;
            }

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
        this.enemies = null;
        this.enemiesSpawned = false; // Flag to prevent double-spawning
    }

    preload() {
        // Load pixel art character sprites
        const directions = ['south', 'north', 'east', 'west'];

        console.log('Preloading character sprites...');

        // Load Warrior and Wizard as sprite sheets
        this.load.spritesheet('warrior_class', 'assets/characters/warrior/warrior_class.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('wizard_class', 'assets/characters/wizard/wizard_class.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Load other classes as static images
        ['Paladin', 'Rogue'].forEach(className => {
            directions.forEach(dir => {
                const key = `${className.toLowerCase()}_${dir}`;
                const path = `assets/characters/${className.toLowerCase()}_${dir}.png`;
                console.log(`Loading: ${key} from ${path}`);
                this.load.image(key, path);
            });
        });

        // Load equipment sprite sheets
        console.log('Preloading equipment sprites...');
        this.load.spritesheet('torso_armor_plate_iron', 'assets/equipment/torso_armor_plate_iron.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('weapon_waraxe', 'assets/equipment/weapon_waraxe.png', {
            frameWidth: 64,
            frameHeight: 64
        });

        // Load resource sprites
        console.log('Preloading resource sprites...');
        this.load.image('tree', 'assets/resources/tree.png');
        this.load.image('iron_ore', 'assets/resources/iron_ore.png');
        this.load.image('copper_ore', 'assets/resources/copper_ore.png');

        // Load enemy sprite sheets from organized layers
        console.log('Preloading enemy sprites...');
        // Load skeleton body layers for different animations
        this.load.spritesheet('skeleton_walk', 'assets/enemies/standard/walk/010 skeleton__skeleton_.png.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('skeleton_idle', 'assets/enemies/standard/idle/010 skeleton__skeleton_.png.png', {
            frameWidth: 64,
            frameHeight: 64
        });
        // Load skeleton head layer from walk folder (13 cols x 4 rows: up, left, down, right)
        this.load.spritesheet('skeleton_head', 'assets/enemies/standard/walk/100 skeleton__skeleton_.png.png', {
            frameWidth: 64,
            frameHeight: 64
        });

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
        console.log('[SCENE] create() called at:', new Date().toISOString());

        // Reset the enemiesSpawned flag for new scene
        this.enemiesSpawned = false;

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

        // Create physics group for enemies
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            runChildUpdate: false
        });

        // Create skeleton animations
        this.createSkeletonAnimations();

        // Create warrior animations
        this.createWarriorAnimations();

        // Create wizard animations
        this.createWizardAnimations();

        // Create equipment animations
        this.createEquipmentAnimations();

        // Spawn enemies
        console.log('About to spawn enemies, current enemies:', this.enemies.getLength());
        this.spawnEnemies();
        console.log('After spawning, enemies:', this.enemies.getLength());

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

    // ========================================
    // LPC SPRITE SHEET ANIMATION CREATION
    // ========================================
    createSkeletonAnimations() {
        if (this.anims.exists('skeleton_idle_down')) {
            console.log('Skeleton animations already exist');
            return;
        }

        // Check if both textures loaded
        const walkTexture = this.textures.get('skeleton_walk');
        const idleTexture = this.textures.get('skeleton_idle');

        if (!walkTexture || walkTexture.key === '__MISSING' || !idleTexture || idleTexture.key === '__MISSING') {
            console.error('Skeleton textures not loaded!');
            return;
        }

        // Each LPC animation file has 4 rows: Up, Left, Down, Right
        const walkSource = walkTexture.source[0];
        const idleSource = idleTexture.source[0];
        const frameWidth = 64;
        const frameHeight = 64;
        const cols = Math.floor(walkSource.width / frameWidth);

        console.log(`LPC Skeleton walk: ${walkSource.width}x${walkSource.height} (${cols} cols)`);
        console.log(`LPC Skeleton idle: ${idleSource.width}x${idleSource.height}`);

        // LPC direction order: 0=Up, 1=Left, 2=Down, 3=Right
        const getFrameRange = (texture, direction, frameCount) => {
            const directionRow = { up: 0, left: 1, down: 2, right: 3 }[direction];
            const start = directionRow * cols;
            const end = start + frameCount - 1;
            return { start, end };
        };

        try {
            // Create Walk animations for body - each row has 9 frames
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getFrameRange('skeleton_walk', dir, 9);
                this.createSafeAnimation(`skeleton_walk_${dir}`, 'skeleton_walk', range.start, range.end, 10);
            });

            // Create Walk animations for head - each row has 9 frames
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getFrameRange('skeleton_walk', dir, 9);
                this.createSafeAnimation(`skeleton_head_walk_${dir}`, 'skeleton_head', range.start, range.end, 10);
            });

            // Create Idle animations - each row has 1 frame
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getFrameRange('skeleton_idle', dir, 1);
                this.createSafeAnimation(`skeleton_idle_${dir}`, 'skeleton_idle', range.start, range.end, 1);
            });

            console.log('✓ LPC skeleton animations created from separate files');
        } catch (error) {
            console.error('Error creating LPC animations:', error);
        }
    }

    createWarriorAnimations() {
        if (this.anims.exists('warrior_walk_down')) {
            console.log('Warrior animations already exist');
            return;
        }

        const texture = this.textures.get('warrior_class');
        if (!texture || texture.key === '__MISSING') {
            console.error('Warrior texture not loaded!');
            return;
        }

        const source = texture.source[0];
        const frameWidth = 64;
        const cols = Math.floor(source.width / frameWidth);

        console.log(`LPC Warrior: ${source.width}x${source.height} (${cols} cols)`);

        // LPC Walk animations are in rows 8-11 (up, left, down, right)
        // Each walk animation has 9 frames
        const walkRowStart = 8;
        const getWalkFrameRange = (direction, frameCount) => {
            const directionRow = { up: 0, left: 1, down: 2, right: 3 }[direction];
            const row = walkRowStart + directionRow;
            const start = row * cols;
            const end = start + frameCount - 1;
            return { start, end };
        };

        try {
            // Create Walk animations - each row has 9 frames
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getWalkFrameRange(dir, 9);
                this.createSafeAnimation(`warrior_walk_${dir}`, 'warrior_class', range.start, range.end, 10);
            });

            console.log('✓ LPC warrior animations created');
        } catch (error) {
            console.error('Error creating warrior animations:', error);
        }
    }

    createWizardAnimations() {
        if (this.anims.exists('wizard_walk_down')) {
            console.log('Wizard animations already exist');
            return;
        }

        const texture = this.textures.get('wizard_class');
        if (!texture || texture.key === '__MISSING') {
            console.error('Wizard texture not loaded!');
            return;
        }

        const source = texture.source[0];
        const frameWidth = 64;
        const cols = Math.floor(source.width / frameWidth);

        console.log(`LPC Wizard: ${source.width}x${source.height} (${cols} cols)`);

        // LPC Walk animations are in rows 8-11 (up, left, down, right)
        // Each walk animation has 9 frames
        const walkRowStart = 8;
        const getWalkFrameRange = (direction, frameCount) => {
            const directionRow = { up: 0, left: 1, down: 2, right: 3 }[direction];
            const row = walkRowStart + directionRow;
            const start = row * cols;
            const end = start + frameCount - 1;
            return { start, end };
        };

        try {
            // Create Walk animations - each row has 9 frames
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getWalkFrameRange(dir, 9);
                this.createSafeAnimation(`wizard_walk_${dir}`, 'wizard_class', range.start, range.end, 10);
            });

            console.log('✓ LPC wizard animations created');
        } catch (error) {
            console.error('Error creating wizard animations:', error);
        }
    }

    createEquipmentAnimations() {
        // Create animations for iron plate armor
        if (this.anims.exists('torso_armor_plate_iron_walk_down')) {
            console.log('Equipment animations already exist');
            return;
        }

        const texture = this.textures.get('torso_armor_plate_iron');
        if (!texture || texture.key === '__MISSING') {
            console.log('Equipment textures not loaded yet');
            return;
        }

        const source = texture.source[0];
        const frameWidth = 64;
        const cols = Math.floor(source.width / frameWidth);

        console.log(`LPC Equipment: ${source.width}x${source.height} (${cols} cols)`);

        // LPC Walk animations are in rows 8-11
        // Testing: up=row8, down=row9, left=row10, right=row11
        const walkRowStart = 8;
        const getWalkFrameRange = (direction, frameCount) => {
            const directionRow = { up: 0, down: 1, left: 2, right: 3 }[direction];
            const row = walkRowStart + directionRow;
            const start = row * cols;
            const end = start + frameCount - 1;
            return { start, end };
        };

        try {
            // Create Walk animations for armor - each row has 9 frames
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getWalkFrameRange(dir, 9);
                this.createSafeAnimation(`torso_armor_plate_iron_walk_${dir}`, 'torso_armor_plate_iron', range.start, range.end, 10);
            });

            // Create Walk animations for weapon_waraxe
            // TEST: Using row 11 for all directions to see if it renders
            const weaponTexture = this.textures.get('weapon_waraxe');
            if (weaponTexture && weaponTexture.key !== '__MISSING') {
                console.log('Creating weapon_waraxe animations...');
                // Temporarily use row 11 (143-151) for all directions
                ['up', 'left', 'down', 'right'].forEach(dir => {
                    const start = 11 * cols; // Row 11
                    const end = start + 8; // 9 frames
                    this.createSafeAnimation(`weapon_waraxe_walk_${dir}`, 'weapon_waraxe', start, end, 10);
                    console.log(`  Created weapon_waraxe_walk_${dir}: frames ${start}-${end} (using row 11 for testing)`);
                });

                // Create single-frame IDLE animations for weapon (first frame of each row)
                const weaponIdleMapping = { up: 8, down: 9, left: 10, right: 11 };
                ['up', 'left', 'down', 'right'].forEach(dir => {
                    const row = weaponIdleMapping[dir];
                    const idleFrame = row * cols; // First frame of the row
                    this.createSafeAnimation(`weapon_waraxe_idle_${dir}`, 'weapon_waraxe', idleFrame, idleFrame, 10);
                    console.log(`  Created weapon_waraxe_idle_${dir}: frame ${idleFrame}`);
                });
            } else {
                console.warn('Weapon texture not loaded or missing');
            }

            console.log('✓ Equipment animations created');
        } catch (error) {
            console.error('Error creating equipment animations:', error);
        }
    }

    // Helper method to create animations with validation
    createSafeAnimation(key, texture, start, end, frameRate) {
        if (this.anims.exists(key)) return;

        try {
            this.anims.create({
                key: key,
                frames: this.anims.generateFrameNumbers(texture, { start, end }),
                frameRate: frameRate,
                repeat: -1
            });
            console.log(`Created animation: ${key} (frames ${start}-${end})`);
        } catch (error) {
            console.error(`Failed to create animation ${key}:`, error);
        }
    }

    // Fallback when frame numbers are wrong
    createFallbackAnimations(totalFrames) {
        console.log('Creating fallback animations using first available frames...');

        // Use the first few frames as a simple fallback
        const fallbackEnd = Math.min(3, totalFrames - 1);

        ['up', 'down', 'left', 'right'].forEach(dir => {
            const idleKey = `skeleton_idle_${dir}`;
            const walkKey = `skeleton_walk_${dir}`;

            if (!this.anims.exists(idleKey)) {
                this.anims.create({
                    key: idleKey,
                    frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: fallbackEnd }),
                    frameRate: 8,
                    repeat: -1
                });
            }

            if (!this.anims.exists(walkKey)) {
                this.anims.create({
                    key: walkKey,
                    frames: this.anims.generateFrameNumbers('skeleton', { start: 0, end: fallbackEnd }),
                    frameRate: 10,
                    repeat: -1
                });
            }
        });

        console.log('Fallback animations created - enemies will animate but may not look correct');
    }

    // ========================================
    // IMPROVED ENEMY SPAWNING
    // ========================================
    spawnEnemies() {
        // Prevent double-spawning
        if (this.enemiesSpawned) {
            console.log('Enemies already spawned, skipping...');
            return;
        }

        // Check if animations exist
        if (!this.anims.exists('skeleton_idle_down')) {
            console.error('Cannot spawn enemies - animations not created!');
            return;
        }

        console.log('Spawning skeleton enemies...');
        this.enemiesSpawned = true;

        const enemyPositions = [
            { x: 400, y: 300 },
            { x: 600, y: 200 },
            { x: 250, y: 450 }
        ];

        enemyPositions.forEach((pos, index) => {
            try {
                // Create physics sprite for the body
                const enemy = this.enemies.create(pos.x, pos.y, 'skeleton_walk', 26);

                if (!enemy) {
                    console.error(`Failed to create enemy at position ${index}`);
                    return;
                }

                enemy.setScale(1.0);
                enemy.setCollideWorldBounds(true);
                enemy.setDepth(100);
                enemy.setVisible(true);
                enemy.setAlpha(1);
                enemy.setScrollFactor(1);
                enemy.setActive(true);

                // Create head sprite (not physics, just visual layer on top)
                // Head sprite: row 0=up, row 1=left, row 2=down, row 3=right (standard LPC)
                const head = this.add.sprite(pos.x, pos.y, 'skeleton_head', 26);  // Frame 26 = down
                head.setScale(1.0);
                head.setDepth(101);  // Above body
                head.setScrollFactor(1);

                // Link head to enemy
                enemy.headSprite = head;

                // Add debug visualization
                const debugCircle = this.add.circle(pos.x, pos.y, 50, 0xff0000, 0.3);
                debugCircle.setDepth(99);
                enemy.debugCircle = debugCircle;

                // Enemy state properties
                enemy.enemyState = 'idle';
                enemy.facing = 'down';
                enemy.stateTimer = this.time.now + Phaser.Math.Between(2000, 4000);
                enemy.stateDuration = 0;

                console.log(`Spawned skeleton ${index} with body and head at (${pos.x}, ${pos.y})`);
            } catch (error) {
                console.error(`Error spawning enemy ${index}:`, error);
            }
        });

        console.log('Total enemies in group:', this.enemies.getLength());
    }

    // ========================================
    // IMPROVED ENEMY UPDATE WITH STATE MACHINE
    // ========================================
    updateEnemies() {
        if (!this.enemies || !this.enemies.children) {
            console.warn('[ENEMY] No enemies group found');
            return;
        }

        const currentTime = this.time.now;
        const enemyCount = this.enemies.getLength();

        // Log if enemy count changes
        if (!this.lastEnemyCount || this.lastEnemyCount !== enemyCount) {
            console.log(`[ENEMY] Enemy count: ${enemyCount} (was ${this.lastEnemyCount || 0})`);
            this.lastEnemyCount = enemyCount;
        }

        // Track visibility changes every 60 frames (~1 second)
        if (!this.enemyVisibilityCheckFrame) this.enemyVisibilityCheckFrame = 0;
        this.enemyVisibilityCheckFrame++;

        this.enemies.children.each((enemy, index) => {
            if (!enemy) {
                console.warn('[ENEMY] Null enemy found in group');
                return;
            }

            if (!enemy.active) {
                console.warn('[ENEMY] Inactive enemy found:', enemy);
                return;
            }

            // Log visibility changes
            if (this.enemyVisibilityCheckFrame % 60 === 0) {
                const wasVisible = enemy.lastVisibleState;
                const isVisible = enemy.visible;
                if (wasVisible !== undefined && wasVisible !== isVisible) {
                    console.warn(`[ENEMY ${index}] Visibility changed from ${wasVisible} to ${isVisible} at pos (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`);
                }
                enemy.lastVisibleState = isVisible;

                // Also log if alpha is not 1
                if (enemy.alpha !== 1) {
                    console.warn(`[ENEMY ${index}] Alpha is ${enemy.alpha}, expected 1`);
                }
            }

            // Update debug circle position
            if (enemy.debugCircle) {
                enemy.debugCircle.setPosition(enemy.x, enemy.y);
            }

            // Sync head position with body
            if (enemy.headSprite) {
                enemy.headSprite.setPosition(enemy.x, enemy.y);
            }

            switch (enemy.enemyState) {
                case 'idle':
                    this.updateEnemyIdle(enemy, currentTime);
                    break;
                case 'walking':
                    this.updateEnemyWalking(enemy, currentTime);
                    break;
            }
        });
    }

    updateEnemyIdle(enemy, currentTime) {
        // Stop movement
        enemy.setVelocity(0, 0);

        // For idle, use the first frame of the walk animation for body
        const idleFrameMap = { up: 0, left: 13, down: 26, right: 39 };
        const frameIndex = idleFrameMap[enemy.facing] || 26;  // default to down

        // Head frames (4 rows x 13 cols): up=0, left=13, down=26, right=39
        const headFrameMap = { up: 0, left: 13, down: 26, right: 39 };
        const headFrame = headFrameMap[enemy.facing] || 26;

        // Update body texture
        if (enemy.texture.key !== 'skeleton_walk' || enemy.frame.name !== frameIndex) {
            enemy.anims.stop();
            enemy.setTexture('skeleton_walk', frameIndex);
            console.log(`[IDLE] Set body to skeleton_walk frame ${frameIndex}, head frame ${headFrame}`);
        }

        // Update head frame (stop any animation and set static frame)
        if (enemy.headSprite) {
            enemy.headSprite.anims.stop();
            enemy.headSprite.setFrame(headFrame);
        }

        // Force visibility
        if (!enemy.visible) {
            console.warn('[IDLE] Enemy became invisible! Forcing visible=true');
            enemy.setVisible(true);
        }

        // Check if it's time to start walking
        if (currentTime > enemy.stateTimer) {
            this.startEnemyWalking(enemy, currentTime);
        }
    }

    updateEnemyWalking(enemy, currentTime) {
        // Check if walking duration is over
        if (currentTime > enemy.stateTimer + enemy.stateDuration) {
            this.stopEnemyWalking(enemy, currentTime);
            return;
        }

        // Force visibility during walking
        if (!enemy.visible) {
            console.warn('[WALK] Enemy became invisible! Forcing visible=true');
            enemy.setVisible(true);
        }

        // Play walk animation if not already playing
        const walkAnim = `skeleton_walk_${enemy.facing}`;
        if (enemy.anims.currentAnim?.key !== walkAnim) {
            console.log(`[WALK] Playing animation ${walkAnim}`);
            this.playSafeAnimation(enemy, walkAnim);
        }

        // Play head walk animation to sync with body
        if (enemy.headSprite) {
            const headWalkAnim = `skeleton_head_walk_${enemy.facing}`;
            if (!enemy.headSprite.anims.currentAnim || enemy.headSprite.anims.currentAnim.key !== headWalkAnim) {
                if (this.anims.exists(headWalkAnim)) {
                    enemy.headSprite.anims.play(headWalkAnim, true);
                }
            }
        }
    }

    startEnemyWalking(enemy, currentTime) {
        const directions = [
            { vx: 0, vy: -50, facing: 'up' },
            { vx: 0, vy: 50, facing: 'down' },
            { vx: -50, vy: 0, facing: 'left' },
            { vx: 50, vy: 0, facing: 'right' }
        ];

        const dir = Phaser.Utils.Array.GetRandom(directions);

        enemy.facing = dir.facing;
        enemy.setVelocity(dir.vx, dir.vy);
        enemy.enemyState = 'walking';
        enemy.stateTimer = currentTime;
        enemy.stateDuration = Phaser.Math.Between(1000, 2000);

        // Start body walk animation
        this.playSafeAnimation(enemy, `skeleton_walk_${enemy.facing}`);

        // Start head walk animation immediately to sync with body
        if (enemy.headSprite) {
            const headWalkAnim = `skeleton_head_walk_${enemy.facing}`;
            if (this.anims.exists(headWalkAnim)) {
                enemy.headSprite.anims.play(headWalkAnim, true);
            }
        }
    }

    stopEnemyWalking(enemy, currentTime) {
        enemy.setVelocity(0, 0);
        enemy.enemyState = 'idle';
        enemy.stateTimer = currentTime + Phaser.Math.Between(2000, 4000);

        // Use first frame of walk animation for body idle
        const idleFrameMap = { up: 0, left: 13, down: 26, right: 39 };
        const frameIndex = idleFrameMap[enemy.facing] || 26;
        enemy.anims.stop();
        enemy.setTexture('skeleton_walk', frameIndex);

        // Set head to idle frame (rows: up=0, left=13, down=26, right=39)
        if (enemy.headSprite) {
            const headFrameMap = { up: 0, left: 13, down: 26, right: 39 };
            const headFrame = headFrameMap[enemy.facing] || 26;
            enemy.headSprite.anims.stop();
            enemy.headSprite.setFrame(headFrame);
        }
    }

    // Safe animation player - prevents crashes from missing animations
    playSafeAnimation(sprite, animKey) {
        if (!sprite || !sprite.active) return;

        if (this.anims.exists(animKey)) {
            try {
                sprite.anims.play(animKey, true);
            } catch (error) {
                console.error(`Error playing animation ${animKey}:`, error);
            }
        } else {
            console.warn(`Animation not found: ${animKey}`);
            // Try to use a fallback
            const fallback = 'skeleton_idle_down';
            if (this.anims.exists(fallback)) {
                sprite.anims.play(fallback, true);
            }
        }
    }

    createPlayer(character) {
        // Create player sprite with class-specific texture
        let sprite;
        if (character.class === 'Warrior' || character.class === 'Wizard') {
            // Use sprite sheet for Warrior and Wizard
            // Start with idle frame (row 8)
            const idleFrame = 8 * 13; // Row 8 = 104
            const textureKey = `${character.class.toLowerCase()}_class`;
            sprite = this.physics.add.sprite(character.x, character.y, textureKey, idleFrame);
            console.log(`Creating ${character.class} with sprite sheet at position:`, character.x, character.y, 'frame:', idleFrame);
        } else {
            // Use static images for other classes
            const spriteKey = `${character.class.toLowerCase()}_south`;
            console.log('Creating player with sprite key:', spriteKey, 'at position:', character.x, character.y);
            console.log('Texture exists:', this.textures.exists(spriteKey));
            sprite = this.physics.add.sprite(character.x, character.y, spriteKey);
        }

        sprite.setCollideWorldBounds(true);
        sprite.currentDirection = 'south';
        sprite.className = character.class;
        // Scale: Warrior and Wizard use 1.0 (same as enemies), other classes use 2.0
        const playerScale = character.class === 'Warrior' || character.class === 'Wizard' ? 1.0 : 2.0;
        sprite.setScale(playerScale);
        sprite.setDepth(100); // Base character layer
        console.log('Player sprite created:', sprite, 'Display size:', sprite.displayWidth, 'x', sprite.displayHeight);

        // Add equipment layers based on character's equipped items
        if (character.class === 'Warrior' || character.class === 'Wizard') {
            // Armor uses rows 8-11, weapon TEST: using row 11 for all directions
            const armorIdleFrame = 9 * 13; // Row 9 = down direction (frame 117)
            const weaponIdleFrame = 11 * 13; // Row 11 for testing (frame 143)

            // Add armor layer
            if (character.equipment && character.equipment.armor) {
                const armorKey = character.equipment.armor.name;
                const armorSprite = this.add.sprite(character.x, character.y, armorKey, armorIdleFrame);
                armorSprite.setScale(playerScale);
                armorSprite.setDepth(101); // Above base character
                armorSprite.setScrollFactor(1);
                sprite.armorLayer = armorSprite;
                console.log('Armor layer added to player:', armorKey);
            }

            // Add weapon layer
            if (character.equipment && character.equipment.weapon) {
                const weaponKey = character.equipment.weapon.name;
                console.log('Creating weapon layer with key:', weaponKey, 'at frame:', weaponIdleFrame);
                const weaponSprite = this.add.sprite(character.x, character.y, weaponKey, weaponIdleFrame);
                weaponSprite.setScale(playerScale);
                weaponSprite.setDepth(102); // Above armor layer
                weaponSprite.setScrollFactor(1);
                weaponSprite.setVisible(true); // Explicitly set visible
                sprite.weaponLayer = weaponSprite;
                console.log('Weapon layer added to player:', weaponKey, 'visible:', weaponSprite.visible, 'depth:', weaponSprite.depth);
            }
        }

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
        let sprite;
        if (playerData.class === 'Warrior' || playerData.class === 'Wizard') {
            // Use sprite sheet for Warrior and Wizard
            // Start with idle frame (row 8)
            const idleFrame = 8 * 13; // Row 8 = 104
            const textureKey = `${playerData.class.toLowerCase()}_class`;
            sprite = this.physics.add.sprite(playerData.x, playerData.y, textureKey, idleFrame);
        } else {
            // Use static images for other classes
            const spriteKey = `${playerData.class.toLowerCase()}_south`;
            sprite = this.physics.add.sprite(playerData.x, playerData.y, spriteKey);
        }

        sprite.setCollideWorldBounds(true);
        sprite.currentDirection = 'south';
        sprite.className = playerData.class;
        // Scale: Warrior and Wizard use 1.0 (same as enemies), other classes use 2.0
        const playerScale = playerData.class === 'Warrior' || playerData.class === 'Wizard' ? 1.0 : 2.0;
        sprite.setScale(playerScale);

        // Add equipment layers if character has them equipped
        // Armor uses rows 8-11, weapon uses rows 0-3
        const armorIdleFrame = 9 * 13; // Row 9 = down direction (frame 117)
        const weaponIdleFrame = 11 * 13; // Row 11 for testing (frame 143)

        // Add armor layer
        if (playerData.equipment && playerData.equipment.armor) {
            const armorKey = playerData.equipment.armor.name;
            const armorSprite = this.add.sprite(playerData.x, playerData.y, armorKey, armorIdleFrame);
            armorSprite.setScale(playerScale);
            armorSprite.setDepth(101); // Above base character
            sprite.armorLayer = armorSprite;
        }

        // Add weapon layer
        if (playerData.equipment && playerData.equipment.weapon) {
            const weaponKey = playerData.equipment.weapon.name;
            const weaponSprite = this.add.sprite(playerData.x, playerData.y, weaponKey, weaponIdleFrame);
            weaponSprite.setScale(playerScale);
            weaponSprite.setDepth(102); // Above armor layer
            weaponSprite.setVisible(true); // Explicitly set visible
            sprite.weaponLayer = weaponSprite;
        }

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
            if (sprite.armorLayer) {
                sprite.armorLayer.destroy();
            }
            if (sprite.weaponLayer) {
                sprite.weaponLayer.destroy();
            }
            sprite.destroy();
            this.playerSprites.delete(playerId);
            this.players.delete(playerId);
        }
    }

    updateOtherPlayer(playerId, x, y) {
        const sprite = this.playerSprites.get(playerId);
        if (sprite) {
            // Smooth interpolation
            const targets = [sprite];
            if (sprite.armorLayer) {
                targets.push(sprite.armorLayer);
            }
            if (sprite.weaponLayer) {
                targets.push(sprite.weaponLayer);
            }
            this.tweens.add({
                targets: targets,
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

        // Update sprite direction and animation based on movement
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

                if (this.player.className === 'Warrior' || this.player.className === 'Wizard') {
                    // Play walk animation for warrior and wizard
                    const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
                    const animDirection = directionMap[newDirection];
                    const animKey = `${this.player.className.toLowerCase()}_walk_${animDirection}`;
                    this.playSafeAnimation(this.player, animKey);

                    // Sync equipment animations
                    if (this.player.armorLayer) {
                        const armorAnimKey = `torso_armor_plate_iron_walk_${animDirection}`;
                        if (this.anims.exists(armorAnimKey)) {
                            this.player.armorLayer.anims.play(armorAnimKey, true);
                        }
                    }
                    if (this.player.weaponLayer) {
                        this.player.weaponLayer.setVisible(true); // Ensure visible
                        const weaponAnimKey = `weapon_waraxe_walk_${animDirection}`;
                        if (this.anims.exists(weaponAnimKey)) {
                            this.player.weaponLayer.anims.play(weaponAnimKey, true);
                        }
                    }
                } else {
                    // Use static texture for other classes
                    const spriteKey = `${this.player.className.toLowerCase()}_${newDirection}`;
                    this.player.setTexture(spriteKey);
                }
            } else if (this.player.className === 'Warrior' || this.player.className === 'Wizard') {
                // Keep playing animation if still moving in same direction
                const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
                const animDirection = directionMap[newDirection];
                const animKey = `${this.player.className.toLowerCase()}_walk_${animDirection}`;
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== animKey) {
                    this.playSafeAnimation(this.player, animKey);
                }

                // Keep equipment animations synced
                if (this.player.armorLayer) {
                    const armorAnimKey = `torso_armor_plate_iron_walk_${animDirection}`;
                    if (!this.player.armorLayer.anims.isPlaying || this.player.armorLayer.anims.currentAnim?.key !== armorAnimKey) {
                        if (this.anims.exists(armorAnimKey)) {
                            this.player.armorLayer.anims.play(armorAnimKey, true);
                        }
                    }
                }
                if (this.player.weaponLayer) {
                    this.player.weaponLayer.setVisible(true); // Ensure visible
                    const weaponAnimKey = `weapon_waraxe_walk_${animDirection}`;
                    if (!this.player.weaponLayer.anims.isPlaying || this.player.weaponLayer.anims.currentAnim?.key !== weaponAnimKey) {
                        if (this.anims.exists(weaponAnimKey)) {
                            this.player.weaponLayer.anims.play(weaponAnimKey, true);
                        }
                    }
                }
            }
        } else if (this.player.className === 'Warrior' || this.player.className === 'Wizard') {
            // Player stopped moving - show idle frame (first frame of walk animation)
            const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
            const animDirection = directionMap[this.player.currentDirection];

            // Stop animation and show first frame
            this.player.anims.stop();

            // Calculate idle frame based on current direction
            // New mapping: up=row8, down=row9, left=row10, right=row11
            const directionOffset = { up: 0, down: 1, left: 2, right: 3 }[animDirection];
            const idleFrame = (8 + directionOffset) * 13; // First frame of each walk row
            this.player.setFrame(idleFrame);

            // Stop equipment animations and set idle frames
            if (this.player.armorLayer) {
                this.player.armorLayer.anims.stop();
                this.player.armorLayer.setFrame(idleFrame);
            }
            if (this.player.weaponLayer) {
                // Play single-frame idle animation instead of using setFrame
                this.player.weaponLayer.setVisible(true);
                this.player.weaponLayer.setAlpha(1);
                const weaponIdleAnimKey = `weapon_waraxe_idle_${animDirection}`;
                if (this.anims.exists(weaponIdleAnimKey)) {
                    this.player.weaponLayer.anims.play(weaponIdleAnimKey, true);
                }
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

        // Update enemies
        this.updateEnemies();
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
        // Sync equipment layer positions
        if (sprite.armorLayer) {
            sprite.armorLayer.setPosition(sprite.x, sprite.y);
        }
        if (sprite.weaponLayer) {
            sprite.weaponLayer.setPosition(sprite.x, sprite.y);
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
    console.log('[GAME] startGame() called for character:', characterId, 'at:', new Date().toISOString());

    hideAllScreens();
    document.getElementById('game-container').style.display = 'flex';

    setupChatInput();
    setupInventoryListeners();

    // If a Phaser game already exists, destroy it completely before creating a new one.
    if (gameState.phaserGame) {
        console.warn('[GAME] Destroying existing Phaser game instance');
        try {
            gameState.phaserGame.destroy(true);
        } catch (err) {
            console.warn('Error destroying previous Phaser game:', err);
        }
        gameState.phaserGame = null;
        gameState.currentScene = null;
    }

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