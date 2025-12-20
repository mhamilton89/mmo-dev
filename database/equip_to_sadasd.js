// Equip armor and weapon to sadasd character
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function equipToSadasd() {
    try {
        const characterId = 4; // sadasd character ID

        // Equip armor
        const armorResult = await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, 'armor', 'torso_armor_plate_iron', '{}')
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = 'torso_armor_plate_iron', properties = '{}'
             RETURNING *`,
            [characterId]
        );
        console.log('✅ Armor equipped:', armorResult.rows[0]);

        // Equip weapon
        const weaponResult = await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, 'weapon', 'weapon_waraxe', '{}')
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = 'weapon_waraxe', properties = '{}'
             RETURNING *`,
            [characterId]
        );
        console.log('✅ Weapon equipped:', weaponResult.rows[0]);

        console.log('\n✅ Successfully equipped armor and weapon to sadasd!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

equipToSadasd();
