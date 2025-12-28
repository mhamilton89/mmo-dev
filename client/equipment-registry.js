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
        spriteLayout: 'lpc_armor' // Armor without attack animations
    },

    // ===== WEAPONS =====
    weapon_waraxe: {
        type: 'weapon',
        slot: 'weapon',
        file: 'assets/equipment/weapon_waraxe.png',
        spriteLayout: 'lpc_standard',
        depth: 200,
        // Offset to position weapon in front of character
        offsetX: 0,
        offsetY: -2,  // Slight upward offset to appear more visible
        // Attack type - determines which character animation to play
        // 'slash': 1-hand weapon animations, 'slash_oversize': 2-hand weapon animations
        // 'thrust': stabbing animations, 'bash': blunt weapon animations
        attackType: 'slash_oversize',  // Waraxe uses 2-hand oversize animations
        // Attack range in pixels (melee weapons typically 64px)
        attackRange: 64,
        // Attack damage (base damage dealt to enemies)
        // Two-handers: 20-30, One-handers: 12-18, Daggers: 8-12
        attackDamage: 25,  // High damage for two-handed weapon
        // Attack speed in FPS (controls animation playback speed)
        // Two-handers: 6-8, One-handers: 10-12, Daggers: 14-16
        attackSpeed: 8,
        // Swing speed (attack cooldown in seconds)
        // Time player must wait between attacks
        // Two-handers: 2-3s, One-handers: 1-1.5s, Daggers: 0.5-1s
        swingSpeed: 2,  // 2 seconds between attacks
        // Waraxe uses OVERSIZE attack animation (192x192 frames)
        // The oversize section is at the bottom of the spritesheet (y >= 3456)
        hasOversizeAttack: true,
        // Oversize attack frames (in the 192x192 / 6-column oversize texture)
        // Full sheet as 192x192: 6 cols x 22 rows. Oversize section starts at row 18 (y=3456)
        // Row 18=up, 19=left, 20=down, 21=right, each with 6 frames
        attackFrames: {
            up: [108, 109, 110, 111, 112, 113],     // row 18 * 6 cols = 108
            left: [114, 115, 116, 117, 118, 119],   // row 19 * 6 cols = 114
            down: [120, 121, 122, 123, 124, 125],   // row 20 * 6 cols = 120
            right: [126, 127, 128, 129, 130, 131]   // row 21 * 6 cols = 126
        },
        // Idle frames per direction (in the 64x64 standard texture)
        idleFrames: { up: 144, down: 162, left: 180, right: 198 }
    },

    // ===== ADD MORE EQUIPMENT BELOW =====
    //
    // WEAPON TEMPLATE (copy and modify for new weapons):
    // weapon_sword: {
    //     type: 'weapon',
    //     slot: 'weapon',
    //     file: 'assets/equipment/weapon_sword.png',
    //     spriteLayout: 'lpc_standard',
    //     depth: 200,
    //     offsetX: 0,
    //     offsetY: 0,
    //     attackType: 'slash',  // 'slash', 'slash_oversize', 'thrust', 'bash'
    //     attackRange: 64,  // Range in pixels (64 for melee, higher for ranged)
    //     attackSpeed: 12,  // FPS: 6-8 (slow), 10-12 (medium), 14-16 (fast)
    //     attackFrames: {
    //         up: [1152, 1153, 1154, 1155, 1156, 1157],    // row 64 * 18 cols = frame 1152
    //         left: [1152, 1153, 1154, 1155, 1156, 1157],
    //         down: [1152, 1153, 1154, 1155, 1156, 1157],
    //         right: [1152, 1153, 1154, 1155, 1156, 1157]
    //     },
    //     idleFrames: { up: 144, down: 162, left: 180, right: 198 }
    // },
    //
    // ARMOR TEMPLATE:
    // torso_armor_leather: {
    //     type: 'armor',
    //     slot: 'armor',
    //     file: 'assets/equipment/torso_armor_leather.png',
    //     spriteLayout: 'lpc_armor'
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

        // Attack/slash animations - row 64 is the only row with valid frames
        attackAnimations: {
            up: { row: 64, frames: 6 },
            left: { row: 64, frames: 6 },
            down: { row: 64, frames: 6 },
            right: { row: 64, frames: 6 }
        },

        defaultDirection: 'down',
        defaultDepth: {
            armor: 101,
            weapon: 200  // Much higher to ensure weapons render above character body/hands
        }
    },

    // LPC armor format (832x3456, 13 columns, no attack animations)
    lpc_armor: {
        frameWidth: 64,
        frameHeight: 64,
        expectedWidth: 832,
        expectedHeight: 3456,
        expectedColumns: 13,

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

        // Attack animations (rows 50-53, same as character sprite)
        attackAnimations: {
            up: { row: 50, frames: 6 },
            left: { row: 51, frames: 6 },
            down: { row: 52, frames: 6 },
            right: { row: 53, frames: 6 }
        },

        defaultDirection: 'down',
        defaultDepth: {
            armor: 101,
            weapon: 200
        }
    },

    // LPC oversize format for attack animations (192x192 frames, 6 columns)
    // Used for slash_oversize, thrust_oversize, etc.
    lpc_oversize: {
        frameWidth: 192,
        frameHeight: 192,
        expectedColumns: 6,
        // Oversize section starts at y=3456 in the full spritesheet
        yOffset: 3456,
        // Attack animations in oversize format (each direction is one row of 6 frames)
        attackAnimations: {
            up: { row: 0, frames: 6 },
            left: { row: 1, frames: 6 },
            down: { row: 2, frames: 6 },
            right: { row: 3, frames: 6 }
        }
    },

    // Add more layouts here if you have different sprite sheet formats
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
            // Load standard 64x64 texture
            this.scene.load.spritesheet(key, config.file, {
                frameWidth: this.getLayout(config).frameWidth,
                frameHeight: this.getLayout(config).frameHeight
            });
            console.log(`  Loading: ${key} from ${config.file}`);

            // If weapon has oversize attack, also load as 192x192 texture
            if (config.hasOversizeAttack) {
                const oversizeLayout = this.layouts.lpc_oversize;
                const oversizeKey = `${key}_oversize`;
                this.scene.load.spritesheet(oversizeKey, config.file, {
                    frameWidth: oversizeLayout.frameWidth,
                    frameHeight: oversizeLayout.frameHeight,
                    // Start from y offset where oversize section begins
                    margin: 0,
                    spacing: 0
                });
                console.log(`  Loading oversize: ${oversizeKey} (192x192 frames)`);
            }
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

                console.log(`[EQUIP] Creating attack anim: ${animKey}, row ${animConfig.row}, cols ${cols}, frames ${start}-${end}`);
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
