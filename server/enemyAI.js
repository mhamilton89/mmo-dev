/**
 * Enemy AI System
 *
 * Handles server-side enemy AI behavior with a state machine:
 * idle → wander → aggro → chase → attack → return
 *
 * Updates at 100ms intervals (10 ticks per second)
 */

let aiInterval = null;
let activeEnemies = null;
let activePlayers = null;
let ENEMY_REGISTRY = null;
let broadcast = null;

/**
 * Initialize AI system with references to game state
 */
function startEnemyAI(refs) {
    activeEnemies = refs.activeEnemies;
    activePlayers = refs.activePlayers;
    ENEMY_REGISTRY = refs.ENEMY_REGISTRY;
    broadcast = refs.broadcast;

    console.log('[AI] Starting enemy AI system (100ms tick rate)');
    aiInterval = setInterval(updateEnemyAI, 100);
}

/**
 * Stop AI system (cleanup)
 */
function stopEnemyAI() {
    if (aiInterval) {
        clearInterval(aiInterval);
        aiInterval = null;
        console.log('[AI] Enemy AI system stopped');
    }
}

/**
 * Main AI update loop (called every 100ms)
 */
function updateEnemyAI() {
    if (!activeEnemies || !activePlayers) return;

    const now = Date.now();

    for (const [enemyId, enemy] of activeEnemies.entries()) {
        if (enemy.state === 'dead') continue;

        try {
            switch (enemy.state) {
                case 'idle':
                    handleIdleState(enemy, now);
                    break;
                case 'wander':
                    handleWanderState(enemy, now);
                    break;
                case 'aggro':
                    handleAggroState(enemy, now);
                    break;
                case 'chase':
                    handleChaseState(enemy, now);
                    break;
                case 'attack':
                    handleAttackState(enemy, now);
                    break;
                case 'return':
                    handleReturnState(enemy, now);
                    break;
            }
        } catch (error) {
            console.error(`[AI] Error processing ${enemyId} in state ${enemy.state}:`, error);
        }
    }
}

// ========================================
// STATE HANDLERS
// ========================================

/**
 * IDLE STATE: Standing still at spawn, checking for players
 */
function handleIdleState(enemy, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Check for players in aggro range
    const nearestPlayer = findNearestPlayer(enemy, template.aggroRange);
    if (nearestPlayer) {
        console.log(`[AI] ${enemy.id} detected ${nearestPlayer.id}, transitioning to aggro`);
        enemy.state = 'aggro';
        enemy.target = nearestPlayer.id;
        return;
    }

    // After 3 seconds idle, start wandering
    if (!enemy.idleStartTime) {
        enemy.idleStartTime = now;
    } else if (now - enemy.idleStartTime > 3000) {
        // Choose random wander destination within wanderRadius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * template.wanderRadius;
        enemy.wanderTarget = {
            x: enemy.spawnX + Math.cos(angle) * distance,
            y: enemy.spawnY + Math.sin(angle) * distance
        };
        enemy.state = 'wander';
        enemy.idleStartTime = null;
        console.log(`[AI] ${enemy.id} transitioning to wander (target: ${enemy.wanderTarget.x.toFixed(1)}, ${enemy.wanderTarget.y.toFixed(1)})`);
    }
}

/**
 * WANDER STATE: Moving randomly near spawn
 */
function handleWanderState(enemy, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Check for players in aggro range
    const nearestPlayer = findNearestPlayer(enemy, template.aggroRange);
    if (nearestPlayer) {
        console.log(`[AI] ${enemy.id} detected ${nearestPlayer.id} while wandering, transitioning to aggro`);
        enemy.state = 'aggro';
        enemy.target = nearestPlayer.id;
        enemy.wanderTarget = null;
        return;
    }

    // Move toward wander target
    if (enemy.wanderTarget) {
        const distance = getDistance(enemy, enemy.wanderTarget);
        if (distance < 10) {
            // Reached destination, return to idle
            enemy.state = 'idle';
            enemy.wanderTarget = null;
            console.log(`[AI] ${enemy.id} reached wander destination, returning to idle`);
        } else {
            // Keep moving toward wander target
            moveTowards(enemy, enemy.wanderTarget, template.moveSpeed);
        }
    }
}

/**
 * AGGRO STATE: Player detected, immediately chase
 */
