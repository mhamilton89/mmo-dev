# Technical Plan: Combat System

**Feature ID:** 006-combat-system
**Specification:** [spec.md](./spec.md)
**Created:** 2025-12-27
**Last Updated:** 2025-12-27

---

## Summary

**Primary Requirements:**
- Implement AOE cone-based hit detection for melee attacks (64px range, 90° arc)
- Add `attackType` and `attackRange` to equipment registry configuration
- Create server-side combat validation and damage calculation
- Implement multi-target damage events with proper client-side feedback
- Preserve existing attack animation system (already working correctly)

**Technical Approach:**
Extend the existing Phaser-based attack animation system with cone-based multi-target hit detection on the client, then implement server-side validation and damage calculation. Combat will use WebSocket events for real-time attack coordination between client and server, with the server as the authoritative source for all damage application.

---

## Technical Context

### Language & Version
- **Backend:** Node.js 18+ (LTS)
- **Frontend:** JavaScript ES6+
- **Game Engine:** Phaser 3.90+

### Dependencies
- **Database:** PostgreSQL 14+ (for enemy/player data persistence)
- **Real-Time:** WebSocket via Socket.io
- **Additional Libraries:**
  - Phaser 3.90+ (animation system, time events, input handling)
  - Socket.io-client (WebSocket communication)

### Storage
- **Database Tables:** players, enemies (existing), combat_logs (future)
- **File System:**
  - `client/assets/enemies/` - Enemy spritesheets
  - `client/assets/equipment/` - Weapon spritesheets
  - `client/equipment-registry.js` - Equipment configuration
  - `client/enemy-registry.js` - Enemy configuration

### Testing
- **Unit Tests:** Not yet implemented (future enhancement)
- **Integration Tests:** Manual multi-client testing via multiple browser windows
- **Manual Testing:**
  - Attack single enemy at various ranges and directions
  - Attack multiple enemies in cone simultaneously
  - Test attack during movement
  - Test attack cooldowns and spam prevention

### Platform
- **Development:** Windows (MINGW64_NT)
- **Target:** Web browsers (Chrome, Firefox, Edge)

### Project Type
- **Structure:** Client-server MMO (Node.js backend + Phaser 3 frontend)

### Performance Goals
- Maintain 60 FPS during combat with multiple enemies on screen
- Attack input response within 16ms (1 frame at 60 FPS)
- Server validation and damage broadcast within 50ms
- Support 1000+ concurrent players per server instance

### Constraints
- MUST use Phaser 3 APIs exclusively for timing, animations, and events (no setTimeout/setInterval)
- MUST preserve existing attack animation code (working correctly, user requested no changes)
- Players can move during attack animations (existing behavior preserved)
- Fixed 64px attack range for all melee weapons (ranged weapons out of scope)

### Scale/Scope
- Expected load: 100-1000 concurrent players in shared world
- Combat events: 10-50 attacks per second across all players
- Enemy count: 50-100 active enemies per zone/chunk

---

## Constitution Check

This plan aligns with the following constitutional principles:

- ✅ **[P1-AUTHORITY]:** Server is authoritative for all damage calculations and validation. Client only sends attack intent with target IDs; server validates range, cooldowns, and applies damage.
- ✅ **[P2-PERFORMANCE]:** Attack hit detection occurs at middle frame of animation (~200ms into attack), allowing 50ms server round-trip for validation before damage display. Maintains 60 FPS requirement.
- ✅ **[P3-DATA]:** Combat events will persist enemy health changes to database. XP/loot granted immediately on death and written to player record within 5 seconds.
- ✅ **[P4-TESTING]:** Manual testing strategy defined with multi-enemy scenarios. Integration tests can be added via multi-client simulation (future enhancement).
- ✅ **[P5-ASSETS]:** All combat animations use LPC format sprites. Equipment registry follows established configuration pattern.
- ✅ **[P6-SCALE]:** Equipment registry is configuration-driven; new weapons can be added without code changes. AOE hit detection supports multiple targets efficiently.
- ✅ **[P7-SECURITY]:** Client cannot spoof damage. All target IDs validated server-side against actual range/line-of-sight. Damage values calculated exclusively on server.
- ✅ **[P8-QUALITY]:** Attack range (64px), hit frame (middle), cone angle (90°) defined as named constants. WebSocket event contracts documented.
- ✅ **[P9-UX]:** Attack animations provide immediate visual feedback. Damage numbers display within 50ms of server confirmation. Enemy health bars update in real-time.
- ✅ **[P10-WORKFLOW]:** Following spec-driven development. This plan created before implementation. Changes tracked in git with descriptive commits.

