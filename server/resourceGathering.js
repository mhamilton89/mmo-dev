const { ResourceManager } = require('./resource-registry');
const db = require('../database/db');

// Helper function to check if player is within gathering distance
function canGather(playerX, playerY, resourceX, resourceY, maxDistance) {
    const distance = Math.sqrt(
        Math.pow(playerX - resourceX, 2) +
        Math.pow(playerY - resourceY, 2)
    );
    return distance <= maxDistance;
}

// Track active gathering sessions in memory
// characterId → { characterId, resourceId, hitCount, gatherStartTime, lastUpdateTime }
const activeGatherSessions = new Map();

/**
 * Handle gather start request
 */
async function handleGatherStart(characterId, resourceId, playerX, playerY, resource) {
    // Validate resource exists
    if (!resource) {
        return {
            status: 'error',
            message: 'Resource not found'
        };
    }

    // Validate resource is available
    if (!resource.available) {
        return {
            status: 'error',
            message: 'Resource is depleted'
        };
    }

    // Validate distance (use resource's interaction range)
    if (!canGather(playerX, playerY, resource.x, resource.y, resource.interactionRange || 100)) {
        return {
            status: 'error',
            message: 'Too far from resource'
        };
    }

    // Get or create session
    let session = activeGatherSessions.get(characterId);

    if (!session || session.resourceId !== resourceId) {
        // New session or different resource
        session = {
            characterId,
            resourceId,
            hitCount: 0,
            gatherStartTime: Date.now(),
            lastUpdateTime: Date.now()
        };
        activeGatherSessions.set(characterId, session);
    } else {
        // Continue existing session
        session.gatherStartTime = Date.now();
        session.lastUpdateTime = Date.now();
    }

    return {
        status: 'gathering',
        hitCount: session.hitCount,
        hitsRequired: resource.hitsRequired,
        gatherStartTime: session.gatherStartTime,
        duration: resource.gatherTime
    };
}

/**
 * Handle gather complete request (when player releases E key)
 */
async function handleGatherComplete(characterId, resourceId, resource, worldResources, broadcast) {
    // Validate session exists
    const session = activeGatherSessions.get(characterId);
    if (!session || session.resourceId !== resourceId) {
        return {
            status: 'error',
            message: 'No active gather session'
        };
    }

    // Validate resource
    if (!resource || !resource.available) {
        activeGatherSessions.delete(characterId);
        return {
            status: 'error',
            message: 'Resource not available'
        };
    }

    // Validate hold duration
    const elapsedTime = Date.now() - session.gatherStartTime;
    if (elapsedTime < resource.gatherTime) {
        return {
            status: 'error',
            message: 'Did not hold long enough',
            hitCount: session.hitCount,
            hitsRequired: resource.hitsRequired
        };
    }

    // Increment hit count
    session.hitCount++;

    // Check if resource is fully gathered
    if (session.hitCount >= resource.hitsRequired) {
        // Calculate yields from resource template
        const yields = resource.yields.map(yieldDef => ({
            item: yieldDef.item,
            quantity: Math.floor(Math.random() * (yieldDef.max - yieldDef.min + 1)) + yieldDef.min
        }));

        // Add to inventory
        try {
            for (const yieldItem of yields) {
                await db.query(
                    `INSERT INTO inventory (character_id, item_name, quantity)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (character_id, item_name)
                     DO UPDATE SET quantity = inventory.quantity + $3`,
                    [characterId, yieldItem.item, yieldItem.quantity]
                );
            }
        } catch (error) {
            console.error('Error adding to inventory:', error);
            activeGatherSessions.delete(characterId);
            return {
                status: 'error',
                message: 'Failed to add to inventory'
            };
        }

        // Mark resource as depleted
        resource.available = false;

        // Broadcast resource depleted
        broadcast({
            type: 'resourceDepleted',
            resourceId: resource.id
        });

        // Schedule respawn
        resource.respawnTimer = setTimeout(() => {
            resource.available = true;
            resource.currentHits.clear();

            broadcast({
                type: 'resourceRespawned',
                resourceId: resource.id,
                resourceType: resource.type,
                x: resource.x,
                y: resource.y
            });

            console.log(`Resource ${resource.id} respawned`);
        }, resource.respawnTime);

        // Delete session
        activeGatherSessions.delete(characterId);

        return {
            status: 'complete',
            yields,
            hitCount: session.hitCount,
            hitsRequired: resource.hitsRequired
        };
    } else {
        // Hit registered, but not complete yet
        // Reset gather start time for next hit
        session.gatherStartTime = Date.now();

        return {
            status: 'hit',
            hitCount: session.hitCount,
            hitsRequired: resource.hitsRequired
        };
    }
}

/**
 * Handle gather cancel (player moved or released key early)
 */
function handleGatherCancel(characterId) {
    activeGatherSessions.delete(characterId);
    return {
        status: 'cancelled'
    };
}

/**
 * Cleanup stale sessions (older than 10 seconds)
 */
function cleanupStaleSessions() {
    const now = Date.now();
    const staleThreshold = 10000; // 10 seconds

    for (const [characterId, session] of activeGatherSessions.entries()) {
        if (now - session.lastUpdateTime > staleThreshold) {
            console.log(`Cleaning up stale gather session for character ${characterId}`);
            activeGatherSessions.delete(characterId);
        }
    }
}

// Run cleanup every 30 seconds
setInterval(cleanupStaleSessions, 30000);

module.exports = {
    handleGatherStart,
    handleGatherComplete,
    handleGatherCancel,
    cleanupStaleSessions
};
