// Class definitions with base stats

const CLASSES = {
    Warrior: {
        name: 'Warrior',
        description: 'A strong melee fighter with high health and physical damage. Excels in close combat.',

        // Base stats (pools before attribute bonuses)
        health: 100,
        max_health: 100,
        mana: 50,
        max_mana: 50,

        // Base attributes
        strength: 18,      // → 36 attack_power
        intelligence: 6,   // → 12 magic_power, +60 max_mana
        dexterity: 10,     // Future use
        vitality: 16,      // Future use
        stamina: 15,       // → +150 max_health (total: 250)

        // Growth per level
        growth: {
            health: 12,           // Base health pool growth
            mana: 2,              // Base mana pool growth
            strength: 2.5,        // Drives attack_power
            intelligence: 0.5,    // Drives magic_power + max_mana
            dexterity: 1,         // Future use
            vitality: 2,          // Future use
            stamina: 2            // Drives max_health
        },

        // Starting position
        spawn: { x: 100, y: 100 }
    },

    Wizard: {
        name: 'Wizard',
        description: 'A powerful spellcaster with high magical damage and mana. Master of ranged magic.',

        // Base stats (pools before attribute bonuses)
        health: 80,
        max_health: 80,
        mana: 100,
        max_mana: 100,

        // Base attributes
        strength: 5,       // → 10 attack_power
        intelligence: 20,  // → 40 magic_power, +200 max_mana (total: 300)
        dexterity: 8,      // Future use
        vitality: 8,       // Future use
        stamina: 8,        // → +80 max_health (total: 160)

        // Growth per level
        growth: {
            health: 5,            // Base health pool growth
            mana: 15,             // Base mana pool growth
            strength: 0.4,        // Drives attack_power
            intelligence: 3,      // Drives magic_power + max_mana
            dexterity: 0.8,       // Future use
            vitality: 0.8,        // Future use
            stamina: 0.8          // Drives max_health
        },

        // Starting position
        spawn: { x: 100, y: 150 }
    },

    Paladin: {
        name: 'Paladin',
        description: 'A holy knight with balanced offense and defense. Can heal and protect allies.',

        // Base stats (pools before attribute bonuses)
        health: 90,
        max_health: 90,
        mana: 80,
        max_mana: 80,

        // Base attributes
        strength: 14,      // → 28 attack_power
        intelligence: 12,  // → 24 magic_power, +120 max_mana (total: 200)
        dexterity: 8,      // Future use
        vitality: 14,      // Future use
        stamina: 12,       // → +120 max_health (total: 210)

        // Growth per level
        growth: {
            health: 10,           // Base health pool growth
            mana: 8,              // Base mana pool growth
            strength: 1.8,        // Drives attack_power
            intelligence: 1.8,    // Drives magic_power + max_mana
            dexterity: 0.8,       // Future use
            vitality: 2,          // Future use
            stamina: 1.5          // Drives max_health
        },

        // Starting position
        spawn: { x: 150, y: 100 }
    },

    Rogue: {
        name: 'Rogue',
        description: 'A swift assassin with high critical chance and mobility. Deadly in stealth.',

        // Base stats (pools before attribute bonuses)
        health: 85,
        max_health: 85,
        mana: 70,
        max_mana: 70,

        // Base attributes
        strength: 12,      // → 24 attack_power
        intelligence: 8,   // → 16 magic_power, +80 max_mana (total: 150)
        dexterity: 20,     // Future use (critical chance)
        vitality: 10,      // Future use
        stamina: 10,       // → +100 max_health (total: 185)

        // Growth per level
        growth: {
            health: 7,            // Base health pool growth
            mana: 4,              // Base mana pool growth
            strength: 1.5,        // Drives attack_power
            intelligence: 0.8,    // Drives magic_power + max_mana
            dexterity: 3,         // Future use (critical chance)
            vitality: 1.2,        // Future use
            stamina: 1.2          // Drives max_health
        },

        // Starting position
        spawn: { x: 150, y: 150 }
    }
};

// Calculate derived stats from attributes
function calculateDerivedStats(baseStats) {
    // STR: 1 STR = +2 attack_power
    const attack_power = Math.floor(baseStats.strength * 2);

    // INT: 1 INT = +2 magic_power AND +10 max_mana
    const magic_power = Math.floor(baseStats.intelligence * 2);
    const mana_bonus = Math.floor(baseStats.intelligence * 10);

    // Stamina: 1 stamina = +10 max_health
    const health_bonus = Math.floor(baseStats.stamina * 10);

    return {
        attack_power,
        magic_power,
        max_mana: baseStats.base_max_mana + mana_bonus,
        max_health: baseStats.base_max_health + health_bonus
    };
}

// Calculate stats for a given class and level
function calculateStats(className, level) {
    const classData = CLASSES[className];
    if (!classData) return null;

    const levelDiff = level - 1;

    // Calculate base attributes with growth
    const strength = Math.floor(classData.strength + (classData.growth.strength * levelDiff));
    const intelligence = Math.floor(classData.intelligence + (classData.growth.intelligence * levelDiff));
    const stamina = Math.floor(classData.stamina + (classData.growth.stamina * levelDiff));
    const dexterity = Math.floor(classData.dexterity + (classData.growth.dexterity * levelDiff));
    const vitality = Math.floor(classData.vitality + (classData.growth.vitality * levelDiff));

    // Calculate base health/mana pools (before attribute bonuses)
    const base_max_health = Math.floor(classData.health + (classData.growth.health * levelDiff));
    const base_max_mana = Math.floor(classData.mana + (classData.growth.mana * levelDiff));

    // Apply attribute formulas
    const derived = calculateDerivedStats({
        strength,
        intelligence,
        stamina,
        dexterity,
        vitality,
        base_max_health,
        base_max_mana
    });

    return {
        // Base attributes
        strength,
        intelligence,
        dexterity,
        vitality,
        stamina,

        // Derived stats
        health: derived.max_health,
        max_health: derived.max_health,
        mana: derived.max_mana,
        max_mana: derived.max_mana,
        attack_power: derived.attack_power,
        magic_power: derived.magic_power
    };
}

// Get base stats for character creation
function getClassDefaults(className) {
    const classData = CLASSES[className];
    if (!classData) return null;

    // Use calculateStats to get level 1 stats with proper formulas
    const stats = calculateStats(className, 1);

    return {
        health: stats.health,
        max_health: stats.max_health,
        mana: stats.mana,
        max_mana: stats.max_mana,
        strength: stats.strength,
        intelligence: stats.intelligence,
        dexterity: stats.dexterity,
        vitality: stats.vitality,
        stamina: stats.stamina,
        attack_power: stats.attack_power,
        magic_power: stats.magic_power,
        x: classData.spawn.x,
        y: classData.spawn.y
    };
}

module.exports = {
    CLASSES,
    calculateStats,
    calculateDerivedStats,
    getClassDefaults
};