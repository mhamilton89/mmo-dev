// Global game state
const gameState = {
    ws: null,
    character: null,
    selectedClass: null,
    classes: {},
    phaserGame: null,
    currentScene: null
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
            card.innerHTML = `<h3>${className}</h3>`;

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
    }

    preload() {
        // Create simple colored sprites for players
        this.createPlayerGraphics();
    }

    createPlayerGraphics() {
        // Create graphics for each class
        const classColors = {
            'Warrior': 0xef4444,
            'Mage': 0x3b82f6,
            'Paladin': 0xfbbf24,
            'Rogue': 0x8b5cf6
        };

        Object.keys(classColors).forEach(className => {
            const graphics = this.add.graphics();
            graphics.fillStyle(classColors[className], 1);
            graphics.fillCircle(16, 16, 16);
            graphics.generateTexture(`player_${className}`, 32, 32);
            graphics.destroy();
        });

        // Create graphics for current player (green)
        const localGraphics = this.add.graphics();
        localGraphics.fillStyle(0x22c55e, 1);
        localGraphics.fillCircle(16, 16, 16);
        localGraphics.generateTexture('player_local', 32, 32);
        localGraphics.destroy();
    }

    create() {
        // Set world bounds (large world)
        this.physics.world.setBounds(0, 0, 4000, 4000);

        // Create background grid
        this.createGrid();

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        // Store scene reference globally
        gameState.currentScene = this;

        // Setup camera
        this.cameras.main.setBounds(0, 0, 4000, 4000);
    }

    createGrid() {
        const gridSize = 50;
        const worldWidth = 4000;
        const worldHeight = 4000;

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.1);

        for (let x = 0; x <= worldWidth; x += gridSize) {
            graphics.lineBetween(x, 0, x, worldHeight);
        }

        for (let y = 0; y <= worldHeight; y += gridSize) {
            graphics.lineBetween(0, y, worldWidth, y);
        }
    }

    createPlayer(character) {
        // Create player sprite
        const sprite = this.physics.add.sprite(character.x, character.y, 'player_local');
        sprite.setCollideWorldBounds(true);

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
        const sprite = this.physics.add.sprite(playerData.x, playerData.y, `player_${playerData.class}`);
        sprite.setCollideWorldBounds(true);

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
}

function startGame(characterId) {
    hideAllScreens();
    document.getElementById('game-container').style.display = 'flex';

    setupChatInput();

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

    gameState.ws.onopen = () => {
        console.log('Connected to server');
        gameState.ws.send(JSON.stringify({
            type: 'join',
            characterId: characterId
        }));
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

    switch (data.type) {
        case 'init':
            gameState.character = data.character;

            // Create player in scene
            if (scene) {
                scene.createPlayer(data.character);
            }

            // Create other players
            data.players.forEach(p => {
                if (p.id !== gameState.character.id && scene) {
                    scene.createOtherPlayer(p);
                }
            });

            updateHUD();
            addChatMessage(`Welcome, ${gameState.character.name}!`, 'system');
            document.getElementById('online-players').textContent = data.players.length;
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

// ===== UTILITY =====
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
}