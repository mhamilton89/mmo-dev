# Implementation Plan: Enemy Spawning System

**Feature ID:** 005-enemy-spawning
**Specification:** [spec.md](./spec.md)
**Created:** 2025-12-27
**Status:** Planning

---

## Plan Summary

- **Phases:** 6 implementation phases
- **Estimated Complexity:** High
- **Critical Path:** Spawning → AI → Synchronization → Combat → Respawn → Loot
- **Key Risk:** Tick-based position sync performance with 100+ enemies

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Authority)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────┐      ┌──────────────────┐                  │
│  │ Enemy Registry │──────│ Spawn Manager    │                  │
│  │ (templates)    │      │ - spawn points   │                  │
│  └────────────────┘      │ - respawn timers │                  │
│                          └──────────────────┘                  │
│                                   │                              │
│                                   ▼                              │
│  ┌─────────────────────────────────────────────────────┐       │
│  │          Enemy AI State Machine (100ms tick)         │       │
│  │  idle → wander → aggro → chase → attack → return     │       │
│  └─────────────────────────────────────────────────────┘       │
│                                   │                              │
│                                   ▼                              │
│  ┌──────────────────┐    ┌─────────────────┐                   │
│  │ Combat Handler   │    │ Loot Generator  │                   │
│  │ - damage calc    │    │ - drop tables   │                   │
│  │ - death detect   │    │ - spawn items   │                   │
│  └──────────────────┘    └─────────────────┘                   │
│                                   │                              │
└───────────────────────────────────┼──────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   WebSocket Broadcasts        │
                    │  - enemySpawn                 │
                    │  - enemyUpdate (position/AI)  │
                    │  - enemyDeath                 │
                    │  - lootDrop                   │
                    └───────────────┬───────────────┘
                                    │
┌───────────────────────────────────┼──────────────────────────────┐
│                        CLIENT (Visualization)                     │
├───────────────────────────────────┼──────────────────────────────┤
│                                   ▼                               │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Enemy Sprite Manager                     │           │
│  │  - Create/destroy sprites based on server events │           │
│  │  - Interpolate movement between ticks            │           │
│  └──────────────────────────────────────────────────┘           │
│                                   │                               │
│  ┌──────────────────┐    ┌────────────────────┐                │
│  │ Animation System │    │ Health Bar Renderer│                │
│  │ - walk/idle      │    │ - update on damage │                │
│  │ - hurt/death     │    │ - position sync    │                │
│  └──────────────────┘    └────────────────────┘                │
│                                                                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Loot Item Renderer                       │           │
│  │  - Display ground items                          │           │
│  │  - Collection interaction                        │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Server-Side Spawn System

**Goal:** Create authoritative enemy spawning on server startup

### Implementation Steps

1. **Enhanced Enemy Registry** (server/index.js)
   - Expand ENEMY_REGISTRY with full stats (already partially done)
   - Add AI configuration: aggroRange, attackRange, wanderRadius
   - Add movement stats: moveSpeed, chaseSpeed
   - Add respawn configuration: respawnTime

2. **Spawn Point Manager**
   - Create spawn point data structure
   - Track active enemies per spawn point
   - Implement maxCount enforcement
   - Store spawn point → enemy instance mapping

3. **Enemy Instance Creation**
   - Generate unique IDs (already done: `skeleton_${timestamp}_${index}`)
   - Initialize enemy state machine (default: 'idle')
   - Set spawn position and remember it for return behavior
   - Add to activeEnemies Map (already implemented)

4. **Initial Spawn on Server Start**
   - Call spawnWorldEnemies() on startup (already done)
   - Future: trigger on zone activation

### Data Structures

