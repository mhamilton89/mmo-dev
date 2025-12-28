# Feature Specification: Enemy Spawning System

**Feature ID:** 005-enemy-spawning
**Status:** Clarified (Ready for Planning)
**Priority:** P2 (High)
**Created:** 2025-12-22
**Last Updated:** 2025-12-27

---

## Overview

The Enemy Spawning System generates NPC enemies in the game world with AI behavior, animations, and combat interactions. Enemies spawn at designated locations, patrol/wander, engage players in combat, and drop loot upon defeat.

---

## Clarifications & Design Decisions

### Spawn Authority & Architecture
- **Spawn Authority:** Server-side spawning (authoritative). Server creates enemy instances and broadcasts to all clients.
- **Spawn Timing:** Zone-based spawning. Enemies spawn when first player enters a zone, despawn when zone is empty (future: for now, spawn on server startup).
- **Spawn Configuration:** Hardcoded spawn points in server code initially. Future migration to Tiled map exports when map system is implemented.
- **Spawn Validation:** No collision validation (trust spawn config). Spawn points must be manually placed during map design to avoid obstacles/overlap.

### Enemy AI Implementation
- **AI Scope:** Full AI implementation as described in spec (wandering, aggro, chase, attack).
- **AI Priority:** Spawning spec takes precedence over combat spec's "passive enemies" note. Combat spec was for initial testing; this spec defines full enemy behavior.
- **AI States:** idle → wander → aggro → chase → attack → return (see Behavior States section).

### Enemy Synchronization
- **Position Updates:** Regular tick-based broadcasts (100ms intervals). Server sends enemy positions to all clients for smooth movement visualization.
- **State Sync:** Server broadcasts AI state changes (idle→wander, aggro detected, attack triggered) as events.
- **Initial Sync:** New players receive complete enemy state (positions, health, current AI state) on zone join.

### Respawn Mechanics
- **Respawn Logic:** Automatic server-side respawn. Server starts timer on enemy death, automatically recreates enemy after configured delay.
- **Respawn IDs:** New ID on each respawn. Each respawn creates fresh enemy instance with new unique ID. Clients destroy old sprite and create new one.
- **Respawn Timer:** Configurable per enemy type (default: 30 seconds). Timer starts when health reaches 0.
- **Spawn Point Tracking:** Each spawn point tracks active enemy count, respawns to maintain maxCount.

### Visual Features
- **Health Bars:** Visible above all enemies (current implementation). Spec updated to reflect this is implemented, not future enhancement.
- **Death Animation:** Hurt animation + 20-second fade (current implementation). Matches existing combat system implementation.
- **Name Labels:** Enemy name and level displayed above sprite (already implemented).

### Loot System
- **Loot Drop Mechanic:** Visual ground loot. Items appear on ground at death location, players walk over to collect (similar to resource gathering).
- **Loot Ownership:** First player to collect wins (no player-specific loot instances initially).
- **Loot Persistence:** Loot despawns after timeout if not collected (60 seconds default).
- **Loot Tables:** Defined per enemy type in ENEMY_REGISTRY on server.

### Out of Scope Clarifications
- **Advanced Pathfinding:** Simple movement only (straight-line chase, random wander). A* pathfinding is future feature.
- **Enemy Scaling:** Fixed stats per enemy type. Level-based scaling is future feature.
- **Boss Mechanics:** Standard enemies only. Boss-specific behaviors are future feature.

### Technical Implementation Principles
- **Phaser API First:** Always leverage Phaser's built-in APIs and features before writing custom code. Use Phaser's GameObject properties, Groups, Animation system, Tweens, and built-in state management wherever possible.
- **State Management:** Use Phaser's built-in active/visible properties correctly. Avoid custom flags unless Phaser's API doesn't support the needed behavior.
- **Sprite Lifecycle:** Follow Phaser's GameObject lifecycle (create → update → destroy). Use Phaser's Groups for managing collections of similar GameObjects.
- **Animation System:** Use Phaser's Animation Manager for all sprite animations. Avoid manual frame manipulation unless absolutely necessary.
- **Custom Code Justification:** When custom code is needed beyond Phaser's API, document why Phaser's built-in solution isn't sufficient.