**Violations:** None

---

## Project Structure

### Documentation
```
.specify/specs/006-combat-system/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file
├── tasks.md             # Implementation tasks (to be created)
└── contracts/           # API specifications
    └── combat-events.md # WebSocket event definitions (to be created)
```

### Source Code
```
mmo-dev/
├── client/              # Frontend code
│   ├── assets/          # Sprites (existing)
│   ├── equipment-registry.js  # Weapon configs (TO UPDATE)
│   ├── enemy-registry.js      # Enemy configs (existing)
│   ├── game.js                # Main game scene (TO UPDATE)
│   └── index.html             # Cache-busting timestamps (TO UPDATE)
├── server/              # Backend code
│   └── index.js         # Server endpoints (TO UPDATE - add combat handlers)
└── database/            # Database scripts
    └── schema.sql       # Enemy/player health tracking (existing)
```

---

## Architecture

### Component Overview

```
┌─────────────┐         Attack Input (Key "2")          ┌──────────────┐
│   Player    │────────────────────────────────────────>│ Game Scene   │
│   (Phaser)  │                                          │  (game.js)   │
└─────────────┘                                          └──────┬───────┘
                                                                │
                                                                │ 1. Play animations
                                                                │ 2. Hit detection at middle frame
                                                                │
                        ┌───────────────────────────────────────┘
                        │
                        v
         ┌──────────────────────────┐
         │ AOE Cone Hit Detection   │
         │  - 64px radius           │
         │  - 90° facing direction  │
         │  - Returns enemy IDs[]   │
         └──────────┬───────────────┘
                    │
                    │ WebSocket: 'attack' event
                    │ { targetIds: [...], attackType: 'slash_oversize' }
                    v
         ┌──────────────────────────┐
         │   Server (Node.js)       │
         │  - Validate each target  │
         │  - Calculate damage      │
         │  - Update enemy health   │
         └──────────┬───────────────┘
                    │
                    │ WebSocket: 'damage' events (one per enemy)
                    │ { targetId, damage, targetHealth, ... }
                    v
         ┌──────────────────────────┐
         │   All Clients            │
         │  - Update enemy health   │
         │  - Show damage numbers   │
         │  - Play hit effects      │
         └──────────────────────────┘
```

### Database Schema
Uses existing schema:
- `enemies` table: `id`, `health`, `max_health`, `position_x`, `position_y`
- `players` table: `id`, `health`, `max_health`, `experience`

### API Endpoints

**WebSocket Events (Socket.io):**

**Client → Server:**
- `attack`: Player initiates attack
  ```javascript
  {
    attackerId: string,
    targetIds: string[],    // Array of enemy IDs in range
    attackType: string,     // 'slash', 'slash_oversize', etc.
    playerPosition: { x, y },
    playerDirection: string // 'north', 'south', 'east', 'west'
  }
  ```

**Server → Clients:**
- `damage`: Damage applied to target (broadcast to all nearby players)
  ```javascript
  {
    attackerId: string,
    targetId: string,
    damage: number,
    targetHealth: number,
    targetMaxHealth: number,
    hitTargets: string[]    // All IDs hit by this attack
  }
  ```

- `enemyDeath`: Enemy died (broadcast to all nearby players)
  ```javascript
  {
    enemyId: string,
    killerId: string,
    loot: { gold: number, items: [] },
    experience: number
  }
  ```

### Client-Server Communication
- **Protocol:** WebSocket (Socket.io)
- **Message Format:** JSON
- **Events:** See API Endpoints above

---

## Implementation Approach

### Phase 1: Equipment Registry Updates
**Goal:** Add combat configuration to equipment registry

**Files to modify:**
- `client/equipment-registry.js`:
  - Add `attackType` field to `weapon_waraxe` (value: `'slash_oversize'`)
  - Add `attackRange` field to `weapon_waraxe` (value: `64`)
  - Document these fields in comments and template

**Validation:**
- Equipment still loads correctly
- Weapon displays and animates as before

---

### Phase 2: Client-Side Hit Detection
**Goal:** Implement cone-based AOE hit detection at middle frame of attack

**Files to modify:**
- `client/game.js`:
  - Add `detectEnemiesInCone(playerPos, direction, range, coneAngle)` method
  - Modify `handleAttack()` to:
    - Calculate middle frame timing based on weapon's `attackFrames.length`
    - Use `time.delayedCall()` at middle frame to trigger hit detection
    - Call `detectEnemiesInCone()` with 64px range and 90° cone
    - Emit `attack` WebSocket event with target IDs array
  - Add constants: `MELEE_ATTACK_RANGE = 64`, `ATTACK_CONE_ANGLE = 90`