```javascript
// Enhanced Enemy Registry (server)
const ENEMY_REGISTRY = {
    skeleton: {
        // Stats
        name: 'Skeleton',
        type: 'undead',
        level: 1,
        maxHealth: 100,
        attackDamage: 10,
        defense: 5,

        // Movement
        moveSpeed: 80,        // pixels/second (idle wander)
        chaseSpeed: 120,      // pixels/second (when aggro'd)
        wanderRadius: 100,    // how far from spawn to wander

        // AI
        aggroRange: 150,      // detection radius
        attackRange: 50,      // melee attack range
        attackCooldown: 2000, // milliseconds between attacks
        returnToSpawnRange: 300, // when to give up chase

        // Respawn
        respawnTime: 30000,   // 30 seconds

        // Loot
        loot: {
            experience: 50,
            gold: { min: 5, max: 15 },
            items: [
                { id: 'bone', chance: 0.8, quantity: [1, 3] },
                { id: 'rusty_sword', chance: 0.1, quantity: 1 }
            ]
        }
    }
};

// Spawn Point Definition
const spawnPoints = [
    {
        id: 'spawn_1',
        x: 400,
        y: 300,
        enemyType: 'skeleton',
        maxCount: 3,
        activeEnemies: [],  // Array of enemy IDs currently spawned here
        respawnQueue: []    // Enemies waiting to respawn
    }
];

// Enemy Instance (runtime)
{
    id: 'skeleton_1234567890_0',
    type: 'skeleton',
    name: 'Skeleton',

    // Position
    x: 400,
    y: 300,
    spawnX: 400,
    spawnY: 300,

    // State
    health: 100,
    maxHealth: 100,
    state: 'idle',  // idle, wander, aggro, chase, attack, return, dead

    // AI tracking
    target: null,           // Player ID if aggro'd
    lastAttackTime: 0,      // For attack cooldown
    wanderTarget: null,     // { x, y } for wander destination
    aggroTimeout: null,     // Timer to return to spawn

    // Spawn tracking
    spawnPointId: 'spawn_1'
}
```

---

## Phase 2: Enemy AI State Machine

**Goal:** Implement server-side AI behavior with state transitions

### AI States & Transitions

```
┌──────┐
│ IDLE │ (spawn, respawn, return to spawn)
└───┬──┘
    │ no player nearby → start wander timer
    │ player enters aggroRange → AGGRO
    ▼
┌────────┐
│ WANDER │ (random movement within wanderRadius)
└───┬────┘
    │ reached wander destination → back to IDLE
    │ player enters aggroRange → AGGRO
    ▼
┌───────┐
│ AGGRO │ (detected player)
└───┬───┘
    │ immediately → CHASE
    ▼
┌───────┐
│ CHASE │ (moving toward target player)
└───┬───┘
    │ reached attackRange → ATTACK
    │ player escapes returnToSpawnRange → RETURN
    │ player dies/disconnects → RETURN
    ▼
┌────────┐
│ ATTACK │ (in range, attacking player)
└───┬────┘
    │ player moves out of attackRange → CHASE
    │ player escapes returnToSpawnRange → RETURN
    │ player dies → RETURN
    ▼
┌────────┐
│ RETURN │ (moving back to spawn point)
└───┬────┘
    │ reached spawn point → IDLE
    │ player enters aggroRange during return → AGGRO
    ▼
┌──────┐
│ DEAD │ (health <= 0, waiting for respawn)
└───┬──┘
    │ after respawnTime → respawn as IDLE
    └──────────────────────────────────────┘
```

### Implementation

1. **Server Game Loop** (new file: server/enemyAI.js)
   - Create 100ms tick interval: `setInterval(updateEnemyAI, 100)`
   - Iterate all activeEnemies
   - Execute state machine for each enemy

2. **State Handlers**
   ```javascript
   function updateEnemyAI() {
       const now = Date.now();

       for (const [enemyId, enemy] of activeEnemies.entries()) {
           if (enemy.state === 'dead') continue;

           switch (enemy.state) {
               case 'idle':
                   handleIdleState(enemy, now);
                   break;
               case 'wander':
                   handleWanderState(enemy, now);
                   break;
               case 'aggro':
                   handleAggroState(enemy, now);
                   break;
               case 'chase':
                   handleChaseState(enemy, now);
                   break;
               case 'attack':
                   handleAttackState(enemy, now);
                   break;
               case 'return':
                   handleReturnState(enemy, now);
                   break;
           }
       }
   }
   ```

3. **Movement Calculation**
   - Calculate direction vector to target
   - Apply moveSpeed or chaseSpeed
   - Update enemy.x, enemy.y
   - Respect world boundaries

