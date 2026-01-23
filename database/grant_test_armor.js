// Grant test armor to first character for testing equipment system
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function grantTestArmor() {
    try {
        console.log('Granting test armor to character "trux"...\n');

        // Find account with email 'abc123@gmail.com'
        const accountResult = await pool.query('SELECT id, email FROM accounts WHERE email = $1', ['abc123@gmail.com']);
        if (accountResult.rows.length === 0) {
            console.error('Account with email "abc123@gmail.com" not found');
            process.exit(1);
        }

        const account = accountResult.rows[0];
        console.log(`Found account: ${account.email} (ID: ${account.id})`);

        // Get character "trux" belonging to this account
        const charResult = await pool.query(
            'SELECT id, name FROM characters WHERE account_id = $1 AND name = $2',
            [account.id, 'trux']
        );
        if (charResult.rows.length === 0) {
            console.error('Character "trux" not found under this account');
            process.exit(1);
        }

        const character = charResult.rows[0];
        console.log(`Target character: ${character.name} (ID: ${character.id})`);

        // List of all iron plate armor pieces and weapon
        const items = [
            'torso_armor_plate_iron',
            'arms_armor_plate_iron',
            'boots_armor_plate_iron',
            'bracers_armor_plate_iron',
            'gloves_armor_plate_iron',
            'head_armor_plate_iron',
            'legs_armor_plate_iron',
            'shoulder_armor_plate_iron',
            'weapon_waraxe'
        ];

        console.log(`\nAdding ${items.length} items to inventory...`);

        for (const item of items) {
            await pool.query(
                `INSERT INTO inventory (character_id, item_name, quantity, item_type)
                 VALUES ($1, $2, 1, 'equipment')
                 ON CONFLICT (character_id, item_name)
                 DO UPDATE SET quantity = inventory.quantity + 1`,
                [character.id, item]
            );
            console.log(`  ✓ Added: ${item}`);
        }

        console.log(`\n✅ Success! ${items.length} items added to ${character.name}'s inventory`);
        console.log('\nYou can now:');
        console.log('  1. Log in as this character');
        console.log('  2. Press "I" to open the character/inventory modal');
        console.log('  3. Right-click items to equip them');

    } catch (error) {
        console.error('❌ Error granting test armor:', error);
    } finally {
        await pool.end();
    }
}

grantTestArmor();
