// Equip waraxe to fjkghdf character
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function equipWaraxeToFjkghdf() {
    try {
        // Find fjkghdf character
        const charResult = await pool.query(
            `SELECT id, name, class FROM characters WHERE name = 'fjkghdf'`
        );

        if (charResult.rows.length === 0) {
            console.log('❌ Character "fjkghdf" not found');
            return;
        }

        const character = charResult.rows[0];
        console.log(`Found character: ${character.name} (${character.class}) - ID: ${character.id}`);

        // Equip weapon_waraxe
        const weaponResult = await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, 'weapon', 'weapon_waraxe', '{}')
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = 'weapon_waraxe', properties = '{}'
             RETURNING *`,
            [character.id]
        );
        console.log('✅ Weapon equipped:', weaponResult.rows[0]);

        console.log('\n✅ Successfully equipped weapon_waraxe to fjkghdf!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

equipWaraxeToFjkghdf();