4. **Aggro Detection**
   - Check distance to all active players
   - If any player within aggroRange, transition to aggro
   - Store player ID as target

5. **Attack Execution**
   - Check attack cooldown
   - Calculate damage based on enemy stats
   - Apply damage to player
   - Broadcast damage event

---

## Phase 3: Position Synchronization

**Goal:** Broadcast enemy positions/states to all clients at 100ms intervals

### WebSocket Events

#### Server → Client: `enemyUpdate`
```javascript
{
    type: 'enemyUpdate',
    enemies: [
        {
            id: 'skeleton_123_0',
            x: 405,
            y: 310,
            state: 'wander',
            health: 100,
            maxHealth: 100,
            direction: 'down'  // for animation
        },
        // ... all active enemies
    ]
}
```

#### Server → Client: `enemySpawn`
```javascript
{
    type: 'enemySpawn',
    enemy: {
        id: 'skeleton_123_1',
        type: 'skeleton',
        name: 'Skeleton',
        x: 600,
        y: 200,
        health: 100,
        maxHealth: 100,
        level: 1,
        state: 'idle'
    }
}
```

#### Server → Client: `enemyDespawn`
```javascript
{
    type: 'enemyDespawn',
    enemyId: 'skeleton_123_0',
    reason: 'zone_unload' | 'respawn'
}
```

### Implementation

1. **Broadcast Tick** (server)
   ```javascript
   setInterval(() => {
       const enemyUpdates = Array.from(activeEnemies.values()).map(e => ({
           id: e.id,
           x: e.x,
           y: e.y,
           state: e.state,
           health: e.health,
           maxHealth: e.maxHealth,
           direction: calculateDirection(e)
       }));

       broadcast({
           type: 'enemyUpdate',
           enemies: enemyUpdates
       });
   }, 100);
   ```

2. **Client-Side Interpolation** (client/game.js)
   - Store last known position and new target position
   - Smoothly interpolate over 100ms using Phaser tweens
   - Handle latency with prediction

3. **Direction Calculation**
   - Based on velocity vector
   - Map to 'up', 'down', 'left', 'right' for animation

---

## Phase 4: Combat Integration

**Goal:** Enable enemy attacks on players

### Attack Logic (Server)

1. **Attack Validation**
   - Enemy in 'attack' state
   - Target player exists and alive
   - Within attackRange
   - Cooldown expired

2. **Damage Calculation**
   ```javascript
   function calculateEnemyDamage(enemy, player) {
       const baseDamage = enemy.attackDamage;
       const defense = player.defense || 0;
       const variance = 0.8 + Math.random() * 0.4; // 80-120%

       const damage = Math.max(1, Math.floor((baseDamage - defense) * variance));
       return damage;
   }
   ```

3. **Apply Damage to Player**
   - Update player health in activePlayers
   - Update database: `UPDATE characters SET health = $1 WHERE id = $2`
   - Check for player death

4. **Broadcast Event**
   ```javascript
   {
       type: 'playerDamaged',
       playerId: 'player_123',
       attackerId: 'skeleton_456',
       damage: 12,
       playerHealth: 88,
       playerMaxHealth: 100
   }
   ```

### Client-Side Handling

1. **Listen for playerDamaged**
   - Update local player health
   - Show damage number above player
   - Flash player sprite red
   - Update HUD health display

2. **Enemy Attack Animation**
   - Play attack animation when enemyUpdate.state === 'attack'
   - Sync animation with damage event timing

---

## Phase 5: Respawn System

**Goal:** Automatically respawn enemies after death

### Server Implementation

1. **Death Detection** (already implemented in combat handler)
   - When enemy.health <= 0
   - Set enemy.state = 'dead'
   - Remove from activeEnemies Map
   - Add to spawn point's respawnQueue

2. **Respawn Timer**
   ```javascript
   function handleEnemyDeath(enemy) {
       enemy.state = 'dead';
       activeEnemies.delete(enemy.id);

       const spawnPoint = spawnPoints.find(sp => sp.id === enemy.spawnPointId);
       spawnPoint.activeEnemies = spawnPoint.activeEnemies.filter(id => id !== enemy.id);

       // Schedule respawn
       setTimeout(() => {
           respawnEnemy(spawnPoint, enemy.type);
       }, ENEMY_REGISTRY[enemy.type].respawnTime);
   }
   ```

