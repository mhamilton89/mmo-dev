const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'mmo_game',
    user: 'postgres',
    password: 'password',
});

async function testEquip() {
    const characterId = 5;
    const itemName = 'arms_armor_plate_iron';
    const slot = 'arms';

    try {
        console.log(`[TEST] Testing equip for character ${characterId}, item ${itemName}, slot ${slot}\n`);

        // Verify item exists in inventory
        const inventoryCheck = await pool.query(
            'SELECT * FROM inventory WHERE character_id = $1 AND item_name = $2',
            [characterId, itemName]
        );

        console.log('Inventory check result:', inventoryCheck.rows);

        if (inventoryCheck.rows.length === 0) {
            console.error('ERROR: Item not found in inventory');
            process.exit(1);
        }

        // Check if slot already has an item
        const currentEquipment = await pool.query(
            'SELECT * FROM equipment WHERE character_id = $1 AND slot = $2',
            [characterId, slot]
        );

        console.log('Current equipment in slot:', currentEquipment.rows);

        if (currentEquipment.rows.length > 0) {
            // Unequip current item first (move to inventory)
            const oldItem = currentEquipment.rows[0];
            console.log('Need to unequip:', oldItem);
            await pool.query(
                'INSERT INTO inventory (character_id, item_name, quantity, item_type) VALUES ($1, $2, 1, $3) ON CONFLICT (character_id, item_name) DO UPDATE SET quantity = inventory.quantity + 1',
                [characterId, oldItem.item_name, 'equipment']
            );
            console.log(`Moved ${oldItem.item_name} back to inventory`);
        }

        // Remove item from inventory (quantity - 1)
        console.log('Removing item from inventory...');
        await pool.query(
            'UPDATE inventory SET quantity = quantity - 1 WHERE character_id = $1 AND item_name = $2',
            [characterId, itemName]
        );

        // Delete from inventory if quantity is now 0
        await pool.query(
            'DELETE FROM inventory WHERE character_id = $1 AND quantity <= 0',
            [characterId]
        );

        // Equip new item (upsert)
        console.log('Equipping item...');
        await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name)
             VALUES ($1, $2, $3)
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = $3`,
            [characterId, slot, itemName]
        );

        console.log(`SUCCESS: Equipped ${itemName} to ${slot}`);

        // Get updated equipment
        const equipmentResult = await pool.query(
            'SELECT * FROM equipment WHERE character_id = $1',
            [characterId]
        );

        console.log('Final equipment:', equipmentResult.rows);

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await pool.end();
    }
}

testEquip();
