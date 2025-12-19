// Run database migration to update class constraint
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function runMigration() {
    try {
        console.log('Connecting to database...');

        // First, update existing Mage characters to Wizard (BEFORE adding constraint)
        console.log('Updating existing Mage characters to Wizard...');
        const result = await pool.query("UPDATE characters SET class = 'Wizard' WHERE class = 'Mage'");
        console.log(`Updated ${result.rowCount} Mage character(s) to Wizard`);

        // Drop old constraint
        console.log('Dropping old constraint...');
        await pool.query('ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_class_check');

        // Add new constraint with Wizard
        console.log('Adding new constraint with Wizard...');
        await pool.query("ALTER TABLE characters ADD CONSTRAINT characters_class_check CHECK (class IN ('Warrior', 'Wizard', 'Paladin', 'Rogue'))");

        // Verify the constraint
        console.log('Verifying new constraint...');
        const verify = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'characters'::regclass AND conname = 'characters_class_check'
        `);
        console.log('New constraint:', verify.rows[0]);

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