---

## User Scenarios & Testing

### Scenario 1: Enemy Spawning (P1)

**Given:** The game server initializes or a zone loads
**When:** Enemy spawn logic executes
**Then:**
- Enemies appear at configured spawn points
- Each enemy has correct sprite, animations, and stats
- Enemies are synchronized to all connected players
- Spawn points respect minimum/maximum enemy counts

**Acceptance Criteria:**
- Enemies spawn within 2 seconds of zone load
- All players see enemies in same positions (synchronized)
- Spawn logic respects enemy limits per zone
- Enemies don't spawn overlapping with players or obstacles

**Edge Cases:**
- Zone at enemy capacity doesn't spawn additional enemies
- Server restart repopulates enemies correctly
- Player-killed enemies respawn after configured timer

---

### Scenario 2: Enemy AI & Movement (P1)

**Given:** An enemy exists in the world
**When:** No players are nearby
**Then:**
- Enemy wanders/patrols within spawn area
- Movement animations play correctly (directional walk)
- Enemy respects movement boundaries

**Acceptance Criteria:**
- Enemy movement is smooth and natural
- Directional animations match movement direction
- Enemies don't walk through obstacles or world boundaries
- Movement is synchronized to all players

**Edge Cases:**
- Enemies stuck on obstacles pathfind around them
- Rapid direction changes animate correctly
- Multiple enemies don't stack on same position

---

### Scenario 3: Enemy Aggro & Combat (P2)

**Given:** A player approaches an enemy
**When:** Player enters aggro range
**Then:**
- Enemy detects player and becomes aggressive
- Enemy moves toward player (chase behavior)
- Enemy attacks when in range
- Damage is calculated and applied to player

**Acceptance Criteria:**
- Aggro range is consistent (configured per enemy type)
- Chase speed is faster than wander speed
- Attack animations play correctly
- Damage values match enemy stats
- Player health updates immediately

**Edge Cases:**
- Player moves out of aggro range, enemy returns to spawn
- Multiple players aggro same enemy (targets closest/first)
- Player death causes enemy to reset aggro

---

### Scenario 4: Enemy Death & Loot (P2)

**Given:** A player defeats an enemy (reduces HP to 0)
**When:** Enemy death occurs
**Then:**
- Enemy sprite is removed from world
- Loot drops at enemy location
- Player can collect loot items
- Enemy respawns after configured timer (e.g., 30 seconds)

**Acceptance Criteria:**
- Death animation plays before removal (future enhancement)
- Loot appears within 200ms of death
- Loot is synchronized to all players (first to collect wins)
- Respawn timer is accurate

**Edge Cases:**
- Multiple players damage same enemy (last hit gets loot credit - future: damage-based)
- Enemy death while player is disconnected
- Loot not collected after timeout despawns

---

## Functional Requirements

### FR-001: Enemy Definitions
The system MUST support:
- Enemy types with unique stats (HP, damage, speed)
- Enemy sprites with LPC format animations
- Configurable aggro range and behavior
- Loot tables per enemy type

### FR-002: Spawn System
The system MUST:
- Spawn enemies at configured locations (spawn points)
- Respect minimum/maximum enemy counts per zone
- Respawn defeated enemies after configured timer
- Synchronize enemy positions to all connected players

### FR-003: Enemy AI
The system MUST implement:
- Wander/patrol behavior when idle
- Aggro detection (player enters range)
- Chase behavior (move toward aggro target)
- Attack behavior (damage player when in range)
- Return to spawn when player escapes aggro range

### FR-004: Combat
The system MUST:
- Calculate damage based on enemy stats
- Apply damage to player health
- Handle player attacks on enemies
- Reduce enemy HP when damaged
- Trigger death when HP reaches 0

