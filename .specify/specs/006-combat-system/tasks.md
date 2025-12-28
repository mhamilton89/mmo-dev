# Implementation Tasks: Combat System

**Feature ID:** 006-combat-system
**Specification:** [spec.md](./spec.md)
**Plan:** [plan.md](./plan.md)
**Created:** 2025-12-27
**Last Updated:** 2025-12-27

---

## Task Summary

- **Total Tasks:** 23
- **Phases:** 5
- **Parallel Execution Opportunities:** 5 tasks marked with [P]
- **Estimated Complexity:** Medium

---

## Task Format

Each task follows this structure:
```
- [ ] [T###] [P?] [Scenario?] Description with file path
```

- **Checkbox:** `- [ ]` (mark `[X]` when complete)
- **Task ID:** Sequential (T001, T002, T003...)
- **[P] marker:** Indicates task can run in parallel with others
- **[S#] label:** Maps to scenario (e.g., [S1], [S3], [S4])
- **Description:** Clear action with exact file path

---

## Phase 1: Equipment Registry Updates

**Goal:** Add combat configuration fields to equipment registry

### Configuration
- [ ] [T001] [S1] Add `attackType` field to `weapon_waraxe` config
  - File: `client/equipment-registry.js`
  - Value: `attackType: 'slash_oversize'`

- [ ] [T002] [S1] Add `attackRange` field to `weapon_waraxe` config
  - File: `client/equipment-registry.js`
  - Value: `attackRange: 64`

- [ ] [T003] [P] Update weapon template comments with new fields
  - File: `client/equipment-registry.js`
  - Add documentation for `attackType` and `attackRange` fields

### Validation
- [ ] [T004] [S1] Test equipment loading with new fields
  - Manual test: Start game, verify weapon_waraxe loads correctly
  - Verify no console errors on equipment load

---

## Phase 2: Client-Side Hit Detection

**Goal:** Implement cone-based AOE hit detection at middle frame of attack

### Constants & Configuration
- [ ] [T005] [S3] Add combat constants to game.js
  - File: `client/game.js`
  - Add `MELEE_ATTACK_RANGE = 64` and `ATTACK_CONE_ANGLE = 90` at top of file

### Hit Detection Algorithm
- [ ] [T006] [S3] Implement `detectEnemiesInCone()` method
  - File: `client/game.js`
  - Algorithm: Check distance <= 64px AND angle within 90° cone
  - Returns: Array of enemy IDs

- [ ] [T007] [S3] Add angle calculation helper utilities
  - File: `client/game.js`
  - Direction to angle map: { north: 270, south: 90, east: 0, west: 180 }

### Attack Handler Integration
- [ ] [T008] [S3] Calculate middle frame timing in `handleAttack()`
  - File: `client/game.js`
  - Read weapon's `attackFrames` array length
  - Calculate middle frame: `Math.floor(frameCount / 2)`

- [ ] [T009] [S3] Add `time.delayedCall()` for hit detection trigger
  - File: `client/game.js`
  - Calculate delay: `(middleFrame * 1000) / weapon.attackSpeed`
  - Call `detectEnemiesInCone()` at middle frame

- [ ] [T010] [S3] Add console logging for detected targets (debug)
  - File: `client/game.js`
  - Log: `[COMBAT] Detected ${targetIds.length} enemies in cone: ${targetIds}`

### Validation
- [ ] [T011] [S3] Test cone detection with single enemy
  - Manual test: Spawn 1 enemy in front, verify detected
  - Test: Spawn 1 enemy behind, verify NOT detected

- [ ] [T012] [S3] Test cone detection with multiple enemies
  - Manual test: Spawn 3 enemies in 90° arc, verify all detected
  - Test: Spawn 2 enemies outside cone, verify NOT detected

---

## Phase 3: Server-Side Combat Handler

**Goal:** Implement authoritative damage calculation and validation

### WebSocket Event Handlers
- [ ] [T013] [S3] Add `socket.on('attack')` handler in server
  - File: `server/index.js`
  - Parse: `{ attackerId, targetIds, attackType, playerPosition, playerDirection }`

- [ ] [T014] [S3] Implement attack validation logic
  - File: `server/index.js`
  - Validate: Enemy exists, range <= 64px, cooldown expired
  - Track last attack time per player (cooldown enforcement)

### Damage Calculation
- [ ] [T015] [S3] Implement damage calculation from weapon stats
  - File: `server/index.js`
  - Get weapon from player inventory/equipment
  - Calculate damage: `weaponDamage * (1 + playerStrength/100)` (placeholder formula)

- [ ] [T016] [S3] Update enemy health in database/memory
  - File: `server/index.js`
  - Decrement enemy health by damage amount
  - Track enemy death state (health <= 0)

### Response Broadcasting
- [ ] [T017] [S3] Emit `damage` event per hit enemy
  - File: `server/index.js`
  - Broadcast to zone: `{ attackerId, targetId, damage, targetHealth, targetMaxHealth, hitTargets }`

### Validation
- [ ] [T018] [S3] Test server rejects out-of-range attacks
  - Manual test: Send attack with target 100px away
  - Verify: Server rejects, client receives no damage event

---

## Phase 4: Client-Side Damage Display

**Goal:** Show damage numbers and update enemy health bars

### WebSocket Listeners
- [ ] [T019] [S4] Add `socket.on('damage')` listener in client
  - File: `client/game.js`
  - Parse: `{ attackerId, targetId, damage, targetHealth, targetMaxHealth, hitTargets }`

### Visual Feedback
- [ ] [T020] [S4] Implement floating damage numbers with Phaser tweens
  - File: `client/game.js`
  - Create text at enemy position: `-${damage}`
  - Tween: Move up 50px, fade to 0 over 1 second

- [ ] [T021] [S4] Update enemy health bar on damage event
  - File: `client/game.js`
  - Update `enemy.healthBar` width based on `targetHealth / targetMaxHealth`

- [ ] [T022] [P] [S4] Add enemy hit flash effect
  - File: `client/game.js`
  - `enemy.setTint(0xff0000)` for 100ms, then `clearTint()`
  - Use `time.delayedCall()` for tint removal

### Validation
- [ ] [T023] [S4] Test damage numbers appear above enemies
  - Manual test: Attack enemy, verify damage number floats up
  - Verify: Number fades out after 1 second

- [ ] [T024] [S4] Test health bars update correctly
  - Manual test: Attack enemy multiple times
  - Verify: Health bar decreases proportionally to damage

---

## Phase 5: Death & Rewards

**Goal:** Handle enemy death and grant XP/loot

### Server Death Logic
- [ ] [T025] Emit `enemyDeath` event when enemy health <= 0
  - File: `server/index.js`
  - Broadcast: `{ enemyId, killerId, loot: { gold, items }, experience }`

- [ ] [T026] Calculate loot/XP from enemy registry
  - File: `server/index.js`
  - Read enemy data to determine loot drops and XP grant

- [ ] [T027] Update player XP in database
  - File: `server/index.js`
  - Increment player's experience by `enemy.loot.experience`

### Client Death Handling
- [ ] [T028] Add `socket.on('enemyDeath')` listener
  - File: `client/game.js`
  - Parse: `{ enemyId, killerId, loot, experience }`

- [ ] [T029] Grant XP to player and update UI
  - File: `client/game.js`
  - Update player's XP display
  - Show "+X XP" notification (optional)

- [ ] [T030] [P] Display loot notification (if loot system exists)
  - File: `client/game.js`
  - Show "You received: X gold" message (if applicable)

### Integration
- [ ] [T031] Verify death animation plays after enemyDeath event
  - File: `client/game.js`
  - Existing `handleEnemyDeath()` should already play hurt animation + fade
  - Ensure animation completes even if player still attacking

### Validation
- [ ] [T032] Test enemy dies after sufficient damage
  - Manual test: Attack enemy until health reaches 0
  - Verify: Death animation plays (hurt frames, 20s fade)

- [ ] [T033] Test XP granted immediately on death
  - Manual test: Kill enemy, check player XP updates
  - Verify: XP added before death animation completes

---

## Phase 6: Polish & Integration

**Goal:** Error handling, optimization, and final testing

### Error Handling
- [ ] [T034] [P] Add client-side error handling for disconnects
  - File: `client/game.js`
  - Queue attack events during disconnect, retry on reconnect

- [ ] [T035] Add server-side validation error messages
  - File: `server/index.js`
  - Log: "Attack rejected - target out of range", "Attack rejected - cooldown active"

### Performance
- [ ] [T036] Profile client FPS with 10 enemies on screen
  - Manual test: Spawn 10 enemies, attack repeatedly
  - Verify: Maintains 60 FPS during combat

- [ ] [T037] Test server handles multiple simultaneous attacks
  - Manual test: Open 2 browser windows, attack different enemies simultaneously
  - Verify: Both attacks processed correctly, no race conditions

### Documentation
- [ ] [T038] [P] Add inline comments to cone detection algorithm
  - File: `client/game.js`
  - Explain angle calculation and distance checking

- [ ] [T039] [P] Document WebSocket event contracts
  - File: `.specify/specs/006-combat-system/contracts/combat-events.md`
  - Define all `attack`, `damage`, and `enemyDeath` event structures

### Final Testing
- [ ] [T040] Run complete acceptance checklist from spec.md
  - Reference: [spec.md](./spec.md) (Acceptance Checklist section)
  - Test all animation, combat mechanics, and server integration items

- [ ] [T041] Update cache-busting timestamps in index.html
  - File: `client/index.html`
  - Update `?t=` query params for game.js and equipment-registry.js

- [ ] [T042] Test in multiple browsers (Chrome, Firefox, Edge)
  - Manual test: Verify combat works identically across browsers
  - Check for browser-specific issues

---

## Task Dependencies

**Critical Path:**
1. **Phase 1 (T001-T004)** → Equipment registry must be updated before testing combat
2. **Phase 2 (T005-T012)** → Client hit detection must work before server integration
3. **Phase 3 (T013-T018)** → Server handler must exist before damage display
4. **Phase 4 (T019-T024)** → Damage display depends on server events
5. **Phase 5 (T025-T033)** → Death handling depends on damage system
6. **Phase 6 (T034-T042)** → Polish after core functionality complete

**Parallel Opportunities:**
- T003 (documentation) can run alongside T001-T002
- T022 (hit flash) can run alongside T019-T021
- T030 (loot notification) can run alongside T028-T029
- T034, T038, T039 (documentation/polish) can all run in parallel

**Within-Phase Parallelism:**
- Phase 2: T010 (logging) can be added anytime after T006
- Phase 4: T022 (hit flash) independent of T019-T021
- Phase 6: All [P] marked tasks (T034, T038, T039) can run simultaneously

---

## Checkpoint Validation

### After Phase 1:
- [ ] Equipment registry loads without errors
- [ ] Weapon has `attackType` and `attackRange` fields
- [ ] No console warnings on game startup

### After Phase 2:
- [ ] Console logs show detected enemy IDs when attacking
- [ ] Cone detection only hits enemies in front of player
- [ ] 64px range limit enforced

### After Phase 3:
- [ ] Server receives attack events
- [ ] Server emits damage events back to client
- [ ] Server rejects invalid attacks (out of range, cooldown)

### After Phase 4:
- [ ] Damage numbers appear above enemies
- [ ] Health bars update in real-time
- [ ] Hit flash effect visible on enemy

### After Phase 5:
- [ ] Enemies die when health reaches 0
- [ ] Death animation plays (hurt frames, fade)
- [ ] XP granted to player immediately

### After Phase 6:
- [ ] All acceptance criteria from spec.md passing
- [ ] 60 FPS maintained during combat
- [ ] Multi-client testing successful
- [ ] No console errors or warnings

---

## Notes

### Implementation Tips
- Start with small changes: Add one field at a time to equipment registry
- Test frequently: After each task, reload the game and verify behavior
- Use console logging liberally during development (remove in T041)
- Keep existing attack animation code unchanged (user requirement)

### Common Pitfalls
- **Angle calculation:** Ensure angles are normalized to 0-360° range
- **Middle frame timing:** Different weapons have different frame counts - calculate dynamically
- **Server validation:** Don't trust client-sent positions; recalculate distances server-side
- **Death during attack:** Ensure attack animation completes even if enemy dies mid-swing

### Testing Strategy
- Test each phase independently before moving to next
- Use single enemy first, then multi-enemy scenarios
- Test edge cases: enemies at exactly 64px, enemies at 45° angle (cone boundary)
- Open multiple browser windows to test multiplayer synchronization

---

**Task List Author:** Claude Sonnet 4.5
**Last Updated By:** Claude Sonnet 4.5
**Status:** Not Started
