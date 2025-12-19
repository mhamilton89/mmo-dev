// Class definitions with base stats

const CLASSES = {
    Warrior: {
        name: 'Warrior',
        description: 'A strong melee fighter with high health and physical damage. Excels in close combat.',

        // Base stats
        health: 150,
        max_health: 150,
        mana: 50,
        max_mana: 50,

        // Base attributes
        strength: 18,
        intelligence: 6,
        dexterity: 10,
        vitality: 16,

        // Combat stats
        attack_power: 20,
        magic_power: 5,
        defense: 10,

        // Growth per level
        growth: {
            health: 12,
            mana: 2,
            strength: 2.5,
            intelligence: 0.5,
            dexterity: 1,
            vitality: 2,
            attack_power: 2.5,
            magic_power: 0.3,
            defense: 1.5
        },

        // Starting position
        spawn: { x: 100, y: 100 }
    },

    Wizard: {
        name: 'Wizard',
        description: 'A powerful spellcaster with high magical damage and mana. Master of ranged magic.',

        // Base stats
        health: 80,
        max_health: 80,
        mana: 200,
        max_mana: 200,

        // Base attributes
        strength: 5,
        intelligence: 20,
        dexterity: 8,
        vitality: 8,

        // Combat stats
        attack_power: 6,
        magic_power: 25,
        defense: 4,

        // Growth per level
        growth: {
            health: 5,
            mana: 15,
            strength: 0.4,
            intelligence: 3,
            dexterity: 0.8,
            vitality: 0.8,
            attack_power: 0.5,
            magic_power: 3.5,
            defense: 0.6
        },

        // Starting position
        spawn: { x: 100, y: 150 }
    },

    Paladin: {
        name: 'Paladin',
        description: 'A holy knight with balanced offense and defense. Can heal and protect allies.',

        // Base stats
        health: 130,
        max_health: 130,
        mana: 120,
        max_mana: 120,

        // Base attributes
        strength: 14,
        intelligence: 12,
        dexterity: 8,
        vitality: 14,

        // Combat stats
        attack_power: 15,
        magic_power: 15,
        defense: 12,

        // Growth per level
        growth: {
            health: 10,
            mana: 8,
            strength: 1.8,
            intelligence: 1.8,
            dexterity: 0.8,
            vitality: 2,
            attack_power: 1.8,
            magic_power: 2,
            defense: 2
        },

        // Starting position
        spawn: { x: 150, y: 100 }
    },

    Rogue: {
        name: 'Rogue',
        description: 'A swift assassin with high critical chance and mobility. Deadly in stealth.',

        // Base stats
        health: 100,
        max_health: 100,
        mana: 80,
        max_mana: 80,

        // Base attributes
        strength: 12,
        intelligence: 8,
        dexterity: 20,
        vitality: 10,

        // Combat stats
        attack_power: 18,
        magic_power: 8,
        defense: 6,

        // Growth per level
        growth: {
            health: 7,
            mana: 4,
            strength: 1.5,
            intelligence: 0.8,
            dexterity: 3,
            vitality: 1.2,
            attack_power: 2.8,
            magic_power: 0.8,
            defense: 0.8
        },

        // Starting position
        spawn: { x: 150, y: 150 }
    }
};

// Calculate stats for a given class and level
function calculateStats(className, level) {
    const classData = CLASSES[className];
    if (!classData) return null;

    const levelDiff = level - 1;

    return {
        health: Math.floor(classData.health + (classData.growth.health * levelDiff)),
        max_health: Math.floor(classData.max_health + (classData.growth.health * levelDiff)),
        mana: Math.floor(classData.mana + (classData.growth.mana * levelDiff)),
        max_mana: Math.floor(classData.max_mana + (classData.growth.mana * levelDiff)),
        strength: Math.floor(classData.strength + (classData.growth.strength * levelDiff)),
        intelligence: Math.floor(classData.intelligence + (classData.growth.intelligence * levelDiff)),
        dexterity: Math.floor(classData.dexterity + (classData.growth.dexterity * levelDiff)),
        vitality: Math.floor(classData.vitality + (classData.growth.vitality * levelDiff)),
        attack_power: Math.floor(classData.attack_power + (classData.growth.attack_power * levelDiff)),
        magic_power: Math.floor(classData.magic_power + (classData.growth.magic_power * levelDiff)),
        defense: Math.floor(classData.defense + (classData.growth.defense * levelDiff))
    };
}

// Get base stats for character creation
function getClassDefaults(className) {
    const classData = CLASSES[className];
    if (!classData) return null;

    return {
        health: classData.health,
        max_health: classData.max_health,
        mana: classData.mana,
        max_mana: classData.max_mana,
        strength: classData.strength,
        intelligence: classData.intelligence,
        dexterity: classData.dexterity,
        vitality: classData.vitality,
        attack_power: classData.attack_power,
        magic_power: classData.magic_power,
        defense: classData.defense,
        x: classData.spawn.x,
        y: classData.spawn.y
    };
}

module.exports = {
    CLASSES,
    calculateStats,
    getClassDefaults
};