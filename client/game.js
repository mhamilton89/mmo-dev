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

// Combat configuration constants
const MELEE_ATTACK_RANGE = 64;  // Range in pixels for melee weapons
const ATTACK_CONE_ANGLE = 90;   // Cone angle in degrees for AOE hit detection

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
    drawGoldIcon();
});

// Draw the gold coin icon in the inventory
function drawGoldIcon() {
    const canvas = document.getElementById('gold-icon');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Draw gold circle (same as the loot sprite)
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2); // Center at (8, 8) with radius 8
    ctx.fill();
}

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
        this.equipmentManager = null; // Will be initialized in create()
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

        // Load equipment sprite sheets dynamically
        console.log('Preloading equipment sprites...');
        // Initialize equipment manager early for preloading
        const tempEquipmentManager = new EquipmentManager(this);
        tempEquipmentManager.preloadAll();

        // Load resource sprites
        console.log('Preloading resource sprites...');
        this.load.image('tree', 'assets/resources/tree.png');
        this.load.image('iron_ore', 'assets/resources/iron_ore.png');
        this.load.image('copper_ore', 'assets/resources/copper_ore.png');

        // Load enemy sprite sheets
        console.log('Preloading enemy sprites...');
        // Load unified skeleton sprite (single-layer LPC format with all animations)
        this.load.spritesheet('skeleton', 'assets/enemies/skeleton-basic.png', {
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
        this.oneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.twoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

        // Setup mouse input for combat
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.player) {
                // Get mouse world position
                const mouseX = pointer.worldX;
                const mouseY = pointer.worldY;

                // Calculate direction from player to mouse click
                const dx = mouseX - this.player.x;
                const dy = mouseY - this.player.y;

                // Determine attack direction based on angle
                let attackDir;
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal direction dominant
                    attackDir = dx > 0 ? 'east' : 'west';
                } else {
                    // Vertical direction dominant
                    attackDir = dy > 0 ? 'south' : 'north';
                }

                console.log(`[COMBAT] Mouse click at (${mouseX}, ${mouseY}), player at (${this.player.x}, ${this.player.y}), attacking ${attackDir}`);
                this.handleSlashOversize(attackDir);
            }
        });

        // Combat state
        this.isAttacking = false;
        this.lastAttackTime = 0;  // Track when last attack occurred (for cooldown)

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

        // Create group for loot items
        this.loot = this.add.group({
            runChildUpdate: false
        });

        // Initialize enemy manager
        this.enemyManager = new EnemyManager();
        console.log('Enemy manager initialized');

        // Create skeleton animations
        this.createSkeletonAnimations();

        // Create warrior animations
        this.createWarriorAnimations();

        // Create wizard animations
        this.createWizardAnimations();

        // Initialize equipment manager and create animations dynamically
        this.equipmentManager = new EquipmentManager(this);
        this.equipmentManager.createAllAnimations();

        // Enemies will be spawned when server sends enemy data (no local spawning)

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

        const texture = this.textures.get('skeleton');
        if (!texture || texture.key === '__MISSING') {
            console.error('Skeleton texture not loaded!');
            return;
        }

        const source = texture.source[0];
        const frameWidth = 64;
        const cols = Math.floor(source.width / frameWidth);

        console.log(`LPC Skeleton (unified): ${source.width}x${source.height} (${cols} cols)`);

        // LPC direction order: 0=Up, 1=Left, 2=Down, 3=Right
        const getFrameRange = (rowStart, direction, frameCount) => {
            const directionRow = { up: 0, left: 1, down: 2, right: 3 }[direction];
            const row = rowStart + directionRow;
            const start = row * cols;
            const end = start + frameCount - 1;
            return { start, end };
        };

        try {
            // LPC Universal Format:
            // Rows 0-3: Spellcast, 4-7: Thrust, 8-11: Walk, 12-15: Slash, 20: Hurt

            // Create Walk animations - rows 8-11, 9 frames each
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getFrameRange(8, dir, 9);
                this.createSafeAnimation(`skeleton_walk_${dir}`, 'skeleton', range.start, range.end, 10);
            });

            // Create Idle animations - use first frame of walk for each direction
            const idleFrames = { up: 104, left: 117, down: 130, right: 143 };
            ['up', 'left', 'down', 'right'].forEach(dir => {
                this.createSafeAnimation(`skeleton_idle_${dir}`, 'skeleton', idleFrames[dir], idleFrames[dir], 1);
            });

            // Create Slash animations - rows 12-15, 6 frames each
            ['up', 'left', 'down', 'right'].forEach(dir => {
                const range = getFrameRange(12, dir, 6);
                this.createSafeAnimation(`skeleton_slash_${dir}`, 'skeleton', range.start, range.end, 15, 0);
            });

            // Create Hurt animation - row 20, 6 frames, non-directional
            this.createSafeAnimation('skeleton_hurt', 'skeleton', 260, 265, 8, 0);

            console.log('✓ Skeleton animations created from single sprite sheet');
        } catch (error) {
            console.error('Error creating skeleton animations:', error);
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

        // Create warrior attack animations (rows 50-53 for slash animations - last 4 rows of 54-row sprite)
        this.createSafeAnimation('warrior_attack_up', 'warrior_class', 50 * 13, 50 * 13 + 5, 15);
        this.createSafeAnimation('warrior_attack_left', 'warrior_class', 51 * 13, 51 * 13 + 5, 15);
        this.createSafeAnimation('warrior_attack_down', 'warrior_class', 52 * 13, 52 * 13 + 5, 15);
        this.createSafeAnimation('warrior_attack_right', 'warrior_class', 53 * 13, 53 * 13 + 5, 15);
        console.log('✓ Warrior attack animations created');
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

    // Equipment animations are now handled dynamically by EquipmentManager
    // See equipment-registry.js for equipment configuration
    createEquipmentAnimations() {
        console.log('Note: Equipment animations are now managed by EquipmentManager');
        // This method is kept for backward compatibility but does nothing
        // Equipment animations are created in create() via this.equipmentManager.createAllAnimations()
    }

    // Helper method to create animations with validation
    createSafeAnimation(key, texture, start, end, frameRate, repeat = -1) {
        if (this.anims.exists(key)) return;

        try {
            this.anims.create({
                key: key,
                frames: this.anims.generateFrameNumbers(texture, { start, end }),
                frameRate: frameRate,
                repeat: repeat
            });
            console.log(`Created animation: ${key} (frames ${start}-${end})`);
        } catch (error) {
            console.error(`Failed to create animation ${key}:`, error);
        }
    }

    // Helper to get equipment animation key from the sprite layer
    getEquipmentAnimKey(equipLayer, state, direction) {
        if (!equipLayer || !equipLayer.texture) return null;
        const equipKey = equipLayer.texture.key;
        return this.equipmentManager.getAnimationKey(equipKey, state, direction);
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
    /**
     * Spawn a single enemy from server data
     */
    spawnEnemy(enemyData) {
        // Check if animations exist
        if (!this.anims.exists('skeleton_idle_down')) {
            console.error('Cannot spawn enemy - animations not created!');
            return null;
        }

        try {
            console.log(`[SPAWN] Creating enemy ${enemyData.id} (${enemyData.type}) at (${enemyData.x}, ${enemyData.y})`);

            // Create physics sprite - use unified skeleton texture (frame 130 = idle down)
            const enemy = this.enemies.create(enemyData.x, enemyData.y, enemyData.type, 130);

            if (!enemy) {
                console.error(`Failed to create enemy sprite for ${enemyData.id}`);
                return null;
            }

            enemy.setScale(1.0);
            enemy.setCollideWorldBounds(true);
            enemy.setDepth(100);
            enemy.setScrollFactor(1);

            // Create health bar background (centered)
            const healthBarBg = this.add.rectangle(enemyData.x, enemyData.y - 25, 40, 4, 0x000000);
            healthBarBg.setOrigin(0.5, 0.5);
            healthBarBg.setDepth(105);
            healthBarBg.setScrollFactor(1);
            enemy.healthBarBg = healthBarBg;

            // Create health bar foreground (left-aligned)
            const healthBarFg = this.add.rectangle(enemyData.x - 20, enemyData.y - 25, 40, 4, 0x00ff00);
            healthBarFg.setOrigin(0, 0.5);
            healthBarFg.setDepth(106);
            healthBarFg.setScrollFactor(1);
            enemy.healthBar = healthBarFg;

            // Create level text
            const levelText = this.add.text(enemyData.x, enemyData.y - 35, `Lv.${enemyData.level}`, {
                fontSize: '10px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            });
            levelText.setOrigin(0.5);
            levelText.setDepth(107);
            levelText.setScrollFactor(1);
            enemy.levelText = levelText;

            // Store server-provided enemy data
            enemy.enemyId = enemyData.id;
            enemy.enemyType = enemyData.type;
            enemy.enemyData = {
                name: enemyData.name,
                level: enemyData.level,
                health: enemyData.health,
                maxHealth: enemyData.maxHealth
            };

            // Start with idle animation
            enemy.anims.play(`${enemyData.type}_idle_down`, true);

            console.log(`[SPAWN] Spawned ${enemyData.name} Lv.${enemyData.level} (${enemyData.health}/${enemyData.maxHealth} HP) ID: ${enemyData.id}`);

            return enemy;
        } catch (error) {
            console.error(`Error spawning enemy ${enemyData.id}:`, error);
            return null;
        }
    }

    // ========================================
    // RENDER SERVER ENEMIES (on join)
    // ========================================
    renderServerEnemies(enemyData) {
        console.log(`[SPAWN] Spawning ${enemyData.length} enemies from server on join`);

        enemyData.forEach((serverEnemy) => {
            this.spawnEnemy(serverEnemy);
        });

        console.log(`[SPAWN] Total enemies: ${this.enemies.getLength()}`);
    }

    // ========================================
    // LOOT SYSTEM
    // ========================================

    /**
     * Spawn a loot item on the ground
     */
    spawnLoot(lootData) {
        const { id, x, y, gold } = lootData;

        console.log(`[LOOT] Spawning ${gold} gold at (${x}, ${y})`);

        // Create placeholder gold sprite (yellow circle)
        const graphics = this.add.graphics();
        graphics.fillStyle(0xFFD700, 1); // Gold color
        graphics.fillCircle(0, 0, 8); // 8px radius circle
        graphics.generateTexture('gold_coin_temp', 16, 16);
        graphics.destroy();

        // Create loot sprite
        const lootSprite = this.add.sprite(x, y, 'gold_coin_temp');
        lootSprite.setDepth(5); // Above ground, below players
        lootSprite.lootId = id;
        lootSprite.gold = gold;

        // Add to loot group
        this.loot.add(lootSprite);

        // Add pulsing animation
        this.tweens.add({
            targets: lootSprite,
            scale: { from: 1, to: 1.2 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        console.log(`[LOOT] Spawned loot ${id}, total loot items: ${this.loot.getLength()}`);
    }

    /**
     * Render initial loot from server (on join)
     */
    renderServerLoot(lootData) {
        console.log(`[LOOT] Rendering ${lootData.length} loot items from server`);

        lootData.forEach((loot) => {
            this.spawnLoot(loot);
        });
    }

    /**
     * Remove loot item (collected or despawned)
     */
    removeLoot(lootId) {
        const lootSprite = this.loot.getChildren().find(l => l.lootId === lootId);
        if (lootSprite) {
            lootSprite.destroy();
            console.log(`[LOOT] Removed loot ${lootId}`);
        }
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
        // const enemyCount = this.enemies.getLength();

        // Log if enemy count changes (disabled - too noisy)
        // if (!this.lastEnemyCount || this.lastEnemyCount !== enemyCount) {
        //     console.log(`[ENEMY] Enemy count: ${enemyCount} (was ${this.lastEnemyCount || 0})`);
        //     this.lastEnemyCount = enemyCount;
        // }

        // Track visibility changes every 60 frames (~1 second)
        if (!this.enemyVisibilityCheckFrame) this.enemyVisibilityCheckFrame = 0;
        this.enemyVisibilityCheckFrame++;

        this.enemies.children.each((enemy, index) => {
            if (!enemy) {
                console.warn('[ENEMY] Null enemy found in group');
                return;
            }

            if (!enemy.active) {
                // Skip inactive enemies (they're fading out after death)
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

            // Update health bar positions
            if (enemy.healthBarBg) {
                enemy.healthBarBg.setPosition(enemy.x, enemy.y - 25);
            }
            if (enemy.healthBar) {
                // Health bar is left-aligned (origin 0, 0.5), so position at left edge
                enemy.healthBar.setPosition(enemy.x - 20, enemy.y - 25);
            }
            if (enemy.levelText) {
                enemy.levelText.setPosition(enemy.x, enemy.y - 35);
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

        // For idle, use first frame of walk animation for each direction
        const idleFrameMap = { up: 104, left: 117, down: 130, right: 143 };
        const frameIndex = idleFrameMap[enemy.facing] || 130;  // default to down

        // Update texture
        if (enemy.texture.key !== 'skeleton' || enemy.frame.name !== frameIndex) {
            enemy.anims.stop();
            enemy.setTexture('skeleton', frameIndex);
            console.log(`[IDLE] Set skeleton to frame ${frameIndex}`);
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
    }

    stopEnemyWalking(enemy, currentTime) {
        enemy.setVelocity(0, 0);
        enemy.enemyState = 'idle';
        enemy.stateTimer = currentTime + Phaser.Math.Between(2000, 4000);

        // Use first frame of walk animation for idle
        const idleFrameMap = { up: 104, left: 117, down: 130, right: 143 };
        const frameIndex = idleFrameMap[enemy.facing] || 130;
        enemy.anims.stop();
        enemy.setTexture('skeleton', frameIndex);
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

        // Add equipment layers dynamically using EquipmentManager
        if ((character.class === 'Warrior' || character.class === 'Wizard') && character.equipment) {
            console.log('Character equipment:', character.equipment);

            // Add armor layer
            if (character.equipment.armor) {
                const armorKey = character.equipment.armor.name;
                console.log('Armor key:', armorKey, 'exists:', this.equipmentManager.exists(armorKey));
                if (this.equipmentManager.exists(armorKey)) {
                    const idleFrame = this.equipmentManager.getDefaultIdleFrame(armorKey);
                    const armorSprite = this.add.sprite(character.x, character.y, armorKey, idleFrame);
                    armorSprite.setScale(playerScale);
                    armorSprite.setDepth(this.equipmentManager.getDepth(armorKey));
                    armorSprite.setScrollFactor(1);
                    sprite.armorLayer = armorSprite;
                    console.log('Armor layer added to player:', armorKey, 'visible:', armorSprite.visible, 'depth:', armorSprite.depth);
                } else {
                    console.warn('Armor texture not found:', armorKey);
                }
            } else {
                console.log('No armor equipped');
            }

            // Add weapon layer
            if (character.equipment.weapon) {
                const weaponKey = character.equipment.weapon.name;
                if (this.equipmentManager.exists(weaponKey)) {
                    const idleFrame = this.equipmentManager.getDefaultIdleFrame(weaponKey);
                    console.log('Creating weapon layer with key:', weaponKey, 'at frame:', idleFrame);
                    const weaponSprite = this.add.sprite(character.x, character.y, weaponKey, idleFrame);
                    weaponSprite.setScale(playerScale);
                    weaponSprite.setDepth(this.equipmentManager.getDepth(weaponKey));
                    weaponSprite.setScrollFactor(1);
                    weaponSprite.setVisible(true);
                    sprite.weaponLayer = weaponSprite;
                    console.log('Weapon layer added to player:', weaponKey, 'visible:', weaponSprite.visible, 'depth:', weaponSprite.depth);
                }
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

        // Add equipment layers dynamically using EquipmentManager
        if (playerData.equipment) {
            // Add armor layer
            if (playerData.equipment.armor) {
                const armorKey = playerData.equipment.armor.name;
                if (this.equipmentManager.exists(armorKey)) {
                    const idleFrame = this.equipmentManager.getDefaultIdleFrame(armorKey);
                    const armorSprite = this.add.sprite(playerData.x, playerData.y, armorKey, idleFrame);
                    armorSprite.setScale(playerScale);
                    armorSprite.setDepth(this.equipmentManager.getDepth(armorKey));
                    sprite.armorLayer = armorSprite;
                }
            }

            // Add weapon layer
            if (playerData.equipment.weapon) {
                const weaponKey = playerData.equipment.weapon.name;
                if (this.equipmentManager.exists(weaponKey)) {
                    const idleFrame = this.equipmentManager.getDefaultIdleFrame(weaponKey);
                    const weaponSprite = this.add.sprite(playerData.x, playerData.y, weaponKey, idleFrame);
                    weaponSprite.setScale(playerScale);
                    weaponSprite.setDepth(this.equipmentManager.getDepth(weaponKey));
                    weaponSprite.setVisible(true);
                    sprite.weaponLayer = weaponSprite;
                }
            }
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

    /**
     * Detect all enemies within a cone in front of the player
     * @param {Object} playerPos - Player position {x, y}
     * @param {string} direction - Player direction ('north', 'south', 'east', 'west')
     * @param {number} range - Attack range in pixels
     * @param {number} coneAngle - Cone angle in degrees
     * @returns {Array} Array of enemy IDs within the cone
     */
    detectEnemiesInCone(playerPos, direction, range, coneAngle) {
        const targets = [];

        // Direction to angle mapping (in degrees, 0 = east, 90 = south, etc.)
        const angleMap = {
            north: 270,
            south: 90,
            east: 0,
            west: 180
        };

        const centerAngle = angleMap[direction];
        const halfCone = coneAngle / 2;

        // Check each enemy
        if (!this.enemies) return targets;

        this.enemies.children.each(enemy => {
            if (!enemy || !enemy.active) return;

            // Calculate distance
            const dx = enemy.x - playerPos.x;
            const dy = enemy.y - playerPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if within range
            if (distance > range) return;

            // Calculate angle to enemy
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;

            // Calculate angle difference
            let angleDiff = Math.abs(angle - centerAngle);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            // Check if within cone
            if (angleDiff <= halfCone) {
                targets.push(enemy.enemyId);
            }
        });

        return targets;
    }

    handleAttack() {
        // Prevent attack spam
        if (this.isAttacking || !this.player) return;

        this.isAttacking = true;

        // Get current direction
        const currentDir = this.player.currentDirection || 'south';
        const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
        const animDirection = directionMap[currentDir];

        console.log(`[ATTACK] Direction: ${currentDir} -> ${animDirection}`);

        // Play character attack animation
        const characterAttackAnim = `${this.player.className.toLowerCase()}_attack_${animDirection}`;

        if (this.anims.exists(characterAttackAnim)) {
            // Play character attack animation using Phaser's animation system
            this.player.anims.play(characterAttackAnim, true);

            // Play armor attack animation if it exists (uses Phaser's animation system)
            if (this.player.armorLayer) {
                const armorKey = this.player.armorLayer.texture.key;
                const armorAttackAnim = `${armorKey}_attack_${animDirection}`;

                if (this.anims.exists(armorAttackAnim)) {
                    this.player.armorLayer.anims.play(armorAttackAnim, true);
                    console.log(`[ATTACK] Playing armor animation: ${armorAttackAnim}`);
                }
                // If no attack anim, armor stays on current frame (which is fine)
            }

            // Play weapon attack animation using Phaser's animation system
            if (this.player.weaponLayer) {
                const weaponKey = this.player.weaponLayer.texture.key;
                const weaponAttackAnim = `${weaponKey}_attack_${animDirection}`;

                console.log(`[ATTACK] Playing weapon animation: ${weaponAttackAnim}`);

                if (this.anims.exists(weaponAttackAnim)) {
                    // Set weapon visible - always above armor (depth 200)
                    this.player.weaponLayer.setVisible(true);
                    this.player.weaponLayer.setDepth(200);

                    // Play the weapon attack animation
                    this.player.weaponLayer.anims.play(weaponAttackAnim, true);

                    // When weapon animation completes, restore to idle using Phaser's event system
                    this.player.weaponLayer.once('animationcomplete', () => {
                        const idleAnim = `${weaponKey}_idle_${animDirection}`;
                        if (this.anims.exists(idleAnim)) {
                            this.player.weaponLayer.anims.play(idleAnim, true);
                        }
                        this.player.weaponLayer.setDepth(200);
                        console.log('[ATTACK] Weapon animation complete, restored to idle');
                    });
                } else {
                    console.warn(`[ATTACK] Weapon animation not found: ${weaponAttackAnim}`);
                }
            }

            // COMBAT: Hit detection at middle frame of attack animation
            // Get weapon config to determine attack frames and timing
            const weaponConfig = this.player.weaponLayer ?
                EQUIPMENT_REGISTRY[this.player.weaponLayer.texture.key] : null;

            if (weaponConfig && weaponConfig.attackFrames) {
                // Calculate middle frame timing
                const attackFramesArray = weaponConfig.attackFrames[animDirection];
                const frameCount = attackFramesArray ? attackFramesArray.length : 6;  // Default 6 frames
                const middleFrame = Math.floor(frameCount / 2);
                const attackSpeed = weaponConfig.attackSpeed || 8;  // FPS
                const hitDetectionDelay = (middleFrame * 1000) / attackSpeed;

                console.log(`[COMBAT] Attack has ${frameCount} frames, middle frame: ${middleFrame}, delay: ${hitDetectionDelay}ms`);

                // Trigger hit detection at middle frame
                this.time.delayedCall(hitDetectionDelay, () => {
                    // Detect enemies in cone
                    const playerPos = { x: this.player.x, y: this.player.y };
                    const weaponRange = weaponConfig.attackRange || MELEE_ATTACK_RANGE;
                    const targetIds = this.detectEnemiesInCone(
                        playerPos,
                        currentDir,
                        weaponRange,
                        ATTACK_CONE_ANGLE
                    );

                    console.log(`[COMBAT] Hit detection: found ${targetIds.length} enemies in cone:`, targetIds);

                    // Send attack event to server with targetIds
                    if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                        gameState.ws.send(JSON.stringify({
                            type: 'attack',
                            targetIds: targetIds,
                            attackType: weaponConfig.attackType || 'slash',
                            playerPosition: playerPos,
                            playerDirection: currentDir
                        }));
                        console.log(`[COMBAT] Sent attack event to server`);
                    }
                });
            }

            // Use Phaser's time system to end attack state
            this.time.delayedCall(400, () => {
                this.isAttacking = false;
                console.log('[ATTACK] Attack complete');
            });

        } else {
            console.warn(`[ATTACK] Character animation not found: ${characterAttackAnim}`);
            this.isAttacking = false;
        }
    }

    /**
     * DEBUG: Test attack animation with specific frames
     */
    testAttackRow(frames) {
        if (!this.player?.weaponLayer) return;

        const animKey = `test_attack_${frames[0]}`;

        // Remove old test animation
        if (this.anims.exists(animKey)) {
            this.anims.remove(animKey);
        }

        // Create test animation
        this.anims.create({
            key: animKey,
            frames: frames.map(f => ({ key: this.player.weaponLayer.texture.key, frame: f })),
            frameRate: 6, // Slow so we can see each frame
            repeat: 0
        });

        // Play it
        this.player.weaponLayer.anims.play(animKey, true);
        console.log('[DEBUG] Playing test animation with frames:', frames);
    }

    /**
     * Check for enemies in attack range and apply damage
     * @param {string} attackDirection - Attack direction (north/south/east/west)
     * @param {object} weaponConfig - Weapon configuration from registry
     */
    checkAttackHit(attackDirection, weaponConfig) {
        if (!this.player || !this.enemies) return;

        // Calculate attack range based on direction
        const ATTACK_RANGE = 80; // Base melee range in pixels
        const ATTACK_WIDTH = 60; // Width of attack hitbox

        // Calculate attack hitbox based on direction
        let hitboxX = this.player.x;
        let hitboxY = this.player.y;
        let hitboxWidth = ATTACK_WIDTH;
        let hitboxHeight = ATTACK_WIDTH;

        switch (attackDirection) {
            case 'north':
                hitboxY -= ATTACK_RANGE / 2;
                hitboxHeight = ATTACK_RANGE;
                break;
            case 'south':
                hitboxY += ATTACK_RANGE / 2;
                hitboxHeight = ATTACK_RANGE;
                break;
            case 'east':
                hitboxX += ATTACK_RANGE / 2;
                hitboxWidth = ATTACK_RANGE;
                break;
            case 'west':
                hitboxX -= ATTACK_RANGE / 2;
                hitboxWidth = ATTACK_RANGE;
                break;
        }

        // Get player damage from weapon
        const weaponDamage = weaponConfig?.attackDamage || 15; // Default 15 damage

        // Check each enemy for collision with attack hitbox
        let targetIds = [];
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active || !enemy.enemyData) return;

            // Check if enemy is in attack range
            const dx = Math.abs(enemy.x - hitboxX);
            const dy = Math.abs(enemy.y - hitboxY);

            if (dx < hitboxWidth / 2 && dy < hitboxHeight / 2) {
                targetIds.push(enemy.enemyId);
            }
        });

        if (targetIds.length > 0) {
            console.log(`[COMBAT] Hit detection: found ${targetIds.length} enemies:`, targetIds);

            // Send attack event to server with targetIds
            if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
                gameState.ws.send(JSON.stringify({
                    type: 'attack',
                    targetIds: targetIds,
                    attackType: weaponConfig?.attackType || 'slash',
                    playerPosition: { x: this.player.x, y: this.player.y },
                    playerDirection: attackDirection
                }));
                console.log(`[COMBAT] Sent attack event to server`);
            }
        } else {
            console.log('[COMBAT] Attack missed - no enemies in range');
        }
    }

    /**
     * Update enemy health bar visualization
     */
    updateEnemyHealthBar(enemy, currentHealth, maxHealth) {
        if (!enemy.healthBar) return;

        const healthPercent = currentHealth / maxHealth;
        const maxWidth = 40;
        enemy.healthBar.width = maxWidth * healthPercent;

        // Change color based on health
        if (healthPercent > 0.6) {
            enemy.healthBar.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            enemy.healthBar.setFillStyle(0xffff00); // Yellow
        } else {
            enemy.healthBar.setFillStyle(0xff0000); // Red
        }
    }

    /**
     * Show floating damage number
     */
    showDamageNumber(x, y, damage) {
        const damageText = this.add.text(x, y, `-${damage}`, {
            fontSize: '16px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        });
        damageText.setOrigin(0.5, 0.5);
        damageText.setDepth(1000);

        // Float up and fade out
        this.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    /**
     * Handle enemy death
     */
    handleEnemyDeath(enemy) {
        console.log(`[COMBAT] Enemy defeated: ${enemy.enemyId}`);

        // Mark as dead to stop processing in update loop
        enemy.isDead = true;

        // Stop any movement
        if (enemy.body) {
            enemy.setVelocity(0, 0);
        }

        // Destroy UI elements (but keep head sprite for death animation)
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.healthBar) enemy.healthBar.destroy();
        if (enemy.levelText) enemy.levelText.destroy();

        // Stop any current animation first (slash, walk, etc.) before playing death animation
        if (enemy.anims && enemy.anims.isPlaying) {
            enemy.anims.stop();
        }

        // Remove any animation complete listeners that might interfere
        enemy.off('animationcomplete');

        // Play hurt animation (non-directional) - row 20, frames 260-265
        enemy.setTexture('skeleton', 260);
        enemy.play('skeleton_hurt');

        // After animation completes (6 frames @ 8 FPS = 750ms), hold on last frame
        this.time.delayedCall(750, () => {
            if (!enemy || !enemy.scene) return;

            enemy.anims.stop();
            enemy.setFrame(265); // Last frame of hurt animation (collapsed on ground)
        });

        // Keep body visible for 20 seconds, then fade out and destroy
        this.time.delayedCall(20000, () => {
            // Check if enemy still exists before fading out
            if (!enemy || !enemy.scene) {
                console.log(`[DEATH] Enemy already destroyed, skipping fade-out`);
                return;
            }

            this.tweens.add({
                targets: [enemy],
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    if (enemy && enemy.scene) enemy.destroy();
                }
            });
        });

        // TODO: Award experience and loot to player
    }

    /**
     * Handle damage event from server
     */
    handleDamageEvent(data) {
        const { targetId, damage, targetHealth, targetMaxHealth } = data;

        // Find the enemy by ID
        const enemy = this.enemies.getChildren().find(e => e.enemyId === targetId);
        if (!enemy) {
            console.warn(`[COMBAT] Enemy ${targetId} not found for damage event`);
            return;
        }

        console.log(`[COMBAT] Damage event: ${targetId} took ${damage} damage (${targetHealth}/${targetMaxHealth} HP)`);

        // Update health bar
        this.updateEnemyHealthBar(enemy, targetHealth, targetMaxHealth);

        // Show damage number
        this.showDamageNumber(enemy.x, enemy.y - 40, damage);

        // Flash enemy red
        enemy.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            enemy.clearTint();
        });
    }

    /**
     * Handle enemy death event from server
     */
    handleEnemyDeathEvent(data) {
        const { enemyId, killerId, loot, experience, lootSpawn } = data;

        // Find the enemy by ID
        const enemy = this.enemies.getChildren().find(e => e.enemyId === enemyId);
        if (!enemy) {
            console.warn(`[COMBAT] Enemy ${enemyId} not found for death event`);
            return;
        }

        console.log(`[COMBAT] Enemy death event: ${enemyId} defeated by ${killerId}`);

        // If we are the killer, show XP notification
        if (killerId === gameState.character.id) {
            addChatMessage(`+${experience} XP`, 'system');
        }

        // Spawn loot if present
        if (lootSpawn) {
            this.spawnLoot(lootSpawn);
        }

        // Play death animation
        this.handleEnemyDeath(enemy);
    }

    /**
     * Handle enemy attack animation event from server
     */
    handleEnemyAttackEvent(data) {
        const { enemyId, targetId, direction } = data;

        // Find the enemy by ID
        const enemy = this.enemies.getChildren().find(e => e.enemyId === enemyId);
        if (!enemy) {
            console.warn(`[COMBAT] Enemy ${enemyId} not found for attack event`);
            return;
        }

        console.log(`[COMBAT] Enemy attack event: ${enemyId} attacking ${targetId} facing ${direction}`);

        // Play slash animation
        const slashAnim = `skeleton_slash_${direction}`;
        if (enemy.anims && this.anims.exists(slashAnim)) {
            enemy.anims.play(slashAnim, true);
        }

        // After attack animation completes, return to idle/walk based on current server state
        enemy.once('animationcomplete', () => {
            // If still in attack state, play idle while waiting for next attack
            if (enemy.currentState === 'attack') {
                const idleAnim = `skeleton_idle_${direction}`;
                if (this.anims.exists(idleAnim)) {
                    enemy.anims.play(idleAnim, true);
                }
                return;
            }

            if (enemy.currentState === 'idle') {
                const idleAnim = `skeleton_idle_${direction}`;
                if (this.anims.exists(idleAnim)) {
                    enemy.anims.play(idleAnim, true);
                }
            } else if (enemy.currentState === 'wander' || enemy.currentState === 'chase' || enemy.currentState === 'return') {
                const walkAnim = `skeleton_walk_${direction}`;
                if (this.anims.exists(walkAnim)) {
                    enemy.anims.play(walkAnim, true);
                }
            }
        });
    }

    /**
     * Update enemy positions from server (called every 100ms)
     */
    updateEnemyPositions(enemyUpdates) {
        if (!enemyUpdates || !this.enemies) return;

        enemyUpdates.forEach(update => {
            // Find enemy sprite by ID
            const enemy = this.enemies.getChildren().find(e => e.enemyId === update.id);
            if (!enemy || enemy.isDead) return; // Skip if enemy not found or dead

            // Stop any existing tween
            if (enemy.moveTween) {
                enemy.moveTween.stop();
            }

            // Smoothly interpolate to new position
            enemy.moveTween = this.tweens.add({
                targets: enemy,
                x: update.x,
                y: update.y,
                duration: 100, // Match server tick rate
                ease: 'Linear',
                onUpdate: () => {
                    // Update attached sprites to follow enemy
                    if (enemy.levelText) {
                        enemy.levelText.x = enemy.x;
                        enemy.levelText.y = enemy.y - 35;
                    }
                    // Update health bar positions (Rectangle objects, not Graphics)
                    if (enemy.healthBarBg) {
                        enemy.healthBarBg.x = enemy.x;
                        enemy.healthBarBg.y = enemy.y - 25;
                    }
                    if (enemy.healthBar) {
                        const healthPercent = update.health / update.maxHealth;
                        enemy.healthBar.x = enemy.x - 20; // Left-aligned
                        enemy.healthBar.y = enemy.y - 25;
                        enemy.healthBar.width = 40 * healthPercent;
                    }
                }
            });

            // Store current state on enemy for animation handlers to reference
            enemy.currentState = update.state;

            // Update animation based on state
            if (update.state === 'idle') {
                const idleAnim = `skeleton_idle_${update.direction}`;
                if (enemy.anims && this.anims.exists(idleAnim) && enemy.anims.currentAnim?.key !== idleAnim) {
                    enemy.anims.play(idleAnim, true);
                }
            } else if (update.state === 'wander' || update.state === 'chase' || update.state === 'return') {
                const walkAnim = `skeleton_walk_${update.direction}`;
                if (enemy.anims && this.anims.exists(walkAnim) && enemy.anims.currentAnim?.key !== walkAnim) {
                    enemy.anims.play(walkAnim, true);
                }
            }
            // Note: 'attack' state is handled separately by handleEnemyAttackEvent
            // which plays the slash animation, so we don't override it here

            // Update health (for real-time sync)
            enemy.currentHealth = update.health;
        });
    }

    /**
     * Handle slash oversize attack - uses Phaser animation system for all layers
     * Per spec 006-combat-system: All animations MUST use Phaser's anims.play()
     * @param {string} attackDirection - Optional attack direction (north/south/east/west). If not provided, uses current movement direction.
     */
    handleSlashOversize(attackDirection = null) {
        // Prevent attack spam - check both animation state and cooldown
        if (this.isAttacking || !this.player) return;

        // Get weapon config from equipment registry
        const weaponKey = this.player.weaponLayer?.texture?.key;
        const weaponConfig = weaponKey ? EQUIPMENT_REGISTRY[weaponKey] : null;
        const ATTACK_FPS = weaponConfig?.attackSpeed || 10;
        const SWING_SPEED = weaponConfig?.swingSpeed || 1; // Default 1 second cooldown

        // Check cooldown timer
        const currentTime = this.time.now;
        const timeSinceLastAttack = (currentTime - this.lastAttackTime) / 1000; // Convert to seconds
        if (timeSinceLastAttack < SWING_SPEED) {
            const remainingCooldown = (SWING_SPEED - timeSinceLastAttack).toFixed(1);
            console.log(`[COMBAT] Attack on cooldown! ${remainingCooldown}s remaining`);
            return;
        }

        // Start attack
        this.isAttacking = true;
        this.lastAttackTime = currentTime;

        // Get attack direction (use provided direction or fall back to current movement direction)
        const currentDir = attackDirection || this.player.currentDirection || 'south';
        const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
        const animDirection = directionMap[currentDir];

        console.log(`[COMBAT] Slash oversize - Direction: ${animDirection}, FPS: ${ATTACK_FPS}, Cooldown: ${SWING_SPEED}s`);

        // === CHARACTER ANIMATION ===
        const characterAttackAnim = `${this.player.className.toLowerCase()}_attack_${animDirection}`;
        if (!this.anims.exists(characterAttackAnim)) {
            console.warn(`[COMBAT] Character animation not found: ${characterAttackAnim}`);
            this.isAttacking = false;
            return;
        }

        // Play character attack with weapon's attack speed (repeat: 0 overrides default loop)
        this.player.anims.play({ key: characterAttackAnim, frameRate: ATTACK_FPS, repeat: 0 }, true);

        // Allow next animation after character animation completes
        this.player.once('animationcomplete', () => {
            this.isAttacking = false;
            console.log('[COMBAT] Attack animation complete');
        });

        // === HIT DETECTION AND DAMAGE ===
        // Check for enemies in attack range after a short delay (hit frame timing)
        // Waraxe at 8 FPS has ~125ms per frame, hit on frame 3 (~375ms)
        const frameCount = weaponConfig?.attackFrames?.[animDirection]?.length || 6;
        const hitFrameDelay = (1000 / ATTACK_FPS) * Math.floor(frameCount / 2); // Hit on middle frame

        this.time.delayedCall(hitFrameDelay, () => {
            this.checkAttackHit(currentDir, weaponConfig);
        });

        // === ARMOR ANIMATION ===
        if (this.player.armorLayer) {
            const armorKey = this.player.armorLayer.texture.key;
            const armorAttackAnimKey = `${armorKey}_attack_${animDirection}`;

            // Create armor attack animation (destroy old one to ensure latest framerate)
            if (this.anims.exists(armorAttackAnimKey)) {
                this.anims.remove(armorAttackAnimKey);
            }

            // Armor attack frames: rows 50-53, 13 cols per row, 6 frames each
            const armorAttackFrameMap = {
                up: [650, 651, 652, 653, 654, 655],     // row 50
                left: [663, 664, 665, 666, 667, 668],   // row 51
                down: [676, 677, 678, 679, 680, 681],   // row 52
                right: [689, 690, 691, 692, 693, 694]   // row 53
            };
            const armorFrames = armorAttackFrameMap[animDirection];

            this.anims.create({
                key: armorAttackAnimKey,
                frames: armorFrames.map(frame => ({ key: armorKey, frame: frame })),
                frameRate: ATTACK_FPS,
                repeat: 0
            });
            console.log(`[COMBAT] Created armor animation: ${armorAttackAnimKey}`);

            // Play armor attack animation (repeat: 0 ensures single play)
            this.player.armorLayer.anims.play({ key: armorAttackAnimKey, frameRate: ATTACK_FPS, repeat: 0 }, true);

            // Restore armor to idle after animation
            this.player.armorLayer.once('animationcomplete', () => {
                const directionOffset = { up: 0, left: 1, down: 2, right: 3 }[animDirection];
                const idleFrame = (8 + directionOffset) * 13;
                this.player.armorLayer.setFrame(idleFrame);
            });
        }

        // === WEAPON ANIMATION ===
        if (this.player.weaponLayer && weaponConfig?.attackFrames) {
            const attackFrames = weaponConfig.attackFrames[animDirection];

            if (!attackFrames || attackFrames.length === 0) {
                console.warn(`[COMBAT] No weapon attack frames for ${weaponKey} ${animDirection}`);
            } else if (weaponConfig.hasOversizeAttack) {
                // === OVERSIZE WEAPON ATTACK ===
                // Use 192x192 oversize texture for attack animation
                const oversizeTextureKey = `${weaponKey}_oversize`;

                // Hide regular weapon layer during attack
                this.player.weaponLayer.setVisible(false);

                // Create or reuse oversize attack sprite
                if (!this.player.oversizeWeaponLayer) {
                    this.player.oversizeWeaponLayer = this.add.sprite(
                        this.player.x,
                        this.player.y,
                        oversizeTextureKey,
                        attackFrames[0]
                    );
                    this.player.oversizeWeaponLayer.setOrigin(0.5, 0.5);
                }

                // Position and configure oversize sprite
                this.player.oversizeWeaponLayer.setTexture(oversizeTextureKey, attackFrames[0]);
                this.player.oversizeWeaponLayer.setPosition(this.player.x, this.player.y);
                this.player.oversizeWeaponLayer.setDepth(weaponConfig.depth || 200);
                this.player.oversizeWeaponLayer.setVisible(true);

                // Create oversize attack animation
                const oversizeAnimKey = `${weaponKey}_oversize_slash_${animDirection}`;
                if (this.anims.exists(oversizeAnimKey)) {
                    this.anims.remove(oversizeAnimKey);
                }
                this.anims.create({
                    key: oversizeAnimKey,
                    frames: attackFrames.map(frame => ({ key: oversizeTextureKey, frame: frame })),
                    frameRate: ATTACK_FPS,
                    repeat: 0
                });
                console.log(`[COMBAT] Created OVERSIZE weapon animation: ${oversizeAnimKey} with frames:`, attackFrames);

                // Play oversize attack animation
                this.player.oversizeWeaponLayer.anims.play({ key: oversizeAnimKey, frameRate: ATTACK_FPS, repeat: 0 }, true);

                // Debug logging
                this.player.oversizeWeaponLayer.once('animationstart', (_anim, frame) => {
                    console.log(`[COMBAT] Oversize animation START - Frame: ${frame.frame.name}`);
                });

                // Restore regular weapon after animation
                this.player.oversizeWeaponLayer.once('animationcomplete', () => {
                    this.player.oversizeWeaponLayer.setVisible(false);
                    this.player.weaponLayer.setVisible(true);
                    const idleFrame = weaponConfig.idleFrames?.[animDirection] || 162;
                    this.player.weaponLayer.setFrame(idleFrame);
                    console.log(`[COMBAT] Oversize attack complete, restored idle frame: ${idleFrame}`);
                });
            } else {
                // === REGULAR WEAPON ATTACK ===
                // Set weapon visible and depth
                this.player.weaponLayer.setVisible(true);
                this.player.weaponLayer.setDepth(weaponConfig.depth || 200);

                // Create weapon attack animation
                const weaponAttackAnimKey = `${weaponKey}_slash_${animDirection}`;
                if (this.anims.exists(weaponAttackAnimKey)) {
                    this.anims.remove(weaponAttackAnimKey);
                }
                this.anims.create({
                    key: weaponAttackAnimKey,
                    frames: attackFrames.map(frame => ({ key: weaponKey, frame: frame })),
                    frameRate: ATTACK_FPS,
                    repeat: 0
                });
                console.log(`[COMBAT] Created weapon animation: ${weaponAttackAnimKey} with ${attackFrames.length} frames:`, attackFrames);

                // Play weapon attack animation
                this.player.weaponLayer.anims.play({ key: weaponAttackAnimKey, frameRate: ATTACK_FPS, repeat: 0 }, true);

                // Restore weapon to idle after animation
                this.player.weaponLayer.once('animationcomplete', () => {
                    const idleFrame = weaponConfig.idleFrames?.[animDirection] || 162;
                    this.player.weaponLayer.setFrame(idleFrame);
                    console.log(`[COMBAT] Weapon restored to idle frame: ${idleFrame}`);
                });
            }
        }
    }

    update() {
        if (!this.player) return;

        // Check for attack input (1 key = basic attack, 2 key = slash oversize)
        if (Phaser.Input.Keyboard.JustDown(this.oneKey)) {
            this.handleAttack();
        }
        if (Phaser.Input.Keyboard.JustDown(this.twoKey)) {
            this.handleSlashOversize();
        }

        // DEBUG: Test different LPC attack animation rows (for DOWN direction)
        // Waraxe supports: spellcast, thrust, walk, slash, shoot, hurt (NOT slash_oversize!)
        // Q = Thrust (row 6), E = Slash (row 14), R = Shoot (row 18), T = Slash ext (row 56)
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('Q'))) {
            const testFrames = [108, 109, 110, 111, 112, 113]; // Row 6 (thrust down - compact)
            console.log('[DEBUG] Testing THRUST DOWN (row 6) - frames:', testFrames);
            this.testAttackRow(testFrames);
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('E'))) {
            const testFrames = [252, 253, 254, 255, 256, 257]; // Row 14 (slash down - compact)
            console.log('[DEBUG] Testing SLASH DOWN (row 14) - frames:', testFrames);
            this.testAttackRow(testFrames);
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('R'))) {
            const testFrames = [324, 325, 326, 327, 328, 329]; // Row 18 (shoot down)
            console.log('[DEBUG] Testing SHOOT DOWN (row 18) - frames:', testFrames);
            this.testAttackRow(testFrames);
        }
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('T'))) {
            const testFrames = [1008, 1009, 1010, 1011, 1012, 1013]; // Row 56 (slash down - extended)
            console.log('[DEBUG] Testing SLASH DOWN EXTENDED (row 56) - frames:', testFrames);
            this.testAttackRow(testFrames);
        }

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

            // Always update current direction when moving (not just when it changes)
            const directionChanged = this.player.currentDirection !== newDirection;
            this.player.currentDirection = newDirection;

            // Only update animations if not attacking
            if (!this.isAttacking) {
                if (directionChanged) {

                if (this.player.className === 'Warrior' || this.player.className === 'Wizard') {
                    // Play walk animation for warrior and wizard
                    const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
                    const animDirection = directionMap[newDirection];
                    const animKey = `${this.player.className.toLowerCase()}_walk_${animDirection}`;
                    this.playSafeAnimation(this.player, animKey);

                    // Sync equipment animations dynamically
                    if (this.player.armorLayer) {
                        const armorAnimKey = this.getEquipmentAnimKey(this.player.armorLayer, 'walk', animDirection);
                        if (armorAnimKey && this.anims.exists(armorAnimKey)) {
                            this.player.armorLayer.anims.play(armorAnimKey, true);
                        }
                    }
                    if (this.player.weaponLayer) {
                        this.player.weaponLayer.setVisible(true);
                        const weaponAnimKey = this.getEquipmentAnimKey(this.player.weaponLayer, 'walk', animDirection);
                        if (weaponAnimKey && this.anims.exists(weaponAnimKey)) {
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

                    // Keep equipment animations synced dynamically
                    if (this.player.armorLayer) {
                        const armorAnimKey = this.getEquipmentAnimKey(this.player.armorLayer, 'walk', animDirection);
                        if (armorAnimKey && (!this.player.armorLayer.anims.isPlaying || this.player.armorLayer.anims.currentAnim?.key !== armorAnimKey)) {
                            if (this.anims.exists(armorAnimKey)) {
                                this.player.armorLayer.anims.play(armorAnimKey, true);
                            }
                        }
                    }
                    if (this.player.weaponLayer) {
                        this.player.weaponLayer.setVisible(true);
                        const weaponAnimKey = this.getEquipmentAnimKey(this.player.weaponLayer, 'walk', animDirection);
                        if (weaponAnimKey && (!this.player.weaponLayer.anims.isPlaying || this.player.weaponLayer.anims.currentAnim?.key !== weaponAnimKey)) {
                            if (this.anims.exists(weaponAnimKey)) {
                                this.player.weaponLayer.anims.play(weaponAnimKey, true);
                            }
                        }
                    }
                }
            }
        } else if (!this.isAttacking && (this.player.className === 'Warrior' || this.player.className === 'Wizard')) {
            // Player stopped moving AND not attacking - show idle frame (first frame of walk animation)
            const directionMap = { north: 'up', south: 'down', east: 'right', west: 'left' };
            const animDirection = directionMap[this.player.currentDirection];

            // Stop animation and show first frame
            this.player.anims.stop();

            // Calculate idle frame based on current direction
            // LPC sprite row mapping: up=row8, left=row9, down=row10, right=row11
            const directionOffset = { up: 0, left: 1, down: 2, right: 3 }[animDirection];
            const idleFrame = (8 + directionOffset) * 13; // First frame of each walk row
            this.player.setFrame(idleFrame);

            // Stop equipment animations and set idle frames
            if (this.player.armorLayer) {
                this.player.armorLayer.anims.stop();
                this.player.armorLayer.setFrame(idleFrame);
            }
            if (this.player.weaponLayer) {
                // Play weapon idle animation dynamically
                this.player.weaponLayer.setVisible(true);
                const weaponIdleAnimKey = this.getEquipmentAnimKey(this.player.weaponLayer, 'idle', animDirection);
                if (weaponIdleAnimKey && this.anims.exists(weaponIdleAnimKey)) {
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
        // Sync oversize weapon layer (192x192 attack sprite) if active
        if (sprite.oversizeWeaponLayer && sprite.oversizeWeaponLayer.visible) {
            sprite.oversizeWeaponLayer.setPosition(sprite.x, sprite.y);
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

            // Render enemies from server
            if (scene && data.enemies) {
                console.log('[COMBAT] Rendering enemies from server:', data.enemies);
                scene.renderServerEnemies(data.enemies);
            }

            // Render loot from server
            if (scene && data.loot) {
                console.log('[LOOT] Rendering loot from server:', data.loot);
                scene.renderServerLoot(data.loot);
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

        case 'damage':
            if (scene) {
                scene.handleDamageEvent(data);
            }
            break;

        case 'enemyDeath':
            if (scene) {
                scene.handleEnemyDeathEvent(data);
            }
            break;

        case 'enemyUpdate':
            if (scene) {
                scene.updateEnemyPositions(data.enemies);
            }
            break;

        case 'enemyAttack':
            if (scene) {
                scene.handleEnemyAttackEvent(data);
            }
            break;

        case 'enemySpawned':
            if (scene) {
                scene.spawnEnemy(data.enemy);
            }
            break;

        case 'lootCollected':
            if (scene) {
                scene.removeLoot(data.lootId);
            }
            break;

        case 'lootDespawn':
            if (scene) {
                scene.removeLoot(data.lootId);
            }
            break;

        case 'lootPickup':
            // Personal notification when you pick up loot
            if (data.gold > 0) {
                addChatMessage(`+${data.gold} gold (Total: ${data.totalGold})`, 'system');

                // Update character gold
                if (gameState.character) {
                    gameState.character.gold = data.totalGold;
                    updateHUD();
                }
            }
            break;

        case 'playerDamaged':
            // Update player health when damaged by enemy
            if (data.playerId === gameState.character.id) {
                gameState.character.health = data.playerHealth;
                updateHUD();

                // Show damage indicator
                addChatMessage(`You took ${data.damage} damage! (${data.playerHealth}/${data.playerMaxHealth} HP)`, 'system');
            }
            break;

        case 'playerDeath':
            if (data.playerId === gameState.character.id) {
                addChatMessage(`You were killed by ${data.killerId}! Respawning in 5 seconds...`, 'system');
            }
            break;

        case 'playerRespawn':
            if (data.playerId === gameState.character.id) {
                // Update character state
                gameState.character.health = data.health;
                gameState.character.x = data.x;
                gameState.character.y = data.y;

                // Update player sprite position
                if (scene && scene.player) {
                    scene.player.setPosition(data.x, data.y);
                }

                updateHUD();
                addChatMessage(`You respawned with full health!`, 'system');
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
    document.getElementById('player-gold').textContent = gameState.character.gold || 0;
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