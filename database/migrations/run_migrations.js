const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigrations() {
    console.log('Starting database migrations...\n');

    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Sort to ensure correct execution order (001, 002, 003)

    if (migrationFiles.length === 0) {
        console.log('No migration files found.');
        return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        try {
            console.log(`Running migration: ${file}`);
            await db.query(sql);
            console.log(`✓ ${file} completed successfully\n`);
            successCount++;
        } catch (error) {
            console.error(`✗ ${file} failed:`);
            console.error(error.message);
            console.error('');
            errorCount++;
        }
    }

    console.log('Migration summary:');
    console.log(`  Successful: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    console.log(`  Total: ${migrationFiles.length}`);

    if (errorCount === 0) {
        console.log('\n✓ All migrations completed successfully!');
    } else {
        console.log('\n⚠ Some migrations failed. Please check the errors above.');
    }

    process.exit(errorCount > 0 ? 1 : 0);
}

runMigrations().catch(error => {
    console.error('Fatal error running migrations:', error);
    process.exit(1);
});
