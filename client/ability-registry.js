/**
 * Combat Ability Registry
 *
 * Defines all combat abilities in the game with client and server configurations.
 * Abilities are class-specific and define damage, animations, effects, and resource costs.
 *
 * To add new abilities: Simply add entries to ABILITY_REGISTRY below.
 */

const ABILITY_REGISTRY = {
    // ===== WARRIOR ABILITIES =====

    warrior_strike: {
        id: 'warrior_strike',
        name: 'Strike',
        description: 'Basic melee attack that builds power',
        class: 'Warrior',
        type: 'builder',
        slot: 'primary', // Left-click

        client: {
            // Animation
            useWeaponAnimation: true,
            animationType: 'slash_oversize',

            // Hit detection
            hitDetection: {
                type: 'rectangle',
                range: 80,
                width: 60
            },

            // Visual effects
            effects: [],

            // Cooldown (ms) - shown to player
            cooldown: 2000 // From weapon swingSpeed
        },

        server: {
            // Validation
            cooldown: 1000, // Server-enforced minimum
            range: 64,

            // Damage
            damageFormula: (stats, weaponConfig) => {
                const weaponDmg = weaponConfig?.attackDamage || 0;
                return weaponDmg + stats.attack_power;
            },
            variance: 0.2, // ±20%

            // On-hit effects
            onHit: {
                buildPowerStack: true
            }
        }
    },

    warrior_flurry: {
        id: 'warrior_flurry',
        name: 'Flurry',
        description: 'Unleash a rapid series of strikes. Each strike grows in power.',
        class: 'Warrior',
        type: 'spender',
        slot: 'secondary', // Right-click

        resourceCost: {
            type: 'powerStack',
            min: 1,
            consumeAll: true
        },

        client: {
            // Multi-hit animation
            multiHit: true,
            animationType: 'slash_oversize',
            animationSpeedScaling: [1.0, 1.5, 2.0], // FPS multiplier per stack

            // Hit detection (scales with stacks)
            hitDetection: {
                type: 'rectangle',
                baseRange: 80,
                rangePerStack: 10,
                baseWidth: 60,
                widthPerStack: 10
            },

            // Visual effects
            effects: [
                {
                    type: 'arc',
                    color: 0xff4500, // Orange-red
                    sizeScale: 1.0 // Scales with stacks
                }
            ],

            cooldown: 2000 // Same as Strike
        },

        server: {
            cooldown: 1000,
            range: 64,
            rangePerStack: 10,

            // Progressive damage per swing
            damageProgression: [1.2, 1.4, 1.6], // 120%, 140%, 160%

            // Base damage formula (same as Strike)
            damageFormula: (stats, weaponConfig) => {
                const weaponDmg = weaponConfig?.attackDamage || 0;
                return weaponDmg + stats.attack_power;
            },
            variance: 0.2,

            // Multi-hit processing
            processAsMultipleHits: true
        }
    },

    // ===== WIZARD ABILITIES =====

    wizard_fireball: {
        id: 'wizard_fireball',
        name: 'Fireball',
        description: 'Hurl a blazing fireball at your target. Builds power.',
        class: 'Wizard',
        type: 'builder',
        slot: 'primary', // Left-click

        resourceCost: {
            type: 'mana',
            amount: 25
        },

        client: {
            // Animation
            animationType: 'spellcast',
            animationFPS: 12,

            // Projectile
            projectile: {
                type: 'css',
                className: 'fireball-projectile',
                speed: 300,        // pixels/second
                maxRange: 400,     // pixels
                size: 20,          // pixels diameter
                piercing: false    // Stop on first hit
            },

            // Visual effects
            effects: [],

            // Cooldown (ms)
            cooldown: 1000
        },

        server: {
            // Validation
            cooldown: 1000,
            range: 400,          // Projectile max range

            // Damage
            damageFormula: (stats) => {
                const baseDamage = 15;
                return baseDamage + Math.floor(stats.magic_power * 0.75);
            },
            variance: 0.2, // ±20%

            // Resource costs
            manaCost: 25,

            // On-hit effects
            onHit: {
                buildPowerStack: true
            }
        }
    }

    // ===== ADD MORE ABILITIES HERE =====
    //
    // Future abilities for other classes (Paladin, Rogue)
    // can be added here following the same structure.
};

// Export for use in client and server
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ABILITY_REGISTRY };
}
