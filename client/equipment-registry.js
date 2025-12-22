/**
 * Dynamic Equipment Registry
 *
 * ⚠️ TO ADD NEW EQUIPMENT: Edit this file and add entries below ⚠️
 *
 * This file defines all equipment in the game. Simply add new items to the
 * EQUIPMENT_REGISTRY and they will automatically be loaded, animated, and rendered.
 *
 * NO CODE CHANGES NEEDED - just add entries here!
 *
 * See docs/ADDING_EQUIPMENT.md for detailed instructions.
 */

const EQUIPMENT_REGISTRY = {
    // ===== ARMOR =====
    torso_armor_plate_iron: {
        type: 'armor',
        slot: 'armor',
        file: 'assets/equipment/torso_armor_plate_iron.png',
        spriteLayout: 'lpc_standard' // Uses predefined layout
    },

    // ===== WEAPONS =====
    weapon_waraxe: {
        type: 'weapon',
        slot: 'weapon',
        file: 'assets/equipment/weapon_waraxe.png',
        spriteLayout: 'lpc_standard',
        depth: 200,
        // Offset to position weapon in front of character
        // Adjust these values to position the weapon correctly
        offsetX: 0,
        offsetY: -2  // Slight upward offset to appear more visible
    },

    // Add more equipment here - the system will automatically handle them!
    // Example:
    // weapon_sword: {
    //     type: 'weapon',
    //     slot: 'weapon',
    //     file: 'assets/equipment/weapon_sword.png',
    //     spriteLayout: 'lpc_standard',
    //     depth: 102
    // },
    // torso_armor_leather: {
    //     type: 'armor',
    //     slot: 'armor',
    //     file: 'assets/equipment/torso_armor_leather.png',
    //     spriteLayout: 'lpc_standard'
    // },
};

/**
 * Predefined sprite sheet layouts
 * These define how sprite sheets are structured
 */
const SPRITE_LAYOUTS = {
    // Standard LPC format (1152x4224, 18 columns, rows 8-11 for directional walks)
    lpc_standard: {
        frameWidth: 64,
        frameHeight: 64,
        expectedWidth: 1152,
        expectedHeight: 4224,
        expectedColumns: 18,

        // Animation configuration
        walkAnimations: {
            up: { row: 8, frames: 9 },
            down: { row: 9, frames: 9 },
            left: { row: 10, frames: 9 },
            right: { row: 11, frames: 9 }
        },

        // Idle is the first frame of each walk animation
        idleAnimations: {
            up: { row: 8, frame: 0 },
            down: { row: 9, frame: 0 },
            left: { row: 10, frame: 0 },
            right: { row: 11, frame: 0 }
        },

        // Attack/slash animations (rows 4-7 in LPC format)
        attackAnimations: {
            up: { row: 4, frames: 6 },
            down: { row: 5, frames: 6 },
            left: { row: 6, frames: 6 },
            right: { row: 7, frames: 6 }
        },

        defaultDirection: 'down',
        defaultDepth: {
            armor: 101,
            weapon: 200  // Much higher to ensure weapons render above character body/hands
        }
    },

    // Add more layouts here if you have different sprite sheet formats
    // lpc_extended: { ... },
    // custom_format: { ... },
};

/**
 * Equipment Manager - handles dynamic loading and animation creation
 */
class EquipmentManager {
    constructor(scene) {
        this.scene = scene;
        this.registry = EQUIPMENT_REGISTRY;
        this.layouts = SPRITE_LAYOUTS;
    }

    /**
     * Preload all registered equipment
     */
    preloadAll() {
        console.log('Preloading equipment...');
        Object.entries(this.registry).forEach(([key, config]) => {
            this.scene.load.spritesheet(key, config.file, {
                frameWidth: this.getLayout(config).frameWidth,
                frameHeight: this.getLayout(config).frameHeight
            });
            console.log(`  Loading: ${key} from ${config.file}`);
        });
    }

