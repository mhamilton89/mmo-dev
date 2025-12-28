# Implementation Tasks: Enemy Spawning System

**Feature ID:** 005-enemy-spawning
**Specification:** [spec.md](./spec.md)
**Plan:** [plan.md](./plan.md)
**Created:** 2025-12-27
**Last Updated:** 2025-12-27

---

## Task Summary

- **Total Tasks:** 68
- **Phases:** 6
- **Parallel Execution Opportunities:** 12 tasks marked with [P]
- **Estimated Complexity:** High

---

## Task Format

Each task follows this structure:
```
- [ ] [T###] [P?] [Scenario?] Description with file path
```

- **Checkbox:** `- [ ]` (mark `[X]` when complete)
- **Task ID:** Sequential (T001, T002, T003...)
- **[P] marker:** Indicates task can run in parallel with others
- **[S#] label:** Maps to scenario (e.g., [S1], [S2], [S3])
- **Description:** Clear action with exact file path

---

## Phase 1: Enhanced Server-Side Spawn System

**Goal:** Improve existing spawn system with spawn point management and enhanced enemy registry

### Enemy Registry Enhancement
- [ ] [T001] [S1] Expand ENEMY_REGISTRY with AI configuration fields
  - File: `server/index.js`
  - Add: `aggroRange: 150`, `attackRange: 50`, `wanderRadius: 100`
  - Add: `moveSpeed: 80`, `chaseSpeed: 120`
  - Add: `attackCooldown: 2000`, `returnToSpawnRange: 300`

- [ ] [T002] [S1] Add respawn configuration to ENEMY_REGISTRY
  - File: `server/index.js`
  - Add: `respawnTime: 30000` (30 seconds)
  - Document respawn timing in comments

- [ ] [T003] [P] [S1] Enhance loot table structure in ENEMY_REGISTRY
  - File: `server/index.js`
  - Update loot format: `{ id: 'bone', chance: 0.8, quantity: [1, 3] }`
  - Add item IDs that match inventory system

### Spawn Point Management
- [ ] [T004] [S1] Create spawn point data structure
  - File: `server/index.js`
  - Create `spawnPoints` array with id, position, enemyType, maxCount
  - Initialize with 3 spawn points matching current positions

- [ ] [T005] [S1] Add spawn point tracking fields
  - File: `server/index.js`
  - Add `activeEnemies: []` array to each spawn point
  - Add `respawnQueue: []` for enemies waiting to respawn

- [ ] [T006] [S1] Update spawnWorldEnemies() to use spawn points
  - File: `server/index.js`
  - Iterate spawnPoints array instead of hardcoded positions
  - Link each enemy to its spawn point: `spawnPointId: spawnPoint.id`

### Enemy Instance Enhancement
- [ ] [T007] [S1] Add AI state fields to enemy instances
  - File: `server/index.js` (in spawnWorldEnemies function)
  - Add: `state: 'idle'`, `target: null`, `lastAttackTime: 0`
  - Add: `wanderTarget: null`, `aggroTimeout: null`

- [ ] [T008] [S1] Track spawn point in enemy instances
  - File: `server/index.js`
  - Add: `spawnPointId` field when creating enemies
  - Update spawn point's `activeEnemies` array

### Validation
- [ ] [T009] [S1] Test enhanced spawn system
  - Manual test: Restart server, verify 3 skeletons spawn
  - Check: Each enemy has new AI fields in activeEnemies Map
  - Verify: Console logs show spawn point assignments

---

## Phase 2: Enemy AI State Machine

**Goal:** Implement server-side AI with 6 states and behavior logic

### AI Infrastructure
- [ ] [T010] [S2] Create server/enemyAI.js module
  - File: `server/enemyAI.js` (NEW)
  - Export: `startEnemyAI()`, `stopEnemyAI()`, `updateEnemyAI()`
  - Import activeEnemies, activePlayers, ENEMY_REGISTRY from index.js

- [ ] [T011] [S2] Implement AI tick loop (100ms interval)
  - File: `server/enemyAI.js`
  - Create: `setInterval(updateEnemyAI, 100)`
  - Store interval ID for cleanup: `let aiInterval = null`

- [ ] [T012] [S2] Add AI module to server startup
  - File: `server/index.js`
  - Import: `const { startEnemyAI } = require('./enemyAI')`
  - Call: `startEnemyAI()` after spawnWorldEnemies()

### State Handlers
- [ ] [T013] [S2] Implement updateEnemyAI() main loop
  - File: `server/enemyAI.js`
  - Iterate all activeEnemies
  - Call state-specific handler based on enemy.state
  - Skip enemies with state === 'dead'

- [ ] [T014] [S2] Implement handleIdleState()
  - File: `server/enemyAI.js`
  - Check for players in aggroRange → transition to 'aggro'
  - After 3 seconds idle, transition to 'wander'
  - Set random wander destination within wanderRadius

- [ ] [T015] [S2] Implement handleWanderState()
  - File: `server/enemyAI.js`
  - Move toward wanderTarget at moveSpeed
  - Check for players in aggroRange → transition to 'aggro'
  - Reached destination → transition to 'idle'

- [ ] [T016] [S2] Implement handleAggroState()
  - File: `server/enemyAI.js`
  - Store closest player as target
  - Immediately transition to 'chase'
  - Validate target exists and is alive

- [ ] [T017] [S2] Implement handleChaseState()
  - File: `server/enemyAI.js`
  - Move toward target player at chaseSpeed
  - Reached attackRange → transition to 'attack'
  - Player beyond returnToSpawnRange → transition to 'return'
  - Player dead/disconnected → transition to 'return'

- [ ] [T018] [S2] Implement handleAttackState()
  - File: `server/enemyAI.js`
  - Check attack cooldown (attackCooldown ms)
  - Execute attack if cooldown expired
  - Player moves out of attackRange → transition to 'chase'
  - Player beyond returnToSpawnRange → transition to 'return'

- [ ] [T019] [S2] Implement handleReturnState()
  - File: `server/enemyAI.js`
  - Move toward spawnX, spawnY at moveSpeed
  - Check for players in aggroRange → transition to 'aggro'
  - Reached spawn point (< 10px) → transition to 'idle'

### Movement Utilities
- [ ] [T020] [P] [S2] Create movement helper: calculateDirection()
  - File: `server/enemyAI.js`
  - Calculate angle to target, return 'up'|'down'|'left'|'right'
  - Used for animation sync

- [ ] [T021] [P] [S2] Create movement helper: moveTowards()
  - File: `server/enemyAI.js`
  - Move enemy toward target position at given speed
  - Apply delta time (0.1 seconds per tick)
  - Respect world boundaries (0-960, 0-640)

- [ ] [T022] [P] [S2] Create distance helper: getDistance()
  - File: `server/enemyAI.js`
  - Return Euclidean distance between two points
  - Used for range checks

### Aggro Detection
- [ ] [T023] [S2] Implement findNearestPlayer()
  - File: `server/enemyAI.js`
  - Check all activePlayers for distance to enemy
  - Return closest player within aggroRange
  - Return null if no players in range

### Validation
- [ ] [T024] [S2] Test idle → wander transition
  - Manual test: Spawn enemy, wait 3 seconds
  - Verify: Enemy starts moving randomly
  - Check: Console logs show state transition

- [ ] [T025] [S2] Test wander → aggro transition
  - Manual test: Approach wandering enemy
  - Verify: Enemy detects player at 150px range
  - Check: Enemy transitions to chase

---

## Phase 3: Position Synchronization

**Goal:** Broadcast enemy positions/states every 100ms to all clients

### Server-Side Broadcasting
- [ ] [T026] [S2] Create enemyUpdate broadcast interval
  - File: `server/index.js`
  - Add: `setInterval(() => broadcastEnemyUpdates(), 100)`
  - Start after server initialization

- [ ] [T027] [S2] Implement broadcastEnemyUpdates()
  - File: `server/index.js`
  - Map activeEnemies to update format
  - Include: id, x, y, state, health, maxHealth, direction
  - Broadcast: `{ type: 'enemyUpdate', enemies: [...] }`

- [ ] [T028] [S2] Calculate enemy direction for animation
  - File: `server/index.js`
  - Use velocity or last movement to determine direction
  - Add `direction` field to enemyUpdate payload

### WebSocket Event Definitions
- [ ] [T029] [P] [S1] Define enemySpawn event
  - File: `server/index.js`
  - Format: `{ type: 'enemySpawn', enemy: { id, type, name, x, y, health, maxHealth, level, state } }`
  - Emit when enemy spawns/respawns

- [ ] [T030] [P] [S2] Define enemyDespawn event
  - File: `server/index.js`
  - Format: `{ type: 'enemyDespawn', enemyId, reason }`
  - Emit before respawn or zone unload

### Client-Side Event Handlers
- [ ] [T031] [S2] Add enemyUpdate listener
  - File: `client/game.js`
  - Case: `'enemyUpdate'` in handleServerMessage
  - Call: `scene.updateEnemyPositions(data.enemies)`

- [ ] [T032] [S2] Implement updateEnemyPositions()
  - File: `client/game.js`
  - Find each enemy sprite by enemyId
  - Update sprite position with interpolation
  - Update health bar position
  - Update name label position

- [ ] [T033] [S2] Add enemySpawn listener
  - File: `client/game.js`
  - Case: `'enemySpawn'` in handleServerMessage
  - Call: `scene.renderServerEnemies([data.enemy])`

- [ ] [T034] [S2] Add enemyDespawn listener
  - File: `client/game.js`
  - Case: `'enemyDespawn'` in handleServerMessage
  - Call: `scene.despawnEnemy(data.enemyId)`

### Client-Side Interpolation
- [ ] [T035] [S2] Implement position interpolation with tweens
  - File: `client/game.js` (in updateEnemyPositions)
  - Use: `this.tweens.add()` for smooth movement
  - Duration: 100ms (match server tick rate)
  - Easing: 'Linear'

- [ ] [T036] [S2] Update enemy animations based on state
  - File: `client/game.js` (in updateEnemyPositions)
  - If state === 'idle': play idle animation
  - If state === 'wander' || 'chase': play walk animation
  - If state === 'attack': play attack animation (future)
  - Match direction: 'skeleton_walk_down', etc.

- [ ] [T037] [S2] Implement despawnEnemy()
  - File: `client/game.js`
  - Find enemy sprite by enemyId
  - Destroy: sprite, headSprite, healthBar, healthBarBg, nameLabel
  - Remove from enemies group

### Validation
- [ ] [T038] [S2] Test position sync with single enemy
  - Manual test: Watch enemy wander
  - Verify: Movement is smooth (interpolated)
  - Check: Position updates every ~100ms

- [ ] [T039] [S2] Test multi-client synchronization
  - Manual test: Open 2 browser windows
  - Verify: Both see enemy in same position
  - Check: Movement synchronized (±100ms tolerance)

---

## Phase 4: Combat Integration

**Goal:** Enable enemies to attack players

### Server-Side Attack Logic
- [ ] [T040] [S3] Implement executeEnemyAttack()
  - File: `server/enemyAI.js`
  - Called from handleAttackState()
  - Check: attackCooldown expired (compare now vs lastAttackTime)
  - Update: enemy.lastAttackTime = Date.now()

- [ ] [T041] [S3] Implement calculateEnemyDamage()
  - File: `server/enemyAI.js`
  - Formula: `baseDamage = enemy.attackDamage`
  - Apply player defense: `damage = max(1, baseDamage - player.defense)`
  - Add variance: `damage *= (0.8 + random() * 0.4)` (80-120%)
  - Return final damage value

- [ ] [T042] [S3] Apply damage to player health
  - File: `server/enemyAI.js`
  - Update: `player.health -= damage`
  - Clamp: `player.health = max(0, player.health)`
  - Check for player death: `player.health <= 0`

- [ ] [T043] [S3] Update player health in database
  - File: `server/enemyAI.js`
  - Query: `UPDATE characters SET health = $1 WHERE id = $2`
  - Execute after each enemy attack

- [ ] [T044] [S3] Broadcast playerDamaged event
  - File: `server/enemyAI.js`
  - Format: `{ type: 'playerDamaged', playerId, attackerId, damage, playerHealth, playerMaxHealth }`
  - Broadcast to all players in zone

### Player Death Handling
- [ ] [T045] [S3] Implement handlePlayerDeath()
  - File: `server/enemyAI.js`
  - Called when player.health <= 0
  - Broadcast: `{ type: 'playerDeath', playerId, killerId }`
  - Set player state to 'dead' (future: respawn logic)

- [ ] [T046] [S3] Cancel enemy aggro on player death
  - File: `server/enemyAI.js`
  - In handleChaseState and handleAttackState
  - Check: if target player is dead, transition to 'return'

### Client-Side Damage Display
- [ ] [T047] [S3] Add playerDamaged event listener
  - File: `client/game.js`
  - Case: `'playerDamaged'` in handleServerMessage
  - Call: `scene.handlePlayerDamaged(data)`

- [ ] [T048] [S3] Implement handlePlayerDamaged()
  - File: `client/game.js`
  - Update player health in HUD
  - Show damage number above player sprite
  - Flash player sprite red (100ms)
  - Play hurt sound (future)

- [ ] [T049] [P] [S3] Create showPlayerDamageNumber()
  - File: `client/game.js`
  - Similar to enemy damage numbers
  - Display: `-${damage}` in red text
  - Tween: move up 50px, fade out over 1 second

- [ ] [T050] [S3] Update HUD health display
  - File: `client/game.js` (in updateHUD or handlePlayerDamaged)
  - Update: `#player-health` element
  - Show: `${player.health}/${player.max_health}`

### Enemy Attack Animations
- [ ] [T051] [P] [S3] Play enemy attack animation on client
  - File: `client/game.js` (in updateEnemyPositions)
  - When enemy.state === 'attack': play attack animation
  - Animation: 'skeleton_attack_down' (if exists, else use idle)
  - Sync with server attack cooldown

### Validation
- [ ] [T052] [S3] Test enemy aggro and chase
  - Manual test: Approach enemy within 150px
  - Verify: Enemy starts chasing player
  - Check: Enemy movement smooth and directional

- [ ] [T053] [S3] Test enemy attack
  - Manual test: Let enemy reach attack range
  - Verify: Player takes damage every 2 seconds
  - Check: Damage number appears, health decreases

- [ ] [T054] [S3] Test player death
  - Manual test: Let enemy kill player
  - Verify: Player death event broadcast
  - Check: Enemy returns to spawn

---

## Phase 5: Respawn System

**Goal:** Automatically respawn enemies 30 seconds after death

### Server-Side Respawn Logic
- [ ] [T055] [S1] Update handleEnemyDeath() to schedule respawn
  - File: `server/index.js` (in handleAttack function)
  - After setting enemy.state = 'dead'
  - Add to spawn point's respawnQueue
  - Call: `scheduleEnemyRespawn(enemy)`

- [ ] [T056] [S1] Implement scheduleEnemyRespawn()
  - File: `server/index.js`
  - Get: `respawnTime = ENEMY_REGISTRY[enemy.type].respawnTime`
  - Set: `setTimeout(() => respawnEnemy(...), respawnTime)`
  - Log: `[RESPAWN] Scheduled ${enemy.name} for respawn in ${respawnTime}ms`

- [ ] [T057] [S1] Implement respawnEnemy()
  - File: `server/index.js`
  - Find spawn point by spawnPointId
  - Check: `spawnPoint.activeEnemies.length < spawnPoint.maxCount`
  - Create new enemy instance with new ID
  - Add to activeEnemies Map and spawn point's activeEnemies array

- [ ] [T058] [S1] Emit enemySpawn on respawn
  - File: `server/index.js` (in respawnEnemy)
  - Broadcast: `{ type: 'enemySpawn', enemy: {...} }`
  - All clients receive new enemy data

### Spawn Point maxCount Enforcement
- [ ] [T059] [S1] Check maxCount before respawn
  - File: `server/index.js` (in respawnEnemy)
  - If at capacity, log warning and skip respawn
  - Re-queue for later (future enhancement)

- [ ] [T060] [S1] Update spawn point tracking on death
  - File: `server/index.js` (in handleEnemyDeath)
  - Remove enemy ID from spawn point's activeEnemies array
  - Decrement active count

### Client-Side Respawn Handling
- [ ] [T061] [S1] Handle enemySpawn for respawns
  - File: `client/game.js`
  - Already implemented in T033
  - Verify: Creates new sprite even if old one still fading

- [ ] [T062] [S1] Ensure old sprite cleanup before respawn
  - File: `client/game.js`
  - Check: If enemy with same type at same position exists
  - Destroy old sprite before creating new one
  - Prevent sprite duplication

### Validation
- [ ] [T063] [S1] Test enemy respawn after death
  - Manual test: Kill skeleton, wait 30 seconds
  - Verify: New skeleton spawns at same location
  - Check: New enemy has different ID (skeleton_newTimestamp_X)

- [ ] [T064] [S1] Test maxCount enforcement
  - Manual test: Kill 1 of 3 skeletons at spawn point
  - Verify: Only 1 respawns (total returns to 3)
  - Check: No over-spawning

---

## Phase 6: Loot System

**Goal:** Drop visual ground loot on enemy death, allow collection

### Loot Generation (Server)
- [ ] [T065] [S4] Implement generateLoot()
  - File: `server/index.js` (or new server/lootSystem.js)
  - Read: `ENEMY_REGISTRY[enemyType].loot`
  - Roll items based on chance: `Math.random() <= item.chance`
  - Calculate quantity: random between [min, max]
  - Generate gold: random between gold.min and gold.max
  - Return: `{ gold, items: [{id, quantity}] }`

- [ ] [T066] [S4] Create worldLoot Map
  - File: `server/index.js`
  - Add: `const worldLoot = new Map()` at top level
  - Store: lootId → loot data

- [ ] [T067] [S4] Implement spawnLoot()
  - File: `server/index.js`
  - Generate lootId: `loot_${Date.now()}_${Math.random()}`
  - Create loot instance: { id, x, y, gold, items, spawnTime, killerId }
  - Add to worldLoot Map
  - Broadcast: `{ type: 'lootDrop', loot: {...} }`

- [ ] [T068] [S4] Call spawnLoot() in handleEnemyDeath
  - File: `server/index.js`
  - After broadcasting enemyDeath event
  - Generate loot: `const loot = generateLoot(enemy.type)`
  - Spawn: `spawnLoot(enemy.x, enemy.y, loot, killerId)`

- [ ] [T069] [S4] Schedule loot despawn (60 seconds)
  - File: `server/index.js` (in spawnLoot)
  - Set: `setTimeout(() => { worldLoot.delete(lootId); broadcast('lootDespawn') }, 60000)`
  - Broadcast lootDespawn event

### Loot Collection (Server)
- [ ] [T070] [S4] Add collectLoot WebSocket handler
  - File: `server/index.js`
  - Case: `'collectLoot'` in message handler
  - Call: `await handleLootCollection(characterId, data.lootId)`

- [ ] [T071] [S4] Implement handleLootCollection()
  - File: `server/index.js`
  - Validate: loot exists in worldLoot Map
  - Validate: player within 50px of loot
  - Add items to player inventory (database)
  - Add gold to player (database)
  - Remove loot from worldLoot Map
  - Broadcast: `{ type: 'lootCollected', lootId, collectorId }`

- [ ] [T072] [S4] Update inventory database
  - File: `server/index.js` (in handleLootCollection)
  - Query: `INSERT INTO inventory ... ON CONFLICT DO UPDATE SET quantity = quantity + $1`
  - Execute for each item in loot.items

- [ ] [T073] [S4] Update player gold
  - File: `server/index.js` (in handleLootCollection)
  - Query: `UPDATE characters SET gold = gold + $1 WHERE id = $2`
  - Execute with loot.gold amount

- [ ] [T074] [S4] Send lootReceived confirmation to collector
  - File: `server/index.js` (in handleLootCollection)
  - Send to collector's WebSocket: `{ type: 'lootReceived', gold, items }`
  - Used for UI notification

### Client-Side Loot Rendering
- [ ] [T075] [S4] Create worldLoot Map on client
  - File: `client/game.js`
  - Add: `this.worldLoot = new Map()` in create()
  - Store: lootId → loot sprite

- [ ] [T076] [S4] Add lootDrop event listener
  - File: `client/game.js`
  - Case: `'lootDrop'` in handleServerMessage
  - Call: `scene.renderLoot(data.loot)`

- [ ] [T077] [S4] Implement renderLoot()
  - File: `client/game.js`
  - Create sprite: `this.add.sprite(loot.x, loot.y, 'loot_bag')`
  - Set depth: 50 (below characters)
  - Store lootId in sprite: `lootSprite.lootId = loot.id`
  - Add to worldLoot Map

- [ ] [T078] [P] [S4] Create loot bag sprite placeholder
  - File: `client/game.js` (in preload or create)
  - Create simple graphics: gold circle or bag icon
  - Alternative: use existing sprite or create via graphics

- [ ] [T079] [S4] Make loot interactive (click to collect)
  - File: `client/game.js` (in renderLoot)
  - Call: `lootSprite.setInteractive()`
  - Event: `lootSprite.on('pointerdown', () => collectLoot(loot.id))`

### Loot Collection (Client)
- [ ] [T080] [S4] Implement collectLoot()
  - File: `client/game.js`
  - Send: `{ type: 'collectLoot', lootId }`
  - WebSocket: gameState.ws.send(...)

- [ ] [T081] [S4] Implement proximity-based auto-collection
  - File: `client/game.js` (in update loop)
  - Check distance to all loot items
  - If distance < 30px, call collectLoot()
  - Run every frame

- [ ] [T082] [S4] Add lootCollected event listener
  - File: `client/game.js`
  - Case: `'lootCollected'` in handleServerMessage
  - Call: `scene.removeLoot(data.lootId)`

- [ ] [T083] [S4] Implement removeLoot()
  - File: `client/game.js`
  - Find sprite in worldLoot Map
  - Destroy sprite
  - Remove from Map

- [ ] [T084] [S4] Add lootDespawn event listener
  - File: `client/game.js`
  - Case: `'lootDespawn'` in handleServerMessage
  - Call: `scene.removeLoot(data.lootId)`

- [ ] [T085] [S4] Add lootReceived event listener
  - File: `client/game.js`
  - Case: `'lootReceived'` in handleServerMessage
  - Show chat message: `+${data.gold} gold`
  - Show chat message for each item: `+${item.quantity} ${item.id}`
  - Refresh inventory UI: `loadInventory()`

### Validation
- [ ] [T086] [S4] Test loot drop on enemy death
  - Manual test: Kill skeleton
  - Verify: Loot bag appears at death location
  - Check: Loot visible to all players

- [ ] [T087] [S4] Test loot collection by clicking
  - Manual test: Click loot bag
  - Verify: Loot disappears, inventory updated
  - Check: Chat shows "+X gold" message

- [ ] [T088] [S4] Test proximity auto-collection
  - Manual test: Walk over loot bag (don't click)
  - Verify: Loot auto-collected within 30px
  - Check: Inventory updates automatically

- [ ] [T089] [S4] Test loot despawn after 60 seconds
  - Manual test: Kill enemy, don't collect loot
  - Wait 60 seconds
  - Verify: Loot bag disappears automatically

- [ ] [T090] [S4] Test first-to-collect with multiple players
  - Manual test: 2 players approach same loot
  - Verify: First player to collect wins
  - Check: Second player sees loot disappear

---

## Phase 7: Polish & Integration

**Goal:** Performance optimization, error handling, and final testing

### Performance Optimization
- [ ] [T091] [P] Profile server CPU with 100 enemies
  - Manual test: Spawn 100 enemies (modify spawn count temporarily)
  - Monitor: Server CPU usage during AI tick
  - Target: < 50% CPU usage

- [ ] [T092] [P] Profile client FPS with 100 enemies
  - Manual test: Spawn 100 enemies, move around
  - Monitor: FPS in browser dev tools
  - Target: Maintain 60 FPS

- [ ] [T093] [P] Optimize broadcast payload size
  - File: `server/index.js`
  - Only send changed fields (delta compression)
  - Minimize JSON payload size

### Error Handling
- [ ] [T094] [P] Add error handling for AI state transitions
  - File: `server/enemyAI.js`
  - Wrap state handlers in try-catch
  - Log errors without crashing server

- [ ] [T095] [P] Add error handling for loot collection
  - File: `server/index.js`
  - Validate loot exists before processing
  - Handle database errors gracefully

- [ ] [T096] [P] Add client-side error handling
  - File: `client/game.js`
  - Handle missing sprites gracefully
  - Recover from malformed server messages

### Documentation
- [ ] [T097] [P] Add inline comments to AI state machine
  - File: `server/enemyAI.js`
  - Document each state transition condition
  - Explain aggro detection algorithm

- [ ] [T098] [P] Add inline comments to loot system
  - File: `server/index.js`
  - Document loot table rolling logic
  - Explain collection proximity check

### Final Testing
- [ ] [T099] Run complete acceptance checklist from spec.md
  - Reference: [spec.md](./spec.md) (Acceptance Checklist section)
  - Test all spawning, AI, combat, respawn, loot criteria

- [ ] [T100] Update cache-busting timestamps
  - File: `client/index.html`
  - Update `?t=` query params for game.js and enemy-registry.js

- [ ] [T101] Test multi-client synchronization
  - Manual test: 3 browser windows, all see same enemy behavior
  - Verify: Loot collection synchronized
  - Check: No ghost enemies or duplicate loot

---

## Task Dependencies

**Critical Path:**
1. **Phase 1 (T001-T009)** → Enhanced spawn system must work before AI
2. **Phase 2 (T010-T025)** → AI state machine required before position sync
3. **Phase 3 (T026-T039)** → Position sync required for visible AI behavior
4. **Phase 4 (T040-T054)** → Combat integration depends on AI chase/attack states
5. **Phase 5 (T055-T064)** → Respawn depends on death handling from combat
6. **Phase 6 (T065-T090)** → Loot system depends on death events
7. **Phase 7 (T091-T101)** → Polish after core functionality complete

**Parallel Opportunities:**
- T003 (loot table) can run alongside T001-T002
- T020-T022 (movement helpers) can run in parallel
- T029-T030 (event definitions) can run alongside other phase 3 tasks
- T049, T051 (client-side animations) can run in parallel with server work
- T078 (loot sprite) can be created anytime in phase 6
- All Phase 7 tasks (T091-T098) can run simultaneously

**Within-Phase Parallelism:**
- Phase 1: T001-T002 (registry) parallel with T004-T005 (spawn points)
- Phase 2: T020-T022 (helpers) can start early in parallel with state handlers
- Phase 3: T029-T030 (events) parallel with T026-T028 (broadcast)
- Phase 6: T078 (sprite) parallel with T065-T067 (server logic)

---

## Checkpoint Validation

### After Phase 1:
- [ ] Spawn points array exists with 3 entries
- [ ] Each enemy has AI state fields (state, target, etc.)
- [ ] activeEnemies Map contains spawnPointId references
- [ ] No errors on server restart

### After Phase 2:
- [ ] enemyAI.js module created and imported
- [ ] 100ms AI tick loop running
- [ ] Enemies transition from idle → wander
- [ ] Console logs show state transitions

### After Phase 3:
- [ ] enemyUpdate broadcasts every 100ms
- [ ] Client receives position updates
- [ ] Enemy sprites move smoothly (interpolated)
- [ ] Animations match movement direction

### After Phase 4:
- [ ] Enemies detect and chase players
- [ ] Enemies attack when in range
- [ ] Player health decreases from enemy attacks
- [ ] Damage numbers appear above player

### After Phase 5:
- [ ] Enemies respawn 30 seconds after death
- [ ] New enemies have different IDs
- [ ] Spawn point maxCount enforced
- [ ] All clients see respawned enemies

### After Phase 6:
- [ ] Loot bags appear on enemy death
- [ ] Walking over loot collects it
- [ ] Inventory updates with loot items
- [ ] Uncollected loot despawns after 60s

### After Phase 7:
- [ ] Server handles 100 enemies at < 50% CPU
- [ ] Client maintains 60 FPS with many enemies
- [ ] All acceptance criteria passing
- [ ] Multi-client sync working perfectly

---

## Notes

### Implementation Tips
- Start with Phase 1 to enhance existing spawn system
- Test AI state transitions incrementally (one state at a time)
- Use console.log liberally during AI development
- Test with single enemy before scaling to many

### Common Pitfalls
- **Tick rate:** 100ms = 10 TPS. Movement feels sluggish? Consider 50ms (20 TPS)
- **Interpolation:** Must match server tick interval or movement looks jerky
- **Aggro loops:** Ensure enemy doesn't aggro/de-aggro repeatedly at range boundary
- **Respawn overlap:** Check for existing sprites before creating new ones
- **Loot race conditions:** Server must validate loot exists before granting items

### Testing Strategy
- Test each phase completely before moving to next
- Use 1 enemy for initial testing, scale to 3, then 10, then 100
- Test with multiple browser windows for sync validation
- Profile performance early (Phase 7) to catch issues before full implementation

---

**Task List Author:** Claude Sonnet 4.5
**Last Updated By:** Claude Sonnet 4.5
**Status:** Ready for Implementation
