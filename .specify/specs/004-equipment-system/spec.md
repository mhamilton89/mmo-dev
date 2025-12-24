# Feature Specification: Equipment System

**Feature ID:** 004-equipment-system
**Status:** Implemented
**Priority:** P1 (Critical)
**Created:** 2025-12-22
**Last Updated:** 2025-12-22

---

## Overview

The Equipment System provides dynamic, scalable management of character equipment (weapons and armor). It uses a registry-based configuration system that allows adding hundreds of equipment items without code changes, featuring automatic sprite loading, animation creation, and synchronized rendering.

---

## User Scenarios & Testing

### Scenario 1: Equipping Items (P1)

**Given:** A player with equipment in inventory
**When:** They equip a weapon or armor piece
**Then:**
- Item moves from inventory to equipment slot
- Character sprite updates to show equipped item
- Equipment animates synchronously with character movement
- Equipment persists to database

**Acceptance Criteria:**
- Equipment change reflects immediately in UI
- Sprite rendering shows equipment layered correctly
- Walk animations sync across character and equipment
- Idle animations sync across character and equipment
- Database update completes within 5 seconds

**Edge Cases:**
- Equipping item in occupied slot replaces previous item (moves to inventory)
- Equipment rendering handles missing sprite files gracefully
- Invalid equipment names are rejected

---

### Scenario 2: Equipment Rendering (P1)

**Given:** A character with equipped weapon and armor
**When:** The character moves or stands idle
**Then:**
- Equipment sprites render in correct layer order
- Equipment animations match character direction (up, down, left, right)
- Equipment animations match character state (walk, idle)
- Equipment maintains correct position relative to character

**Acceptance Criteria:**
- Armor renders above character base (depth 101)
- Weapons render above armor (depth 200)
- Directional animations use correct sprite rows (rows 8-11 for LPC format)
- Idle state shows correct direction (maintains last movement direction)
- Equipment doesn't flicker or desync during animation

**Edge Cases:**
- Character without equipment renders normally
- Equipment with incorrect sprite dimensions is detected and logged
- Rapid direction changes maintain animation sync

---

### Scenario 3: Adding New Equipment (P1)

**Given:** A developer wants to add a new weapon or armor
**When:** They add an entry to equipment-registry.js
**Then:**
- Equipment loads automatically on game start
- All directional animations are created automatically
- Equipment renders and animates without additional code changes

**Acceptance Criteria:**
- New equipment requires only 1 registry entry (5-10 lines of config)
- No changes to game.js or other core files required
- Equipment follows LPC standard format (1152x4224, rows 8-11)
- System logs confirmation of equipment loading

**Edge Cases:**
- Invalid sprite layout is detected and warned
- Missing sprite files log clear error messages
- Custom sprite layouts can be defined if needed

---

### Scenario 4: Equipment Persistence (P1)

**Given:** A character with equipped items
**When:** They logout and login again
**Then:**
- All equipped items reload correctly
- Equipment slots preserve what was equipped (weapon, armor)
- Equipment rendering matches previous session

**Acceptance Criteria:**
- Equipment loads within 1 second on character load
- Equipped items validated against registry (invalid items handled gracefully)
- Equipment changes save within 5 seconds

---

### Scenario 5: Attack Animations (P1)