    /**
     * Create animations for all registered equipment
     */
    createAllAnimations() {
        console.log('Creating equipment animations...');
        Object.entries(this.registry).forEach(([key, config]) => {
            this.createAnimationsForEquipment(key, config);
        });
    }

    /**
     * Create animations for a specific equipment item
     */
    createAnimationsForEquipment(key, config) {
        const texture = this.scene.textures.get(key);
        if (!texture || texture.key === '__MISSING') {
            console.warn(`Texture not found for equipment: ${key}`);
            return;
        }

        const layout = this.getLayout(config);
        const source = texture.source[0];
        const cols = Math.floor(source.width / layout.frameWidth);

        console.log(`  ${key}: ${source.width}x${source.height} (${cols} cols)`);

        // Create walk animations
        Object.entries(layout.walkAnimations).forEach(([direction, animConfig]) => {
            const start = animConfig.row * cols;
            const end = start + animConfig.frames - 1;
            const animKey = `${key}_walk_${direction}`;

            this.scene.createSafeAnimation(animKey, key, start, end, 10);
        });

        // Create idle animations (single-frame)
        Object.entries(layout.idleAnimations).forEach(([direction, animConfig]) => {
            const frame = animConfig.row * cols + animConfig.frame;
            const animKey = `${key}_idle_${direction}`;

            this.scene.createSafeAnimation(animKey, key, frame, frame, 10);
        });

        // Create attack animations (if defined in layout)
        if (layout.attackAnimations) {
            Object.entries(layout.attackAnimations).forEach(([direction, animConfig]) => {
                const start = animConfig.row * cols;
                const end = start + animConfig.frames - 1;
                const animKey = `${key}_attack_${direction}`;

                this.scene.createSafeAnimation(animKey, key, start, end, 15); // Faster framerate for attack
            });
        }
    }

    /**
     * Get the layout configuration for an equipment item
     */
    getLayout(config) {
        return this.layouts[config.spriteLayout];
    }

    /**
     * Get the default idle frame for an equipment item
     */
    getDefaultIdleFrame(equipmentKey) {
        const config = this.registry[equipmentKey];
        if (!config) return 0;

        const layout = this.getLayout(config);
        const texture = this.scene.textures.get(equipmentKey);
        if (!texture || texture.key === '__MISSING') return 0;

        const source = texture.source[0];
        const cols = Math.floor(source.width / layout.frameWidth);
        const defaultDir = layout.defaultDirection;
        const idleConfig = layout.idleAnimations[defaultDir];

        return idleConfig.row * cols + idleConfig.frame;
    }

    /**
     * Get the depth for an equipment item
     */
    getDepth(equipmentKey) {
        const config = this.registry[equipmentKey];
        if (!config) return 100;

        // Use custom depth if specified, otherwise use default for type
        if (config.depth !== undefined) return config.depth;

        const layout = this.getLayout(config);
        return layout.defaultDepth[config.type] || 100;
    }

    /**
     * Get all equipment of a specific type
     */
    getEquipmentByType(type) {
        return Object.entries(this.registry)
            .filter(([key, config]) => config.type === type)
            .map(([key]) => key);
    }

    /**
     * Get all equipment for a specific slot
     */
    getEquipmentBySlot(slot) {
        return Object.entries(this.registry)
            .filter(([key, config]) => config.slot === slot)
            .map(([key]) => key);
    }

    /**
     * Check if an equipment item exists
     */
    exists(equipmentKey) {
        return this.registry.hasOwnProperty(equipmentKey);
    }

    /**
     * Get animation key for equipment
     */
    getAnimationKey(equipmentKey, state, direction) {
        // state: 'walk' or 'idle'
        // direction: 'up', 'down', 'left', 'right'
        return `${equipmentKey}_${state}_${direction}`;
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EQUIPMENT_REGISTRY,
        SPRITE_LAYOUTS,
        EquipmentManager
    };
}