function handleAggroState(enemy, now) {
    // Validate target still exists
    const targetPlayer = activePlayers.get(enemy.target);
    if (!targetPlayer) {
        console.log(`[AI] ${enemy.id} target ${enemy.target} no longer exists, returning to spawn`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Immediately transition to chase
    enemy.state = 'chase';
    console.log(`[AI] ${enemy.id} aggro on ${enemy.target}, transitioning to chase`);
}

/**
 * CHASE STATE: Moving toward target player
 */
function handleChaseState(enemy, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Validate target
    const targetPlayer = activePlayers.get(enemy.target);
    if (!targetPlayer) {
        console.log(`[AI] ${enemy.id} lost target ${enemy.target}, returning to spawn`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Check if player escaped (too far from spawn)
    const distanceFromSpawn = getDistance(enemy, { x: enemy.spawnX, y: enemy.spawnY });
    if (distanceFromSpawn > template.returnToSpawnRange) {
        console.log(`[AI] ${enemy.id} too far from spawn (${distanceFromSpawn.toFixed(1)}px), giving up chase`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Check distance to player
    const distanceToPlayer = getDistance(enemy, targetPlayer);

    // Player escaped (beyond deaggro range)?
    if (distanceToPlayer > template.deaggroRange) {
        console.log(`[AI] ${enemy.id} player escaped (${distanceToPlayer.toFixed(1)}px > ${template.deaggroRange}px), de-aggroing`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Reached attack range?
    if (distanceToPlayer <= template.attackRange) {
        enemy.state = 'attack';
        console.log(`[AI] ${enemy.id} in attack range of ${enemy.target}, transitioning to attack`);
        return;
    }

    // Keep chasing
    moveTowards(enemy, targetPlayer, template.chaseSpeed);
}

/**
 * ATTACK STATE: In range, attacking player
 */
function handleAttackState(enemy, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Validate target
    const targetPlayer = activePlayers.get(enemy.target);
    if (!targetPlayer) {
        console.log(`[AI] ${enemy.id} lost target ${enemy.target}, returning to spawn`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Check if player escaped (too far from spawn)
    const distanceFromSpawn = getDistance(enemy, { x: enemy.spawnX, y: enemy.spawnY });
    if (distanceFromSpawn > template.returnToSpawnRange) {
        console.log(`[AI] ${enemy.id} too far from spawn (${distanceFromSpawn.toFixed(1)}px), giving up attack`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Check distance to player
    const distanceToPlayer = getDistance(enemy, targetPlayer);

    // Player escaped (beyond deaggro range)?
    if (distanceToPlayer > template.deaggroRange) {
        console.log(`[AI] ${enemy.id} player escaped during attack (${distanceToPlayer.toFixed(1)}px > ${template.deaggroRange}px), de-aggroing`);
        enemy.state = 'return';
        enemy.target = null;
        return;
    }

    // Player moved out of attack range?
    if (distanceToPlayer > template.attackRange) {
        enemy.state = 'chase';
        console.log(`[AI] ${enemy.id} target moved out of range, transitioning to chase`);
        return;
    }

    // Execute attack if cooldown expired
    if (now - enemy.lastAttackTime >= template.attackCooldown) {
        executeEnemyAttack(enemy, targetPlayer, now);
    }
}

/**
 * RETURN STATE: Moving back to spawn point
 */
function handleReturnState(enemy, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Check for players in aggro range (can re-aggro during return)
    const nearestPlayer = findNearestPlayer(enemy, template.aggroRange);
    if (nearestPlayer) {
        console.log(`[AI] ${enemy.id} re-aggro on ${nearestPlayer.id} during return`);
        enemy.state = 'aggro';
        enemy.target = nearestPlayer.id;
        return;
    }

    // Move toward spawn
    const distanceToSpawn = getDistance(enemy, { x: enemy.spawnX, y: enemy.spawnY });
    if (distanceToSpawn < 10) {
        // Reached spawn, return to idle
        enemy.state = 'idle';
        enemy.x = enemy.spawnX;
        enemy.y = enemy.spawnY;
        console.log(`[AI] ${enemy.id} returned to spawn, transitioning to idle`);
    } else {
        moveTowards(enemy, { x: enemy.spawnX, y: enemy.spawnY }, template.moveSpeed);
    }
}

// ========================================
// MOVEMENT UTILITIES
// ========================================

/**
 * Move enemy toward target position at given speed
 */
function moveTowards(enemy, target, speed) {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
        // Normalize direction and apply speed (0.1 seconds per tick)
        const moveDistance = (speed * 0.1); // pixels per 100ms
        const ratio = Math.min(moveDistance / distance, 1);

        // Store old position for direction calculation
        const oldX = enemy.x;
        const oldY = enemy.y;

        enemy.x += dx * ratio;
        enemy.y += dy * ratio;

        // Clamp to world boundaries (960x640)
        enemy.x = Math.max(0, Math.min(960, enemy.x));
        enemy.y = Math.max(0, Math.min(640, enemy.y));

        // Update direction based on movement
        enemy.lastMoveX = enemy.x - oldX;
        enemy.lastMoveY = enemy.y - oldY;
    }
}

/**
 * Calculate Euclidean distance between two points
 */
function getDistance(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate direction for animation (up, down, left, right)
 */
function calculateDirection(enemy) {
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

// ========================================
// AGGRO DETECTION
// ========================================

/**
 * Find nearest player within aggro range
 */
function findNearestPlayer(enemy, aggroRange) {
    if (!activePlayers || activePlayers.size === 0) {
        return null;
    }

    let nearestPlayer = null;
    let nearestDistance = Infinity;

    for (const [playerId, player] of activePlayers.entries()) {
        // Check if player has position data
        if (typeof player.x === 'undefined' || typeof player.y === 'undefined') {
            console.warn(`[AI] Player ${playerId} missing position data`);
            continue;
        }

        // Skip dead players (0 HP)
        if (player.health <= 0) {
            continue;
        }

        const distance = getDistance(enemy, player);

        if (distance <= aggroRange && distance < nearestDistance) {
            nearestDistance = distance;
            nearestPlayer = player;
        }
    }

    return nearestPlayer;
}

// ========================================
// COMBAT
// ========================================

/**
 * Execute enemy attack on player
 */
function executeEnemyAttack(enemy, targetPlayer, now) {
    const template = ENEMY_REGISTRY[enemy.type];

    // Calculate damage
    const baseDamage = template.attackDamage;
    const defense = targetPlayer.defense || 0;
    const variance = 0.8 + Math.random() * 0.4; // 80-120%
    const damage = Math.max(1, Math.floor((baseDamage - defense) * variance));

    // Apply damage
    targetPlayer.health -= damage;
    targetPlayer.health = Math.max(0, targetPlayer.health);

    enemy.lastAttackTime = now;

    console.log(`[AI] ${enemy.id} attacked ${targetPlayer.id} for ${damage} damage (${targetPlayer.health}/${targetPlayer.max_health} HP)`);

    // Broadcast attack animation
    if (broadcast) {
        const direction = calculateDirection(enemy);
        broadcast({
            type: 'enemyAttack',
            enemyId: enemy.id,
            targetId: targetPlayer.id,
            direction: direction
        });
    }

    // Broadcast damage event
    if (broadcast) {
        broadcast({
            type: 'playerDamaged',
            playerId: targetPlayer.id,
            attackerId: enemy.id,
            damage: damage,
            playerHealth: targetPlayer.health,
            playerMaxHealth: targetPlayer.max_health
        });
    }

    // Check for player death
    if (targetPlayer.health <= 0) {
        handlePlayerDeath(targetPlayer, enemy);
    }
}

/**
 * Handle player death from enemy attack
 */
function handlePlayerDeath(player, killer) {
    console.log(`[AI] Player ${player.id} killed by ${killer.id}`);

    // Broadcast player death
    if (broadcast) {
        broadcast({
            type: 'playerDeath',
            playerId: player.id,
            killerId: killer.id
        });
    }

    // Enemy returns to spawn (no more target)
    killer.state = 'return';
    killer.target = null;

    // Respawn player after 5 seconds
    setTimeout(() => {
        if (!player) return;

        // Restore full health
        player.health = player.max_health;

        // Respawn at spawn point (center of map for now)
        player.x = 480; // Center of 960px world
        player.y = 320; // Center of 640px world

        console.log(`[AI] Player ${player.id} respawned at (${player.x}, ${player.y}) with ${player.health} HP`);

        // Broadcast respawn
        if (broadcast) {
            broadcast({
                type: 'playerRespawn',
                playerId: player.id,
                x: player.x,
                y: player.y,
                health: player.health,
                maxHealth: player.max_health
            });
        }
    }, 5000);
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
    startEnemyAI,
    stopEnemyAI,
    updateEnemyAI
};
