/**
 * Resource Registry - Pure JavaScript resource type definitions
 * Pattern matches enemy-registry.js and equipment-registry.js
 * No database dependency for resource definitions
 */

const RESOURCE_REGISTRY = {
    oak_tree: {
        id: 'oak_tree',
        name: 'Oak Tree',
        type: 'tree',
        yields: [
            { item: 'Oak Wood', min: 3, max: 7, chance: 1.0 }
        ],
        respawnTime: 60000,      // 60 seconds
        gatherTime: 3000,        // 3 seconds per hit
        hitsRequired: 3,
        minSkillLevel: 1,
        sprite: 'oak_tree',
        interactionRange: 100,    // pixels
        xpReward: 10,             // Base XP reward for gathering
        description: 'A sturdy oak tree suitable for lumber'
    },

    iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore Deposit',
        type: 'ore',
        yields: [
            { item: 'Iron Ore', min: 1, max: 3, chance: 1.0 }
        ],
        respawnTime: 60000,
        gatherTime: 4000,         // 4 seconds per hit
        hitsRequired: 3,
        minSkillLevel: 1,
        sprite: 'iron_ore',
        interactionRange: 100,
        xpReward: 10,             // Base XP reward for gathering
        description: 'A deposit of iron ore ready for mining'
    }
};

class ResourceManager {
    /**
     * Get resource template by type
     * @param {string} resourceType - Type key from RESOURCE_REGISTRY
     * @returns {object|null} Resource template or null if not found
     */
    static getResourceTemplate(resourceType) {
        return RESOURCE_REGISTRY[resourceType] || null;
    }

    /**
     * Create resource instance from template with position data
     * @param {string} resourceType - Type key from RESOURCE_REGISTRY
     * @param {object} position - { id, x, y, tileX, tileY, minSkillLevel }
     * @returns {object|null} Resource instance with runtime state
     */
    static createResourceInstance(resourceType, position) {
        const template = RESOURCE_REGISTRY[resourceType];
        if (!template) {
            console.error(`Unknown resource type: ${resourceType}`);
            return null;
        }

        return {
            // Position data from Tiled map
            id: position.id,
            x: position.x,
            y: position.y,
            tileX: position.tileX,
            tileY: position.tileY,

            // Template data (reference from registry)
            type: template.id,
            name: template.name,
            yields: template.yields,
            respawnTime: template.respawnTime,
            gatherTime: template.gatherTime,
            hitsRequired: template.hitsRequired,
            minSkillLevel: position.minSkillLevel || template.minSkillLevel,
            sprite: template.sprite,
            interactionRange: template.interactionRange,
            xpReward: template.xpReward || 10,  // Base XP reward

            // Runtime state
            available: true,
            respawnTimer: null,
            currentHits: new Map()  // characterId → hitCount
        };
    }

    /**
     * Get all resource types
     * @returns {string[]} Array of resource type keys
     */
    static getAllResourceTypes() {
        return Object.keys(RESOURCE_REGISTRY);
    }

    /**
     * Validate resource type exists in registry
     * @param {string} resourceType - Type key to validate
     * @returns {boolean} True if resource type exists
     */
    static isValidResourceType(resourceType) {
        return RESOURCE_REGISTRY.hasOwnProperty(resourceType);
    }
}

module.exports = {
    RESOURCE_REGISTRY,
    ResourceManager
};
