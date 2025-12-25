/**
 * Enemy Registry
 *
 * ⚠️ TO ADD NEW ENEMIES: Edit this file and add entries below ⚠️
 *
 * This file defines all enemies in the game. Simply add new enemy types to the
 * ENEMY_REGISTRY and they will automatically be loaded with proper stats.
 *
 * NO CODE CHANGES NEEDED - just add entries here!
 */

const ENEMY_REGISTRY = {
    // ===== UNDEAD =====
    skeleton: {
        name: 'Skeleton',
        type: 'undead',
        level: 1,

        // Stats
        maxHealth: 100,
        health: 100,  // Current health (starts at max)

        // Combat stats
        attackDamage: 10,
        defense: 5,
        attackSpeed: 2,  // Attacks per second
        aggroRange: 150,  // Distance to detect and chase players

        // Movement
        movementSpeed: 80,  // Pixels per second (slower than player's 200)
        wanderRadius: 100,  // How far from spawn point to wander

        // Sprites (LPC format)
        sprites: {
            body_walk: 'skeleton_walk',
            body_idle: 'skeleton_idle',
            head: 'skeleton_head'
        },

        // Loot (future)
        loot: {
            experience: 50,
            gold: { min: 5, max: 15 },
            items: [
                // { item: 'bone', chance: 0.3 },
                // { item: 'rusty_sword', chance: 0.05 }
            ]
        },

        // AI behavior
        ai: {
            behavior: 'aggressive',  // aggressive, passive, neutral
            fleeHealthPercent: 0.2,  // Flee when health drops below 20%
            callForHelp: false
        }
    },

    // ===== ADD MORE ENEMIES BELOW =====
    //
    // ENEMY TEMPLATE:
    // zombie: {
    //     name: 'Zombie',
    //     type: 'undead',
    //     level: 2,
    //     maxHealth: 150,
    //     health: 150,
    //     attackDamage: 15,
    //     defense: 8,
    //     attackSpeed: 1.5,
    //     aggroRange: 200,
    //     movementSpeed: 60,
    //     wanderRadius: 80,
    //     sprites: {
    //         body_walk: 'zombie_walk',
    //         body_idle: 'zombie_idle',
    //         head: 'zombie_head'
    //     },
    //     loot: {
    //         experience: 75,
    //         gold: { min: 10, max: 25 },
    //         items: []
    //     },
    //     ai: {
    //         behavior: 'aggressive',
    //         fleeHealthPercent: 0,
    //         callForHelp: true
    //     }
    // },
};

/**
 * Enemy Manager - handles enemy stat management
 */
class EnemyManager {
    constructor() {
        this.registry = ENEMY_REGISTRY;
    }

    /**
     * Get enemy definition by key
     */
    getEnemyData(enemyKey) {
        return this.registry[enemyKey];
    }

    /**
     * Create a new enemy instance from template
     */
    createEnemy(enemyKey, x, y) {
        const template = this.registry[enemyKey];
        if (!template) {
            console.error(`Enemy type not found: ${enemyKey}`);
            return null;
        }

        // Clone the template to create a new instance
        return {
            ...template,
            id: `${enemyKey}_${Date.now()}_${Math.random()}`,
            x: x,
            y: y,
            spawnX: x,  // Remember spawn point for wandering
            spawnY: y,
            health: template.maxHealth,  // Start at full health
            state: 'idle',  // idle, wandering, chasing, attacking, fleeing, dead
            target: null  // Current attack target (player)
        };
    }

    /**
     * Calculate damage to enemy
     */
    takeDamage(enemy, damage) {
        const actualDamage = Math.max(1, damage - enemy.defense);
        enemy.health = Math.max(0, enemy.health - actualDamage);

        console.log(`[COMBAT] ${enemy.name} took ${actualDamage} damage (${enemy.health}/${enemy.maxHealth} HP remaining)`);

        return {
            damage: actualDamage,
            dead: enemy.health <= 0,
            health: enemy.health,
            maxHealth: enemy.maxHealth
        };
    }

    /**
     * Check if enemy should flee
     */
    shouldFlee(enemy) {
        if (!enemy.ai.fleeHealthPercent) return false;
        const healthPercent = enemy.health / enemy.maxHealth;
        return healthPercent <= enemy.ai.fleeHealthPercent;
    }

    /**
     * Get enemies of a specific type
     */
    getEnemiesByType(type) {
        return Object.entries(this.registry)
            .filter(([key, config]) => config.type === type)
            .map(([key]) => key);
    }

    /**
     * Get all enemy keys
     */
    getAllEnemyKeys() {
        return Object.keys(this.registry);
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ENEMY_REGISTRY,
        EnemyManager
    };
}