### FR-005: Enemy Animations
The system MUST:
- Play directional walk animations (up, down, left, right)
- Play idle animations when stationary
- Sync animation direction with movement direction
- Use LPC format sprite sheets (rows 8-11)

### FR-006: Loot System
The system MUST:
- Drop configured loot items on enemy death
- Spawn loot at enemy death location
- Allow players to collect loot (adds to inventory)
- Despawn uncollected loot after timeout (e.g., 60 seconds)

---

## Key Entities

### Enemy Definition
```javascript
{
    type: 'skeleton' | 'goblin' | 'orc',
    name: 'Skeleton Warrior',
    sprite: 'assets/enemies/skeleton.png',
    spriteLayout: 'lpc_standard',
    stats: {
        maxHealth: 50,
        damage: 10,
        moveSpeed: 1.5,
        aggroRange: 150,
        attackRange: 50,
        attackCooldown: 2000
    },
    lootTable: [
        { item: 'bones', chance: 0.8, quantity: [1, 3] },
        { item: 'rusty_sword', chance: 0.1, quantity: 1 }
    ]
}
```

### Enemy Instance (Runtime)
- **id** (string): Unique enemy instance ID
- **type** (string): Enemy type identifier
- **x, y** (float): Current position
- **health** (integer): Current HP
- **state** (string): idle, wander, aggro, attack, dead
- **target** (string): Player ID if aggro'd
- **spawnPoint** (object): Original spawn location

### Spawn Point
- **x, y** (float): Spawn coordinates
- **enemyType** (string): Type of enemy to spawn
- **maxCount** (integer): Maximum enemies for this spawn point
- **respawnTime** (integer): Milliseconds between respawns

---

## Current Enemy Types

### Skeleton Warrior
- **Sprite:** LPC skeleton sprite (layered: body, armor, weapon)
- **Stats:** HP 50, Damage 10, Speed 1.5
- **Behavior:** Wanders near spawn, aggros on sight
- **Loot:** Bones (common), weapons (rare)

---

## Success Criteria

### SC-001: Visual Quality
- Enemy animations are smooth and directional
- Sprites render at correct depth (below players)
- Multiple enemies don't overlap visually
- Enemy sprites match art style of player characters

### SC-002: AI Behavior
- Enemies respond to player presence within aggro range
- Chase behavior is challenging but not impossible to escape
- Attack timing is fair (not instant, telegraphed)
- Return-to-spawn behavior is natural

### SC-003: Performance
- 100+ enemies in world maintain 60 FPS client-side
- Server tick rate remains stable with active enemies
- Enemy pathfinding is efficient (no expensive calculations)

### SC-004: Synchronization
- All players see enemies in same positions (±50ms tolerance)
- Enemy death is synchronized (no ghost enemies)
- Loot drops appear for all nearby players

---

## Non-Functional Requirements

### Scalability
- System supports 100+ concurrent enemies per server instance
- Spawn system extensible to multiple zones/maps
- Enemy definitions easily added via configuration

### Balance
- Enemy difficulty scales appropriately for player level (future)
- Loot drops are rewarding but not overpowered
- Aggro range provides gameplay challenge

### Compatibility
- Enemy sprites use same LPC format as player characters
- Compatible with future features (quests, bosses, factions)

---

## Out of Scope

- Boss enemies with unique mechanics (future feature)
- Enemy factions/relationships (future feature)
- Advanced pathfinding (A* algorithm) - simple movement only
- Enemy level/scaling system (future feature)
- Rare/elite enemy spawns (future feature)
- Enemy abilities/special attacks beyond basic attack (future feature)
- Player-specific loot instances (first-to-collect for now)
- Dynamic difficulty scaling (future feature)
- Enemy group tactics/formations (future feature)

---

## Dependencies

- Phaser 3 game engine (sprite rendering, animations)
- WebSocket real-time synchronization
- Loot system integration with inventory
- Combat system for damage calculation
- LPC format enemy sprite assets

---

## Acceptance Checklist

