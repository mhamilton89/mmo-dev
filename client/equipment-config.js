/**
 * Equipment Sprite Sheet Configuration
 *
 * This file defines the sprite sheet specifications for all equipment types.
 * When adding new equipment, add its configuration here and follow the same
 * pattern in game.js for loading and creating animations.
 */

const EQUIPMENT_CONFIG = {
    // Armor configurations
    armor: {
        torso_armor_plate_iron: {
            // File info
            file: 'assets/equipment/torso_armor_plate_iron.png',
            dimensions: { width: 1152, height: 4224 },

            // Sprite sheet layout
            frameWidth: 64,
            frameHeight: 64,
            columns: 18, // 1152 / 64 = 18

            // Animation rows (LPC format)
            // Rows 8-11 are used for directional walk animations
            animationRows: {
                walkUp: 8,      // Row 8: walking up
                walkDown: 9,    // Row 9: walking down
                walkLeft: 10,   // Row 10: walking left
                walkRight: 11   // Row 11: walking right
            },

            // Frame counts
            walkFrameCount: 9,  // 9 frames per walk animation

            // Default idle frame (used when character spawns)
            defaultIdleRow: 9,  // Down direction

            // Notes
            notes: 'LPC format armor sprite sheet. Uses rows 8-11 for directional walk animations.'
        }
    },

    // Weapon configurations
    weapons: {
        weapon_waraxe: {
            // File info
            file: 'assets/equipment/weapon_waraxe.png',
            dimensions: { width: 1152, height: 4224 },

            // Sprite sheet layout
            frameWidth: 64,
            frameHeight: 64,
            columns: 18, // 1152 / 64 = 18

            // Animation rows (LPC format)
            // IMPORTANT: Weapons use the SAME row layout as armor (rows 8-11)
            animationRows: {
                walkUp: 8,      // Row 8: walking up
                walkDown: 9,    // Row 9: walking down
                walkLeft: 10,   // Row 10: walking left
                walkRight: 11   // Row 11: walking right
            },

            // Frame counts
            walkFrameCount: 9,  // 9 frames per walk animation

            // Default idle frame (used when character spawns)
            defaultIdleRow: 9,  // Down direction

            // Depth layering
            depth: 102,  // Weapons render above armor (armor is 101)

            // Notes
            notes: 'LPC format weapon sprite sheet. Must use rows 8-11 to match character/armor animations. Weapon sprite sheets that use rows 0-3 need to be converted to use rows 8-11.'
        }
    }
};

/**
 * Helper function to calculate frame index from row and column
 * @param {number} row - The row number in the sprite sheet
 * @param {number} columns - Total number of columns in the sprite sheet
 * @param {number} frameOffset - Optional offset within the row (default 0 = first frame)
 * @returns {number} The frame index
 */
function getFrameIndex(row, columns, frameOffset = 0) {
    return row * columns + frameOffset;
}

/**
 * Helper function to get walk animation frame range
 * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
 * @param {object} equipmentConfig - Equipment configuration object
 * @returns {object} Object with start and end frame indices
 */
function getWalkAnimationRange(direction, equipmentConfig) {
    const directionRowMap = {
        up: equipmentConfig.animationRows.walkUp,
        down: equipmentConfig.animationRows.walkDown,
        left: equipmentConfig.animationRows.walkLeft,
        right: equipmentConfig.animationRows.walkRight
    };

    const row = directionRowMap[direction];
    const start = row * equipmentConfig.columns;
    const end = start + equipmentConfig.walkFrameCount - 1;

    return { start, end };
}

/**
 * Helper function to get idle frame index
 * @param {string} direction - Direction: 'up', 'down', 'left', 'right'
 * @param {object} equipmentConfig - Equipment configuration object
 * @returns {number} The idle frame index (first frame of the walk animation)
 */
function getIdleFrame(direction, equipmentConfig) {
    const directionRowMap = {
        up: equipmentConfig.animationRows.walkUp,
        down: equipmentConfig.animationRows.walkDown,
        left: equipmentConfig.animationRows.walkLeft,
        right: equipmentConfig.animationRows.walkRight
    };

    const row = directionRowMap[direction];
    return row * equipmentConfig.columns;
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EQUIPMENT_CONFIG,
        getFrameIndex,
        getWalkAnimationRange,
        getIdleFrame
    };
}