**Given:** A character with equipped weapon and armor
**When:** They perform an attack (key "2" for slash_oversize)
**Then:**
- Character plays attack animation (rows 50-53)
- Armor plays matching attack animation (rows 50-53)
- Weapon plays attack frames from registry config
- All layers animate at same speed (from weapon's attackSpeed)
- After attack, all layers return to idle state

**Acceptance Criteria:**
- Attack speed configurable per weapon (attackSpeed in FPS)
- Attack frames configurable per weapon per direction (attackFrames)
- Character, armor, and weapon animate in sync
- Idle frames restored after attack completes
- Attack cannot be spammed (isAttacking flag)

**Edge Cases:**
- Weapon without attackFrames logs warning
- Missing direction in attackFrames falls back gracefully
- Attack while moving maintains correct direction

---

## Functional Requirements

### FR-001: Equipment Registry
The system MUST:
- Define all equipment in centralized configuration file (equipment-registry-v2.js)
- Support declarative equipment definitions with: name, type, slot, sprite file, layout, depth
- Support weapon attack configuration: attackSpeed, attackFrames, idleFrames
- Load equipment automatically from registry on game initialization
- Validate equipment configurations on load

### FR-002: Equipment Slots
The system MUST support:
- Weapon slot (right hand)
- Armor slot (torso)
- Future slots: helmet, shield, boots, accessories (extensible design)

### FR-003: Sprite Management
The system MUST:
- Load equipment sprite sheets automatically from registry file paths
- Support LPC standard format (1152x4224 pixels, 64x64 frames, 18 columns)
- Support custom sprite layouts via layout definitions
- Detect and log sprite loading errors

### FR-004: Animation Generation
The system MUST automatically create:
- Walk animations for all 4 directions (up, down, left, right) using rows 8-11
- Idle animations for all 4 directions (first frame of each walk row)
- Animation keys following pattern: `{equipment_name}_{state}_{direction}`

### FR-005: Rendering & Layering
The system MUST:
- Render equipment sprites synchronized with character animations
- Maintain correct depth layering (character < armor < weapon)
- Sync equipment direction with character direction
- Sync equipment state (walk/idle) with character state
- Support custom depth overrides per equipment item

### FR-006: Equipment Persistence
The system MUST:
- Store equipped items per character in database (equipment table)
- Track item name per slot (weapon, armor)
- Load equipped items on character selection
- Save equipment changes within 5 seconds

### FR-007: Scalability
The system MUST:
- Support hundreds of equipment items via registry entries
- Require zero code changes to add new equipment (only registry config)
- Preload all equipment efficiently on game start
- Handle missing/invalid equipment gracefully

---

## Key Entities

### Equipment Registry Entry - Armor
```javascript
{
    type: 'armor',
    slot: 'armor',
    file: 'assets/equipment/[slot]_armor_[name].png',
    spriteLayout: 'lpc_armor'  // 13 cols, 54 rows
}
```

### Equipment Registry Entry - Weapon
```javascript
{
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_[name].png',
    spriteLayout: 'lpc_standard',  // 18 cols, 66 rows
    depth: 200,
    offsetX: 0,
    offsetY: 0,
    // Attack configuration
    attackSpeed: 10,  // FPS: 6-8 (slow/2H), 10-12 (medium/1H), 14-16 (fast/dagger)
    attackFrames: {
        up: [1152, 1153, 1154, 1155, 1156, 1157],    // row 64 * 18 cols (slash_oversize)
        left: [1152, 1153, 1154, 1155, 1156, 1157],
        down: [1152, 1153, 1154, 1155, 1156, 1157],
        right: [1152, 1153, 1154, 1155, 1156, 1157]
    },
    idleFrames: { up: 144, down: 162, left: 180, right: 198 }
}
```

### Frame Calculation
- **Weapons (18 cols):** `frame = row * 18 + column`
  - Row 64 = slash_oversize attack animation (frames 1152-1157)
  - Idle frames: row 8-11 * 18 (up: 144, down: 162, left: 180, right: 198)
- **Armor (13 cols):** `frame = row * 13 + column`
  - Rows 50-53 = attack animations (up, left, down, right)

### Sprite Layout Definition
```javascript
{
    frameWidth: 64,
    frameHeight: 64,
    expectedWidth: 1152,
    expectedHeight: 4224,
    expectedColumns: 18,
    walkAnimations: { up, down, left, right },
    idleAnimations: { up, down, left, right },
    defaultDirection: 'down',
    defaultDepth: { armor: 101, weapon: 200 }
}
```

### Database Equipment Entry
- **id** (integer, primary key): Unique equipment entry
- **character_id** (integer, foreign key): Owner character
- **slot** (string): Equipment slot (weapon, armor)
- **item_name** (string): Equipment registry key
- **properties** (JSON): Item-specific metadata

---

## Current Equipment Definitions

### Armor
- **torso_armor_plate_iron**: Iron plate armor (lpc_armor format, 13 cols, 54 rows)

### Weapons
- **weapon_waraxe**: War axe (lpc_standard format, 18 cols, 66 rows)
  - attackSpeed: 8 (slow 2-hander)
  - attackFrames: row 64 (slash_oversize), frames 1152-1157
  - idleFrames: { up: 144, down: 162, left: 180, right: 198 }

---

## Success Criteria

### SC-001: Rendering Quality
- Equipment animations perfectly sync with character animations (no desync)
- Equipment direction matches character direction at all times
- Equipment idle state maintains correct direction after movement stops
- Depth layering renders in correct order (no z-fighting)

### SC-002: Scalability
- Adding 100+ equipment items requires only registry entries (no code changes)
- Equipment loading completes within 2 seconds for all items
- Memory usage scales linearly with equipment count (no leaks)

### SC-003: Developer Experience
- New equipment added in under 1 minute (add registry entry, add sprite file)
- Clear error messages for invalid configurations
- Documentation explains exact sprite format requirements
- Examples provided for common equipment types

### SC-004: Performance
- Equipment rendering maintains 60 FPS
- Animation changes complete within 1 frame (16ms)
- Database equipment lookups indexed and fast (<100ms)

---

## Non-Functional Requirements

### Art Asset Standards
- Sprite sheets MUST be LPC format: 1152x4224 pixels
- Frame size MUST be 64x64 pixels (18 columns)
- Walk animations MUST use rows 8-11 (up, left, down, right)
- Idle frames are first frame of each walk row

### Code Quality
- Equipment rendering logic isolated in EquipmentManager class
- Registry is data-driven (no hardcoded equipment in game logic)
- Clear separation: registry (config), manager (logic), game (usage)

### Compatibility
- Works with existing character classes (Warrior, Wizard, Ranger)
- Compatible with inventory system (equipment comes from inventory)
- Extensible for future features (enchantments, durability, stats)

---

## Technical Design Patterns

### Registry Pattern
All equipment defined in `EQUIPMENT_REGISTRY` object, single source of truth for equipment definitions.

### Factory Pattern
`EquipmentManager` creates sprites and animations from registry definitions automatically.

### Data-Driven Configuration
Adding equipment requires only data (registry entry), not code changes.

---

## Known Limitations

### Layering Issue
**Problem:** Weapons may render behind character hands because LPC character sprites have hands baked into base texture.

**Solutions:**
1. Use LPC sprites with separate hand overlay layers (recommended for production)
2. Accept current behavior (acceptable for top-down pixel art)
3. Manually edit character sprites to remove hands, create hand overlays
4. Offset weapons to improve visibility (workaround)

**Status:** Documented in `docs/WEAPON_LAYERING.md`, current behavior accepted.

---

## Out of Scope

- Equipment stats/bonuses (future feature)
- Equipment durability/degradation (future feature)
- Equipment enchantments/modifications (future feature)
- Equipment sets/bonuses (future feature)
- Equipment trading between players (future feature)
- Equipment comparison tooltips (future feature)
- Separate hand overlay layers (requires new sprite assets)

---

## Dependencies

- Phaser 3 game engine (sprite rendering, animations)
- Character management system (equipment per character)
- Inventory system (equipped items from inventory)
- PostgreSQL database (equipment table)
- LPC format sprite assets

---

## Acceptance Checklist

- [ ] Equipment loads from registry automatically
- [ ] Equipment sprites render at correct depth layer
- [ ] Walk animations sync with character direction
- [ ] Idle animations sync with character direction
- [ ] Idle state maintains correct direction after stopping
- [ ] Equipment persists across logout/login
- [ ] Adding new equipment requires only registry entry
- [ ] Invalid equipment configurations log warnings
- [ ] Equipment animations use rows 8-11 (LPC format)
- [ ] Multiple equipment pieces render simultaneously (armor + weapon)

---

## Documentation

### For Developers
- **ADDING_EQUIPMENT.md**: Step-by-step guide for adding new equipment
- **EQUIPMENT_GUIDE.md**: Technical details about equipment system
- **WEAPON_LAYERING.md**: Explanation of layering limitations and solutions

### For Content Creators
- Equipment registry: `client/equipment-registry-v2.js`
- Sprite requirements:
  - Weapons: LPC format (1152x4224, 18 cols, 66 rows)
  - Armor: LPC format (832x3456, 13 cols, 54 rows)
- Asset location: `client/assets/equipment/`

---

## Related Documentation

- Equipment registry: `client/equipment-registry-v2.js`
- Equipment manager: `client/equipment-registry-v2.js` (EquipmentManager class)
- Game integration: `client/game.js`
- Database schema: `database/schema.sql` (equipment table)
- Documentation: `docs/ADDING_EQUIPMENT.md`, `docs/WEAPON_LAYERING.md`

---

**Specification Author:** Claude Sonnet 4.5
**Reviewed By:** Pending
**Approved By:** Pending
