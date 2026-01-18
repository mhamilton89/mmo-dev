const fs = require('fs');
const path = require('path');

// Read the map file
const mapPath = './client/assets/maps/overlapped_woods.tmj';
const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

// Read all the external tileset files
const mapsDir = './client/assets/maps';
const embeddedTilesets = [];

for (const tileset of mapData.tilesets) {
    if (tileset.source) {
        // External tileset - load it
        const tsxPath = path.join(mapsDir, tileset.source);
        console.log(`Reading external tileset: ${tsxPath}`);

        const tsxContent = fs.readFileSync(tsxPath, 'utf8');

        // Parse XML to extract tileset properties
        const nameMatch = tsxContent.match(/name="([^"]+)"/);
        const tilewidthMatch = tsxContent.match(/tilewidth="(\d+)"/);
        const tileheightMatch = tsxContent.match(/tileheight="(\d+)"/);
        const tilecountMatch = tsxContent.match(/tilecount="(\d+)"/);
        const columnsMatch = tsxContent.match(/columns="(\d+)"/);
        const imageMatch = tsxContent.match(/<image\s+source="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/);

        const imageSource = imageMatch ? imageMatch[1] : '';
        const imageWidth = imageMatch ? parseInt(imageMatch[2]) : 0;
        const imageHeight = imageMatch ? parseInt(imageMatch[3]) : 0;

        // Create embedded tileset object
        const embedded = {
            firstgid: tileset.firstgid,
            name: nameMatch ? nameMatch[1] : 'Unknown',
            tilewidth: tilewidthMatch ? parseInt(tilewidthMatch[1]) : 16,
            tileheight: tileheightMatch ? parseInt(tileheightMatch[1]) : 16,
            tilecount: tilecountMatch ? parseInt(tilecountMatch[1]) : 0,
            columns: columnsMatch ? parseInt(columnsMatch[1]) : 0,
            image: imageSource,
            imagewidth: imageWidth,
            imageheight: imageHeight
        };

        console.log(`  Embedded: ${embedded.name} (${embedded.tilecount} tiles)`);
        embeddedTilesets.push(embedded);
    } else {
        // Already embedded
        embeddedTilesets.push(tileset);
    }
}

// Replace tilesets in map data
mapData.tilesets = embeddedTilesets;

// Write back to file
const backupPath = mapPath + '.backup';
fs.writeFileSync(backupPath, JSON.stringify(JSON.parse(fs.readFileSync(mapPath, 'utf8')), null, 2));
console.log(`\nBackup created: ${backupPath}`);

fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2));
console.log(`Map file updated with embedded tilesets: ${mapPath}`);
console.log('\nYou can now delete the .tsx files if you want.');
