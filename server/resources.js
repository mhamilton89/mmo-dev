// Resource system for gathering materials

const RESOURCE_TYPES = {
    tree: {
        name: 'Tree',
        yields: [
            { item: 'Wood', min: 3, max: 7 }
        ],
        respawnTime: 60000, // 60 seconds
        gatherTime: 3000, // 3 seconds to gather
        hitsRequired: 3,
        sprite: 'tree'
    },
    oak_tree: {
        name: 'Oak Tree',
        yields: [
            { item: 'Oak Wood', min: 3, max: 7 }
        ],
        respawnTime: 60000, // 60 seconds
        gatherTime: 3000, // 3 seconds to gather
        hitsRequired: 3,
        sprite: 'oak_tree'
    },
    iron_ore: {
        name: 'Iron Ore Deposit',
        yields: [
            { item: 'Iron Ore', min: 1, max: 3 }
        ],
        respawnTime: 60000, // 60 seconds
        gatherTime: 4000, // 4 seconds to gather
        hitsRequired: 3,
        sprite: 'iron_ore'
    },
    copper_ore: {
        name: 'Copper Ore',
        yields: [
            { item: 'Copper Ore', min: 1, max: 3 }
        ],
        respawnTime: 90000, // 90 seconds
        gatherTime: 3500, // 3.5 seconds to gather
        sprite: 'copper_ore'
    },
    test_item: {
        name: 'Test Item',
        yields: [
            { item: 'Red Triangle', min: 1, max: 1 }
        ],
        respawnTime: 10000, // 10 seconds
        gatherTime: 1000, // 1 second to gather
        sprite: 'test_item'
    }
};

// Generate random resources across the world
function generateWorldResources(worldWidth = 4000, worldHeight = 4000) {
    const resources = [];
    const numTrees = 100;
    const numIronOre = 30;
    const numCopperOre = 40;

    // Generate trees
    for (let i = 0; i < numTrees; i++) {
        resources.push({
            id: `tree_${i}`,
            type: 'tree',
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            available: true,
            respawnTimer: null
        });
    }

    // Generate iron ore
    for (let i = 0; i < numIronOre; i++) {
        resources.push({
            id: `iron_${i}`,
            type: 'iron_ore',
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            available: true,
            respawnTimer: null
        });
    }

    // Generate copper ore
    for (let i = 0; i < numCopperOre; i++) {
        resources.push({
            id: `copper_${i}`,
            type: 'copper_ore',
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            available: true,
            respawnTimer: null
        });
    }

    return resources;
}

// Calculate random yield for a resource
function calculateYield(resourceType) {
    const config = RESOURCE_TYPES[resourceType];
    if (!config) return [];

    return config.yields.map(y => ({
        item: y.item,
        quantity: Math.floor(Math.random() * (y.max - y.min + 1)) + y.min
    }));
}

// Check if player is close enough to gather
function canGather(playerX, playerY, resourceX, resourceY, maxDistance = 100) {
    const distance = Math.sqrt(
        Math.pow(playerX - resourceX, 2) +
        Math.pow(playerY - resourceY, 2)
    );
    return distance <= maxDistance;
}

module.exports = {
    RESOURCE_TYPES,
    generateWorldResources,
    calculateYield,
    canGather
};
