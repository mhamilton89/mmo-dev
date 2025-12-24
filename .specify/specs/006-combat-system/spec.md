# Feature Specification: Combat System

**Feature ID:** 006-combat-system
**Status:** In Progress
**Priority:** P1 (Critical)
**Created:** 2025-12-23
**Last Updated:** 2025-12-23

---

## Overview

The Combat System enables player characters to attack enemies and other players using equipped weapons. It handles attack animations, damage calculation, hit detection, and combat feedback. All client-side combat visuals MUST use Phaser 3 APIs for animations, timing, and events.

---

## Technical Principles

### Phaser API Priority
All combat visuals and timing MUST use Phaser's built-in systems:
- **Animations:** Use `anims.create()`, `anims.play()`, `animationcomplete` events
- **Timing:** Use `time.delayedCall()`, `time.addEvent()` - NOT `setTimeout`/`setInterval`
- **Events:** Use Phaser's event system (`on()`, `once()`, `off()`)
- **Frame Management:** Use `sprite.anims.play()` instead of manual `setFrame()` cycling

### Server Authority
- All damage calculations MUST occur server-side
- Client sends attack intent, server validates and broadcasts results
- Client handles visual feedback only

---

## User Scenarios & Testing

### Scenario 1: Basic Attack (P1)

**Given:** A player with an equipped weapon standing near an enemy
**When:** They press the attack key (key "2" for slash_oversize)
**Then:**
- Character plays attack animation (rows 50-53)
- Armor plays matching attack animation (rows 50-53)
- Weapon plays attack animation from registry config
- All layers animate in sync at weapon's attackSpeed
- After attack, all layers return to idle state
- Attack cooldown prevents spam

**Acceptance Criteria:**
- Attack animation plays smoothly without flickering
- All equipment layers (character, armor, weapon) sync perfectly
- Attack speed configurable per weapon via `attackSpeed` in registry
- Attack cannot be triggered during cooldown (`isAttacking` flag)

**Edge Cases:**
- Attack while moving maintains correct direction
- Attack with no weapon equipped plays unarmed animation
- Weapon without `attackFrames` logs warning and skips weapon animation

---

### Scenario 2: Attack Animation Sync (P1)

**Given:** A character with weapon and armor equipped
**When:** An attack is triggered
**Then:**
- Character animation uses Phaser's `anims.play()` with custom frameRate
- Armor animation uses Phaser's `anims.play()` with same frameRate
- Weapon animation created dynamically and played via Phaser
- All three complete at the same time

**Acceptance Criteria:**
- No desync between character, armor, and weapon animations
- Frame rate controlled by weapon's `attackSpeed` config
- Animations complete within `totalDuration` calculated from frame count and FPS

---

### Scenario 3: Damage Application (P2)

**Given:** A player attacks an enemy within range
**When:** The attack animation reaches the hit frame
**Then:**
- Client sends attack event to server with target info
- Server validates range, cooldown, and line of sight
- Server calculates damage based on weapon stats
- Server broadcasts damage result to all nearby clients
- Target's health updates and damage number displays

**Acceptance Criteria:**
- Damage only applied after server validation
- Client cannot spoof damage values
- Hit detection uses server-side distance calculation

---

### Scenario 4: Combat Feedback (P2)

**Given:** An attack successfully hits a target
**When:** The server confirms the hit
**Then:**
- Damage number floats up from target
- Target flashes red briefly (hit indicator)
- Attack sound plays
- Screen shake (optional, configurable)

**Acceptance Criteria:**
- Visual feedback uses Phaser tweens for smooth animation
- Damage numbers use Phaser text with tween for float-up effect
- Hit flash uses Phaser's tint system

---

## Functional Requirements

### FR-001: Attack Input Handling
The system MUST:
- Bind attack actions to configurable keys (default: "1" basic, "2" slash_oversize)
- Use `Phaser.Input.Keyboard.JustDown()` for attack detection
- Prevent attack spam via `isAttacking` flag

