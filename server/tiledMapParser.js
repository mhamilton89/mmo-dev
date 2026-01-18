const fs = require('fs');
const path = require('path');
const { ResourceManager } = require('./resource-registry');

/**
 * Parse Tiled map and return resource/spawn arrays (NO DATABASE WRITES)
 */
function loadMapData() {
    console.log('Loading Tiled map data...');

    const mapPath = path.join(__dirname, '../client/assets/maps/overlapped_woods.tmj');
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

    console.log(`Map: ${mapData.width}x${mapData.height} tiles (${mapData.width * mapData.tilewidth}x${mapData.height * mapData.tileheight}px)`);

    // Parse resource object layer (objects mark harvestable positions)
    const resourceLayer = mapData.layers.find(l => l.name === 'Resources' && l.type === 'objectgroup');
    const resources = resourceLayer ? parseResourceObjectLayer(mapData, resourceLayer) : [];

    if (resources.length > 0) {
        console.log(`✓ Parsed ${resources.length} harvestable resources from Resources object layer`);
    } else {
        console.log('⚠ No "Resources" object layer found - add one in Tiled to mark harvestable trees/ore');
    }

    // Parse enemy spawn layer
    const spawnLayer = mapData.layers.find(l => l.name === 'enemy_spawns' && l.type === 'objectgroup');
    const spawns = spawnLayer ? parseEnemySpawnLayer(mapData, spawnLayer) : [];

    if (spawns.length > 0) {
        console.log(`✓ Parsed ${spawns.length} enemy spawn points from enemy_spawns layer`);
    }

    console.log(`\nMap parsing complete!`);
    console.log(`  Resources: ${resources.length}`);
    console.log(`  Enemy spawns: ${spawns.length}`);

    return { resources, spawns };
}

/**
 * Parse Resources object layer
 * Returns array of position data (NOT full instances - those are created by ResourceManager)
 */
function parseResourceObjectLayer(mapData, layer) {
    if (!layer.objects || layer.objects.length === 0) {
        return [];
    }

    const resources = [];

    for (const obj of layer.objects) {
        // Extract custom properties
        const properties = {};
        if (obj.properties) {
            obj.properties.forEach(prop => {
                properties[prop.name] = prop.value;
            });
        }

        const resourceType = properties.resource_type || 'oak_tree';

        // Validate against registry
        if (!ResourceManager.isValidResourceType(resourceType)) {
            console.warn(`Invalid resource_type "${resourceType}" in Tiled object ${obj.id} - skipping`);
            continue;
        }

        const minSkillLevel = properties.min_skill_level || 1;

        // Use object position (objects are already in world coordinates)
        const worldX = obj.x;
        const worldY = obj.y;

        // Calculate tile coordinates for reference
        const tileX = Math.floor(worldX / mapData.tilewidth);
        const tileY = Math.floor(worldY / mapData.tileheight);

        // Position data only (instances created by ResourceManager)
        resources.push({
            id: `${resourceType}_${obj.id}`,
            type: resourceType,
            x: worldX,
            y: worldY,
            tileX: tileX,
            tileY: tileY,
            minSkillLevel: minSkillLevel
        });
    }

    return resources;
}

/**
 * Parse object layer for enemy spawn points
 * Returns array of spawn point data
 */
function parseEnemySpawnLayer(mapData, layer) {
    if (!layer.objects || layer.objects.length === 0) {
        return [];
    }

    const spawns = [];

    for (const obj of layer.objects) {
        // Extract custom properties
        const properties = {};
        if (obj.properties) {
            obj.properties.forEach(prop => {
                properties[prop.name] = prop.value;
            });
        }

        const enemyType = properties.enemy_type || 'goblin';
        const level = properties.level || '1';
        const respawnTime = properties.respawn_time || 30;
        const wanderRadius = properties.wander_radius || 100;

        // Parse level range (e.g., "1-2" → min=1, max=2)
        let levelMin = 1;
        let levelMax = 1;
        if (typeof level === 'string' && level.includes('-')) {
            const parts = level.split('-');
            levelMin = parseInt(parts[0]) || 1;
            levelMax = parseInt(parts[1]) || levelMin;
        } else {
            levelMin = levelMax = parseInt(level) || 1;
        }

        // Convert respawn_time from seconds to milliseconds
        const respawnTimeMs = (typeof respawnTime === 'number' ? respawnTime : parseInt(respawnTime) || 30) * 1000;

        spawns.push({
            id: `spawn_${obj.id}_${enemyType}`,
            enemyType: enemyType,
            x: obj.x,
            y: obj.y,
            levelMin: levelMin,
            levelMax: levelMax,
            respawnTime: respawnTimeMs,
            wanderRadius: wanderRadius,
            maxCount: properties.max_count || 1,
            properties: properties
        });
    }

    return spawns;
}

module.exports = {
    loadMapData
};