**Hit Detection Logic:**
```javascript
detectEnemiesInCone(playerPos, direction, range, coneAngle) {
  const targets = [];
  const angleMap = { north: 270, south: 90, east: 0, west: 180 };
  const centerAngle = angleMap[direction];
  const halfCone = coneAngle / 2;

  this.enemies.children.each(enemy => {
    if (!enemy.active) return;

    const dx = enemy.x - playerPos.x;
    const dy = enemy.y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > range) return; // Outside range

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let angleDiff = Math.abs(angle - centerAngle);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    if (angleDiff <= halfCone) {
      targets.push(enemy.enemyId);
    }
  });

  return targets;
}
```

**Validation:**
- Console log detected enemy IDs
- Verify cone only hits enemies in front of player
- Verify 64px range limit

---

### Phase 3: Server-Side Combat Handler
**Goal:** Implement authoritative damage calculation and validation

**Files to modify:**
- `server/index.js`:
  - Add `handleAttack(socket, data)` handler for `'attack'` event
  - Validate each target ID:
    - Verify enemy exists in database
    - Verify distance from attacker to each target <= 64px
    - Verify attacker's cooldown has expired
  - Calculate damage based on weapon from player's inventory
  - Update enemy health in database
  - Emit `damage` event to all clients in zone for each hit enemy
  - If enemy health <= 0, emit `enemyDeath` event with loot/XP

**Validation:**
- Server rejects attacks on out-of-range enemies
- Server rejects attacks during cooldown
- Client cannot spoof damage values

---

### Phase 4: Client-Side Damage Display
**Goal:** Show damage numbers and update enemy health bars

**Files to modify:**
- `client/game.js`:
  - Add `handleDamageEvent(data)` socket listener for `'damage'` event
  - Update enemy health bar when damage received
  - Create floating damage number using Phaser text with tween:
    ```javascript
    const damageText = this.add.text(enemy.x, enemy.y - 20, `-${damage}`, {
      fontSize: '16px', fill: '#ff0000'
    });
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });
    ```
  - Play enemy hit flash (use `setTint(0xff0000)` for 100ms, then `clearTint()`)

**Validation:**
- Damage numbers appear above enemies
- Health bars decrease smoothly
- Hit flash visual is visible

---

### Phase 5: Death & Rewards
**Goal:** Handle enemy death and grant XP/loot

**Files to modify:**
- `client/game.js`:
  - Modify existing `handleEnemyDeath()` to listen for server `'enemyDeath'` event
  - Grant XP to player (update UI)
  - Play death animation (already implemented - hurt frames + fade)
  - Display loot notification

- `server/index.js`:
  - When enemy health <= 0, calculate loot from enemy registry
  - Update player XP in database
  - Broadcast `enemyDeath` event

**Validation:**
- Enemy plays death animation
- XP granted to player immediately
- Loot appears (if loot system implemented)

---

## Data Flow

### Attack Flow (Happy Path)

1. **Player presses attack key (Key "2")**
   - `client/game.js`: `handleAttack()` called
   - Animation system plays character/armor/weapon attack animations (existing code)

2. **Middle frame reached (~200ms into attack)**
   - `client/game.js`: `time.delayedCall()` triggers hit detection
   - `detectEnemiesInCone()` returns array of enemy IDs in 64px / 90° cone

3. **Client sends attack intent to server**
   - WebSocket emit: `'attack'` event with target IDs, attack type, player position/direction

4. **Server validates and calculates damage**
   - `server/index.js`: Receives attack event
   - Validates each target ID (distance, enemy exists, cooldown)
   - Calculates damage based on weapon stats
   - Updates enemy health in database

5. **Server broadcasts damage to all clients**
   - WebSocket emit: `'damage'` event per hit enemy (broadcast to zone)
   - Includes: attackerId, targetId, damage, targetHealth

6. **All clients update visuals**
   - `client/game.js`: Receives damage events
   - Updates enemy health bars
   - Shows floating damage numbers
   - Plays hit flash on enemy

7. **Enemy death (if health <= 0)**
   - Server emits `'enemyDeath'` event with loot/XP
   - Client plays death animation (hurt frames, 20s fade)
   - Player receives XP immediately

---

## Error Handling

### Client Errors
- **No enemies in range:** Attack animation plays but no server event sent (graceful)
- **Socket disconnected:** Queue attack events, retry when reconnected (Socket.io auto-reconnect)
- **Animation not found:** Console warning, skip that layer's animation (existing behavior)