3. **Respawn Function**
   ```javascript
   function respawnEnemy(spawnPoint, enemyType) {
       // Check maxCount
       if (spawnPoint.activeEnemies.length >= spawnPoint.maxCount) {
           console.log(`[SPAWN] Spawn point ${spawnPoint.id} at max capacity`);
           return;
       }

       // Create new enemy instance
       const template = ENEMY_REGISTRY[enemyType];
       const enemyId = `${enemyType}_${Date.now()}_${Math.random()}`;
       const enemy = {
           id: enemyId,
           type: enemyType,
           ...template,
           x: spawnPoint.x,
           y: spawnPoint.y,
           spawnX: spawnPoint.x,
           spawnY: spawnPoint.y,
           health: template.maxHealth,
           state: 'idle',
           spawnPointId: spawnPoint.id
       };

       activeEnemies.set(enemyId, enemy);
       spawnPoint.activeEnemies.push(enemyId);

       // Broadcast spawn
       broadcast({
           type: 'enemySpawn',
           enemy: { /* enemy data */ }
       });
   }
   ```

### Client Implementation

1. **Handle enemySpawn Event**
   - Check if enemy sprite already exists (shouldn't)
   - Call renderServerEnemies([enemy]) (already implemented)
   - Create new sprite, health bar, name label

2. **Handle enemyDespawn Event** (for death before respawn)
   - Find enemy sprite by ID
   - Play death animation (hurt + fade - already implemented)
   - Destroy sprite after animation completes

---

## Phase 6: Loot System

**Goal:** Drop visual ground loot on enemy death

### Loot Generation (Server)

1. **Roll Loot Table**
   ```javascript
   function generateLoot(enemy) {
       const lootTable = ENEMY_REGISTRY[enemy.type].loot;
       const droppedItems = [];

       // Roll for each item
       for (const lootEntry of lootTable.items) {
           if (Math.random() <= lootEntry.chance) {
               const quantity = Array.isArray(lootEntry.quantity)
                   ? randomInt(lootEntry.quantity[0], lootEntry.quantity[1])
                   : lootEntry.quantity;

               droppedItems.push({
                   id: lootEntry.id,
                   quantity: quantity
               });
           }
       }

       // Always drop gold
       const gold = randomInt(lootTable.gold.min, lootTable.gold.max);

       return {
           gold: gold,
           items: droppedItems
       };
   }
   ```

2. **Create Ground Loot Instance**
   ```javascript
   const worldLoot = new Map(); // lootId → loot data

   function spawnLoot(x, y, loot, killerId) {
       const lootId = `loot_${Date.now()}_${Math.random()}`;
       const lootItem = {
           id: lootId,
           x: x,
           y: y,
           gold: loot.gold,
           items: loot.items,
           spawnTime: Date.now(),
           killerId: killerId // For future player-specific loot
       };

       worldLoot.set(lootId, lootItem);

       // Broadcast loot spawn
       broadcast({
           type: 'lootDrop',
           loot: lootItem
       });

       // Schedule despawn
       setTimeout(() => {
           if (worldLoot.has(lootId)) {
               worldLoot.delete(lootId);
               broadcast({
                   type: 'lootDespawn',
                   lootId: lootId
               });
           }
       }, 60000); // 60 seconds
   }
   ```

3. **Loot Collection**
   ```javascript
   // WebSocket handler
   case 'collectLoot':
       await handleLootCollection(characterId, data.lootId);
       break;

   async function handleLootCollection(characterId, lootId) {
       const loot = worldLoot.get(lootId);
       if (!loot) return; // Already collected or despawned

       const player = activePlayers.get(characterId);
       if (!player) return;

       // Validate proximity (50px)
       const distance = Math.hypot(player.x - loot.x, player.y - loot.y);
       if (distance > 50) {
           console.log(`[LOOT] Player ${characterId} too far from loot ${lootId}`);
           return;
       }

       // Add to inventory
       for (const item of loot.items) {
           await db.query(
               'INSERT INTO inventory (character_id, item_name, quantity) VALUES ($1, $2, $3) ON CONFLICT (character_id, item_name) DO UPDATE SET quantity = inventory.quantity + $3',
               [characterId, item.id, item.quantity]
           );
       }

       // Add gold
       await db.query(
           'UPDATE characters SET gold = gold + $1 WHERE id = $2',
           [loot.gold, characterId]
       );

       // Remove loot
       worldLoot.delete(lootId);

       // Broadcast collection
       broadcast({
           type: 'lootCollected',
           lootId: lootId,
           collectorId: characterId
       });

       // Notify collector
       player.ws.send(JSON.stringify({
           type: 'lootReceived',
           gold: loot.gold,
           items: loot.items
       }));
   }
   ```

### Client Implementation

1. **Render Ground Loot**
   ```javascript
   // Similar to resource rendering
   function renderLoot(lootData) {
       const lootSprite = this.add.sprite(lootData.x, lootData.y, 'loot_bag');
       lootSprite.setDepth(50); // Below characters
       lootSprite.lootId = lootData.id;

       // Add to loot group
       this.worldLoot.set(lootData.id, lootSprite);

       // Make interactive
       lootSprite.setInteractive();
       lootSprite.on('pointerdown', () => {
           collectLoot(lootData.id);
       });
   }
   ```

2. **Proximity Collection** (auto-pickup when walking over)
   ```javascript
   function updateLootProximity() {
       for (const [lootId, lootSprite] of this.worldLoot.entries()) {
           const distance = Phaser.Math.Distance.Between(
               this.player.x, this.player.y,
               lootSprite.x, lootSprite.y
           );

           if (distance < 30) {
               collectLoot(lootId);
           }
       }
   }

   function collectLoot(lootId) {
       if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
           gameState.ws.send(JSON.stringify({
               type: 'collectLoot',
               lootId: lootId
           }));
       }
   }
   ```

3. **Handle Loot Events**
   ```javascript
   case 'lootDrop':
       if (scene) scene.renderLoot(data.loot);
       break;

   case 'lootCollected':
       if (scene && scene.worldLoot.has(data.lootId)) {
           const lootSprite = scene.worldLoot.get(data.lootId);
           lootSprite.destroy();
           scene.worldLoot.delete(data.lootId);
       }
       break;

   case 'lootReceived':
       addChatMessage(`+${data.gold} gold`, 'system');
       for (const item of data.items) {
           addChatMessage(`+${item.quantity} ${item.id}`, 'system');
       }
       loadInventory(); // Refresh inventory UI
       break;
   ```

---

## WebSocket Event Contracts

### Complete Event Reference

| Event | Direction | Trigger | Payload |
|-------|-----------|---------|---------|
| `enemyUpdate` | S→C | Every 100ms | All enemy positions, states, health |
| `enemySpawn` | S→C | Enemy spawns/respawns | New enemy data |
| `enemyDespawn` | S→C | Zone unload, pre-respawn | Enemy ID, reason |
| `playerDamaged` | S→C | Enemy attacks player | Damage, attacker, new health |
| `lootDrop` | S→C | Enemy dies | Loot position, contents |
| `lootCollected` | S→C | Player collects loot | Loot ID, collector ID |
| `lootDespawn` | S→C | Loot timeout (60s) | Loot ID |
| `collectLoot` | C→S | Player picks up loot | Loot ID |

---

## Performance Considerations

### Server Optimizations

1. **Spatial Partitioning**
   - Divide world into zones/chunks
   - Only update enemies in active chunks (where players are)
   - Currently: single zone, all enemies always active

2. **Broadcast Optimization**
   - Only send enemyUpdate to players in same zone
   - Use delta compression (only send changed values)
   - Future: investigate binary protocol instead of JSON

3. **AI Tick Rate**
   - 100ms tick for AI updates (10 TPS)
   - Consider reducing to 50ms (20 TPS) if movement feels laggy
   - Profile CPU usage with 100+ enemies

### Client Optimizations

1. **Sprite Pooling**
   - Reuse enemy sprites instead of destroy/create on respawn
   - Phaser Group pooling: `this.enemies.maxSize = 200`

2. **Interpolation**
   - Smooth movement between tick updates
   - Use Phaser tweens with 100ms duration
   - Handle late/dropped packets gracefully

3. **Culling**
   - Only render enemies within camera view
   - Phaser handles this automatically with camera culling

---

## Security Considerations

### Server Validation

1. **Loot Collection**
   - ✅ Validate player proximity to loot (50px)
   - ✅ Check loot exists before granting items
   - ✅ First-to-collect wins (prevent double collection)

2. **Combat**
   - ✅ Server calculates all damage (never trust client)
   - ✅ Validate attack cooldowns server-side
   - ✅ Check player is alive before applying enemy damage

3. **Spawn Manipulation**
   - ✅ All spawning server-side (clients can't spawn enemies)
   - ✅ Respawn timers enforced server-side
   - ✅ maxCount limits prevent spawn spam

---

## Testing Strategy

### Unit Tests (Future)
- Loot table rolling algorithm
- AI state transitions
- Distance calculations
- Respawn timer logic

### Integration Testing
1. **Spawn System**
   - Verify 3 skeletons spawn on server start
   - Check all clients see same enemies
   - Validate health bars appear

2. **AI Behavior**
   - Test idle → wander transition
   - Approach enemy, verify aggro detection
   - Run away, verify enemy returns to spawn
   - Stand in attack range, verify damage received

3. **Combat**
   - Kill enemy, verify death animation
   - Wait 30 seconds, verify respawn
   - Check new enemy has different ID
   - Verify loot drops on death

4. **Loot System**
   - Walk over loot, verify auto-collection
   - Check inventory updates
   - Wait 60s without collecting, verify despawn
   - Test multiple players approaching same loot

### Performance Testing
- Spawn 100 enemies
- Monitor server CPU usage
- Check client FPS (target: 60 FPS)
- Test with 10 concurrent players

---

## Migration from Current State

### Already Implemented ✅
- Server-side enemy spawning (Phase 1 - partial)
- Enemy registry with basic stats
- Client receives enemies on join
- Client renders enemy sprites with health bars
- Enemy death handling (combat system integration)

### Needs Implementation ⚠️
- AI state machine (Phase 2)
- 100ms tick-based position sync (Phase 3)
- Enemy attacks on players (Phase 4)
- Respawn timers (Phase 5)
- Loot dropping system (Phase 6)

### Code Structure

```
server/
├── index.js              (main server, WebSocket handlers)
├── enemyAI.js           (NEW: AI state machine, tick loop)
├── lootSystem.js        (NEW: loot generation, collection)
└── classes.js           (existing)

client/
├── game.js              (enemy rendering, loot UI)
└── enemy-registry.js    (client-side enemy data)
```

---

## Constitution Compliance Check

### ✅ Server Authority
- All AI decisions made server-side
- All damage calculations server-side
- All loot generation server-side
- Clients only visualize, never authoritative

### ✅ Real-time Synchronization
- 100ms tick broadcasts ensure all players see same state
- WebSocket events for all state changes
- Loot collection first-to-win prevents conflicts

### ✅ Database Persistence
- Loot goes to inventory (database)
- Gold updates persisted
- Character health updates saved

### ✅ Phaser 3 Best Practices (Client)
- Sprite rendering via Phaser groups
- Animations via Phaser animation system
- Tweens for smooth interpolation

---

## Success Metrics

- [ ] 100+ enemies spawn and update at 60 FPS client-side
- [ ] Server maintains < 50% CPU with 100 enemies and 10 players
- [ ] AI state transitions feel responsive (< 200ms aggro detection)
- [ ] Enemy movement is smooth despite tick-based updates
- [ ] Loot collection has no race conditions (first-to-collect always wins)
- [ ] Respawns occur reliably at configured intervals
- [ ] No enemy duplication or ghost enemies

---

**Plan Author:** Claude Sonnet 4.5
**Created:** 2025-12-27
**Status:** Ready for Task Breakdown