### Spawning & Initialization
- [ ] Enemies spawn server-side on zone load (or server startup initially)
- [ ] New players receive all enemy data on join (positions, health, AI state)
- [ ] Each enemy has unique server-generated ID
- [ ] Spawn points defined in server code (hardcoded initially)
- [ ] Health bars visible above all enemies
- [ ] Name labels show enemy name and level

### Enemy AI & Movement
- [ ] Enemies wander randomly when idle (within spawn radius)
- [ ] Enemies detect players within aggro range (150px default)
- [ ] Enemies chase aggro target toward player
- [ ] Enemies return to spawn when player escapes aggro range
- [ ] Enemy positions broadcast to clients every 100ms (tick-based sync)
- [ ] Directional walk animations match movement direction

### Combat Integration
- [ ] Player attacks reduce enemy HP (server validates damage)
- [ ] Enemy health bars update in real-time
- [ ] Enemies attack players when in attack range
- [ ] Enemy damage calculated server-side and applied to player
- [ ] Hurt animation plays when enemy takes damage
- [ ] Enemies die when HP reaches 0 (hurt animation + 20s fade)

### Respawn System
- [ ] Enemies auto-respawn after death (30s timer)
- [ ] Each respawn creates new enemy instance with new ID
- [ ] Respawn maintains spawn point's maxCount limit
- [ ] All clients notified of respawned enemies
- [ ] Clients destroy old sprite and create new one on respawn

### Loot System
- [ ] Loot items appear on ground at enemy death location
- [ ] Loot is visual (sprites on ground, collectible by walking over)
- [ ] First player to collect wins (no player-specific instances)
- [ ] Uncollected loot despawns after 60 seconds
- [ ] Loot items match enemy's loot table configuration

### Synchronization
- [ ] All players see enemies in same positions (±100ms tolerance)
- [ ] AI state changes broadcast to all players
- [ ] Enemy death synchronized (no ghost enemies)
- [ ] Movement smooth despite tick-based updates (client interpolation)

---

## Enemy Configuration

### Spawn Points
**Current:** Hardcoded array in `server/index.js`
**Future:** Extract from Tiled map exports as object layers (when map system is implemented)

Current implementation example:
```javascript
const enemySpawnPositions = [
    { x: 400, y: 300, type: 'skeleton' },
    { x: 600, y: 200, type: 'skeleton' },
    { x: 250, y: 450, type: 'skeleton' }
];
```

Future Tiled map format (when implemented):
```json
{
    "name": "enemy_spawns",
    "type": "objectgroup",
    "objects": [
        {
            "x": 400,
            "y": 300,
            "type": "skeleton",
            "properties": {
                "maxCount": 3,
                "respawnTime": 30000,
                "wanderRadius": 100
            }
        }
    ]
}
```

### Behavior States
- **idle**: Standing still at spawn
- **wander**: Moving randomly near spawn
- **aggro**: Player detected, chasing
- **attack**: In attack range, attacking
- **dead**: Defeated, pending respawn

---

## Technical Implementation Notes

### Sprite Format
Enemies use LPC standard format (same as player characters):
- Dimensions: 1152x4224 pixels
- Frame size: 64x64
- Walk animations: rows 8-11 (up, left, down, right)
- Idle: first frame of each walk row

### Layered Sprites
Skeleton enemies use layered rendering:
1. Body base (bones)
2. Armor/clothing (if applicable)
3. Weapon (if applicable)

This follows same pattern as player equipment system.

---

## Related Documentation

- Enemy sprite assets: `client/assets/enemies/`
- Server spawn logic: `server/index.js` (enemy spawn system)
- Client rendering: `client/game.js` (enemy sprite handling)
- Database: Future enemy_spawns table for persistent spawn points

---

**Specification Author:** Claude Sonnet 4.5
**Clarified By:** Claude Sonnet 4.5 (2025-12-27)
**Reviewed By:** User (2025-12-27)
**Approved By:** User (2025-12-27)