### Server Errors
- **Invalid target ID:** Skip that target, validate remaining targets (partial success)
- **Target out of range:** Reject entire attack, log potential cheat attempt
- **Enemy already dead:** Skip damage calculation, no error sent to client
- **Database write failure:** Log error, rollback transaction, send error event to client

### Network Errors
- **Packet loss:** Socket.io auto-retry ensures delivery
- **High latency:** Damage display delayed but animations play immediately (optimistic)
- **Server unavailable:** Client queues events, shows "Reconnecting..." message

### Data Validation
- **Server validates all inputs:**
  - `targetIds` must be non-empty array of strings
  - `attackType` must match player's equipped weapon
  - `playerPosition` must match server's last known position (within tolerance)
  - Attack cooldown enforced server-side (reject spammed attacks)

---

## Security Considerations

- **Attack Range Validation:** Server recalculates distance for each target; client-sent IDs are hints only
- **Damage Calculation:** Entirely server-side; client cannot modify damage values
- **Cooldown Enforcement:** Server tracks last attack timestamp per player; rejects attacks within cooldown window
- **Position Validation:** Server verifies player position hasn't teleported unrealistically since last update
- **Target Validation:** Server ensures all target IDs correspond to actual enemies (not fake IDs)
- **Rate Limiting:** Max 10 attacks per second per player to prevent spam abuse
- **Input Sanitization:** All WebSocket event data validated with type checks before processing

---

## Testing Strategy

### Unit Tests
(Future enhancement - not in initial implementation)
- Cone hit detection algorithm (various angles/distances)
- Damage calculation formula
- Cooldown enforcement logic

### Integration Tests
(Future enhancement - not in initial implementation)
- Multi-client attack synchronization
- Server validation rejects out-of-range attacks
- Database transaction rollback on error

### Manual Testing

**Scenario 1: Single Enemy Attack**
- Spawn 1 enemy at various positions (in front, behind, sides)
- Attack and verify only frontal enemies are hit
- Verify 64px range limit (enemies at 65px not hit)

**Scenario 2: Multi-Enemy AOE**
- Spawn 3 enemies in 90° cone in front of player
- Spawn 2 enemies behind player
- Attack and verify only frontal 3 enemies are hit
- Verify all 3 receive damage simultaneously

**Scenario 3: Attack During Movement**
- Walk forward while attacking
- Verify attack completes normally (existing behavior)
- Verify hit detection occurs at correct frame

**Scenario 4: Cooldown & Spam Prevention**
- Spam attack key rapidly
- Verify `isAttacking` flag prevents overlapping attacks
- Verify server enforces cooldown (rejects spammed attacks)

**Scenario 5: Enemy Death**
- Attack enemy until health reaches 0
- Verify death animation plays (hurt frames, fade)
- Verify XP granted to player
- Verify attack completes even if enemy dies mid-swing

---

## Rollout Plan

1. **Development (Phases 1-5)**
   - Implement phases sequentially
   - Test each phase individually before proceeding
   - Commit after each phase completion

2. **Testing**
   - Run manual test scenarios (above)
   - Test with 2+ browser windows simultaneously (multi-player sync)
   - Profile performance (60 FPS with 10 enemies on screen)

3. **Deployment**
   - Update `client/index.html` cache-busting timestamps
   - Deploy server changes first (backward compatible)
   - Deploy client changes
   - Monitor server logs for errors

---

## Future Enhancements

(Out of scope for this iteration - see spec.md "Out of Scope" section)

- **Critical Hits:** Add `critChance` and `critMultiplier` to weapon config
- **Enemy AI:** Enemies attack back, pursue player, use aggro system
- **PvP Combat:** Extend combat system to support player-vs-player
- **Attack Cancellation:** Add dodge/block mechanics to cancel attacks
- **Knockback Effects:** Push enemies back on hit based on weapon type
- **Combo Attacks:** Multi-attack sequences with timing windows
- **Projectile Weapons:** Ranged attacks with projectile physics
- **Status Effects:** Poison, stun, slow effects from combat

---

## References

- Specification: [spec.md](./spec.md)
- Equipment System: [.specify/specs/004-equipment-system/spec.md](../004-equipment-system/spec.md)
- Phaser 3 Animation Docs: https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html
- Socket.io Events: https://socket.io/docs/v4/emitting-events/

---

**Plan Author:** Claude Sonnet 4.5
**Reviewed By:** Pending
**Approved By:** Pending
