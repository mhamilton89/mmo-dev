// Update armor_plate_iron to torso_armor_plate_iron in database
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function updateArmorName() {
    try {
        const result = await pool.query(
            `UPDATE equipment
             SET item_name = 'torso_armor_plate_iron'
             WHERE item_name = 'armor_plate_iron'
             RETURNING *`
        );
        console.log(`✅ Updated ${result.rowCount} equipment record(s)`);
        if (result.rows.length > 0) {
            console.log('Updated records:', result.rows);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateArmorName();
