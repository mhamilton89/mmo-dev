/**
 * Experience System Module
 *
 * Centralized XP calculation logic for the MMO leveling system.
 * Implements quadratic XP curve with level scaling and group mechanics.
 *
 * Specification: .specify/specs/006-leveling-system/spec.md
 */

const MAX_LEVEL = 50;

/**
 * Calculate XP required for a specific level
 * Formula: 100 × (level - 1)²
 *
 * @param {number} level - Target level (2-50)
 * @returns {number} XP required to reach that level from previous level
 *
 * Examples:
 * - Level 2: 100 XP
 * - Level 3: 300 XP
 * - Level 10: 8,100 XP
 */
function getXPRequiredForLevel(level) {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) return 0;

    return 100 * (level - 1) * (level - 1);
}

/**
 * Calculate cumulative XP needed to reach a level from level 1
 *
 * @param {number} level - Target level
 * @returns {number} Total XP needed from level 1 to reach target level
 *
 * Examples:
 * - Level 1: 0 XP
 * - Level 2: 100 XP
 * - Level 3: 400 XP (100 + 300)
 * - Level 10: 28,900 XP
 */
function getTotalXPForLevel(level) {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) level = MAX_LEVEL;

    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += getXPRequiredForLevel(i);
    }
    return total;
}

/**
 * Calculate level scaling multiplier based on level difference
 * Prevents high-level players from farming low-level content
 *
 * @param {number} playerLevel - Player's current level
 * @param {number} contentLevel - Enemy or resource level
 * @returns {number} Multiplier from 0.0 to 1.0
 *
 * Scaling:
 * - Equal or higher level content: 1.0 (full XP)
 * - 1-2 levels above: 0.8 (80% XP)
 * - 3-4 levels above: 0.5 (50% XP)
 * - 5-6 levels above: 0.25 (25% XP)
 * - 7-8 levels above: 0.1 (10% XP)
 * - 9+ levels above: 0.0 (no XP)
 */
function calculateLevelScaling(playerLevel, contentLevel) {
    const levelDiff = playerLevel - contentLevel;

    // Full XP if player is equal or lower level than content
    if (levelDiff <= 0) return 1.0;

    // Gradual XP reduction based on level difference
    if (levelDiff <= 2) return 0.8;
    if (levelDiff <= 4) return 0.5;
    if (levelDiff <= 6) return 0.25;
    if (levelDiff <= 8) return 0.1;

    // No XP if 9+ levels higher
    return 0;
}

/**
 * Calculate group XP for combat encounters
 * Each participant receives 75% of base XP (not split)
 *
 * @param {number} baseXP - Base XP from enemy
 * @returns {number} XP per participant
 *
 * Rationale: Encourages group play without excessive inflation.
 * Players get most of the XP but slightly less than solo.
 */
function calculateGroupXP(baseXP) {
    return Math.floor(baseXP * 0.75);
}

/**
 * Check if player should level up and calculate new level
 * Supports multiple level-ups from single XP gain
 *
 * @param {number} currentLevel - Player's current level
 * @param {number} currentXP - Player's total accumulated XP
 * @returns {Object} {leveled: boolean, newLevel: number, levelsGained: number}
 */
function checkLevelUp(currentLevel, currentXP) {
    let newLevel = currentLevel;

    // Handle multiple level-ups at once
    while (newLevel < MAX_LEVEL) {
        const totalXPNeeded = getTotalXPForLevel(newLevel + 1);

        if (currentXP >= totalXPNeeded) {
            newLevel++;
        } else {
            break;
        }
    }

    return {
        leveled: newLevel > currentLevel,
        newLevel: newLevel,
        levelsGained: newLevel - currentLevel
    };
}

/**
 * Calculate combat XP with all modifiers applied
 *
 * @param {number} enemyLevel - Enemy's level
 * @param {number} playerLevel - Player's level
 * @returns {number} Final XP after group bonus and level scaling
 */
function calculateCombatXP(enemyLevel, playerLevel) {
    const baseXP = 100 * enemyLevel;
    const groupXP = calculateGroupXP(baseXP);
    const scalingMultiplier = calculateLevelScaling(playerLevel, enemyLevel);

    return Math.floor(groupXP * scalingMultiplier);
}

/**
 * Calculate gathering XP with level scaling
 *
 * @param {number} resourceLevel - Resource's minimum skill level
 * @param {number} playerLevel - Player's level
 * @returns {number} Final XP after level scaling
 */
function calculateGatheringXP(resourceLevel, playerLevel) {
    const baseXP = 20 * resourceLevel;
    const scalingMultiplier = calculateLevelScaling(playerLevel, resourceLevel);

    return Math.floor(baseXP * scalingMultiplier);
}

module.exports = {
    MAX_LEVEL,
    getXPRequiredForLevel,
    getTotalXPForLevel,
    calculateLevelScaling,
    calculateGroupXP,
    checkLevelUp,
    calculateCombatXP,
    calculateGatheringXP
};
