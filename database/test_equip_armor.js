// Test script to equip armor_plate_iron to a character
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function equipArmorToCharacter() {
    try {
        console.log('Connecting to database...');

        // Get first Warrior or Wizard character
        const charResult = await pool.query(
            `SELECT id, name, class FROM characters
             WHERE class IN ('Warrior', 'Wizard')
             LIMIT 1`
        );

        if (charResult.rows.length === 0) {
            console.log('No Warrior or Wizard characters found. Please create one first.');
            return;
        }

        const character = charResult.rows[0];
        console.log(`Found character: ${character.name} (${character.class})`);

        // Equip armor_plate_iron to armor slot
        console.log('Equipping armor_plate_iron...');
        const result = await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, 'armor', 'armor_plate_iron', '{}')
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = 'armor_plate_iron', properties = '{}'
             RETURNING *`,
            [character.id]
        );

        console.log(`\n✅ Successfully equipped armor_plate_iron to ${character.name}!`);
        console.log('Equipment record:', result.rows[0]);
        console.log('\nLog in with this character to see the armor rendered in-game.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

equipArmorToCharacter();