### FR-002: Attack Animation System
The system MUST:
- Create weapon attack animations dynamically from registry `attackFrames`
- Use Phaser's `anims.create()` for animation definition
- Use Phaser's `anims.play()` for animation playback
- Sync all equipment layers to same `frameRate` (from weapon's `attackSpeed`)
- Use `animationcomplete` event for cleanup, NOT timers

### FR-003: Equipment Animation Sync
The system MUST:
- Play character attack animation with `{ key, frameRate }` override
- Play armor attack animation with same frameRate
- Play weapon attack animation with same frameRate
- All animations start simultaneously

### FR-004: Attack Configuration
The system MUST read from equipment registry:
- `attackSpeed`: Frames per second for attack animation
- `attackFrames`: Frame indices per direction
- `idleFrames`: Frame indices for returning to idle

### FR-005: Server Communication
The system MUST:
- Send attack intent to server (target ID, attack type)
- Wait for server validation before applying damage
- Display damage result only after server confirmation

---

## Key Entities

### Attack Animation Config (from Equipment Registry)
```javascript
{
    attackSpeed: 8,  // FPS: 6-8 (slow), 10-12 (medium), 14-16 (fast)
    attackFrames: {
        up: [frame1, frame2, ...],
        down: [frame1, frame2, ...],
        left: [frame1, frame2, ...],
        right: [frame1, frame2, ...]
    },
    idleFrames: { up: frame, down: frame, left: frame, right: frame }
}
```

### Attack State
- **isAttacking** (boolean): Prevents attack spam
- **currentDirection** (string): north/south/east/west
- **attackType** (string): 'basic', 'slash_oversize', etc.

### Damage Event (Server → Client)
```javascript
{
    attackerId: string,
    targetId: string,
    damage: number,
    isCritical: boolean,
    targetHealth: number,
    targetMaxHealth: number
}
```

---

## Implementation Pattern

### Correct: Using Phaser Animation System
```javascript
// Create animation dynamically from registry frames
const animKey = `${weaponKey}_slash_${direction}`;
if (!this.anims.exists(animKey)) {
    this.anims.create({
        key: animKey,
        frames: attackFrames.map(f => ({ key: weaponKey, frame: f })),
        frameRate: ATTACK_FPS,
        repeat: 0
    });
}

// Play animation
sprite.anims.play(animKey, true);

// Handle completion via Phaser event
sprite.once('animationcomplete', () => {
    sprite.setFrame(idleFrame);
});
```

### Incorrect: Manual Frame Cycling (DO NOT USE)
```javascript
// DON'T DO THIS - causes desync issues
let frameIndex = 0;
sprite.setFrame(frames[frameIndex]);
this.time.addEvent({
    delay: frameDuration,
    repeat: frames.length - 1,
    callback: () => {
        frameIndex++;
        sprite.setFrame(frames[frameIndex]);
    }
});
```

---

## Success Criteria

### SC-001: Animation Quality
- No flickering during attack animations
- No desync between character, armor, and weapon layers
- Smooth transition from idle → attack → idle

### SC-002: Performance
- Attack animations maintain 60 FPS
- No frame drops during combat
- Efficient memory usage (reuse animations, don't recreate)

### SC-003: Configurability
- Attack speed adjustable per weapon without code changes
- Attack frames adjustable per weapon without code changes
- New attack types addable via registry config

---

## Non-Functional Requirements

### Performance
- Combat animations MUST NOT cause frame drops below 60 FPS
- Animation creation MUST be cached (create once, reuse)

### Code Quality
- All timing MUST use Phaser APIs (`time.delayedCall`, NOT `setTimeout`)
- All animations MUST use Phaser animation system
- Manual `setFrame()` cycling MUST NOT be used for multi-frame animations

### Maintainability
- Attack configs live in equipment registry (data-driven)
- No hardcoded frame numbers in game.js

---

## Out of Scope

- Combo attacks (future feature)
- Special abilities/skills (future feature)
- Projectile attacks (future feature - ranged weapons)
- PvP damage balancing (future feature)
- Block/parry mechanics (future feature)
- Status effects from combat (future feature)

---

## Dependencies

- Phaser 3 game engine (animation system, input, timing)
- Equipment System (weapon config, attack frames)
- Character System (player sprite, direction tracking)
- Server (damage validation, broadcast)

---

## Acceptance Checklist

- [ ] Attack key triggers attack animation
- [ ] Character plays attack animation smoothly
- [ ] Armor plays attack animation in sync with character
- [ ] Weapon plays attack animation in sync with character
- [ ] Attack speed controlled by weapon's `attackSpeed` config
- [ ] Attack frames read from weapon's `attackFrames` config
- [ ] All animations use Phaser's `anims.play()` (not manual setFrame)
- [ ] `animationcomplete` event used for cleanup
- [ ] No flickering or desync during animations
- [ ] isAttacking flag prevents attack spam
- [ ] Idle frame restored after attack completes

---

## Related Documentation

- Equipment registry: `client/equipment-registry.js`
- Equipment spec: `.specify/specs/004-equipment-system/spec.md`
- Game integration: `client/game.js`
- Phaser Animation docs: https://photonstorm.github.io/phaser3-docs/Phaser.Animations.AnimationManager.html

---

**Specification Author:** Claude Opus 4.5
**Reviewed By:** Pending
**Approved By:** Pending
