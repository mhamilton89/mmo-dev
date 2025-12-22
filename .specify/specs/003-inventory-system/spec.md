# Feature Specification: Inventory System

**Feature ID:** 003-inventory-system
**Status:** Implemented
**Priority:** P1 (Critical)
**Created:** 2025-12-22
**Last Updated:** 2025-12-22

---

## Overview

The Inventory System allows players to collect, store, and manage items. It provides a visual UI for viewing items and persists inventory state to the database for each character.

---

## User Scenarios & Testing

### Scenario 1: Viewing Inventory (P1)

**Given:** A player in-game with items in inventory
**When:** The inventory UI is displayed
**Then:**
- All items are shown in a grid layout
- Each item displays with icon/name
- Item count displays for stackable items
- Inventory can be toggled open/closed

**Acceptance Criteria:**
- Inventory loads within 500ms
- Items are displayed in acquisition order
- Empty inventory shows "No items" message
- Inventory UI doesn't block gameplay (can be minimized)

**Edge Cases:**
- Empty inventory shows appropriately
- Very large item counts display correctly (999+)
- Long item names truncate gracefully

---

### Scenario 2: Collecting Items (P1)

**Given:** A player encounters a collectible item (loot drop, resource node)
**When:** They interact with the item
**Then:**
- Item is added to inventory
- Item appears in inventory UI immediately
- Item persists to database
- Duplicate items stack if stackable

**Acceptance Criteria:**
- Item pickup completes within 200ms
- UI updates immediately (optimistic update)
- Database write completes within 5 seconds
- Stackable items increment count (not create duplicates)

**Edge Cases:**
- Full inventory prevents pickup (shows error)
- Network failure during pickup rolls back optimistic update
- Simultaneous item pickup by multiple systems handled correctly

---

### Scenario 3: Item Persistence (P1)

**Given:** A player with items in inventory
**When:** They logout and login again
**Then:**
- All items remain in inventory
- Item counts are preserved
- Item order is preserved

**Acceptance Criteria:**
- Zero item loss across sessions
- Inventory loads within 1 second on login
- Items associated with correct character (not shared across characters)

**Edge Cases:**
- Logout during item pickup doesn't duplicate items
- Database connection failure during save attempts retry
- Concurrent inventory updates are serialized

---

### Scenario 4: Using/Consuming Items (P2)

**Given:** A player with consumable items (potions, food)
**When:** They use/consume an item
**Then:**
- Item count decrements
- Item effect applies (heal, buff, etc.)
- Item removed if count reaches zero
- Database updates persist

**Acceptance Criteria:**
- Item usage completes within 200ms
- Effects apply immediately
- UI updates immediately
- Last item in stack is removed from inventory

**Edge Cases:**
- Using item during cooldown is prevented
- Network failure doesn't consume item without effect
- Rapid clicking doesn't duplicate item usage

---

## Functional Requirements

### FR-001: Inventory Storage
The system MUST:
- Store items per character (not per account)
- Support multiple item types (equipment, consumables, resources, quest items)
- Track item quantity for stackable items
- Persist inventory to database

### FR-002: Inventory Display
The system MUST:
- Display all items in scrollable grid UI
- Show item icon, name, and quantity
- Support inventory toggle (open/close)
- Highlight newly acquired items (optional enhancement)

### FR-003: Item Acquisition
The system MUST:
- Add items to inventory when looted
- Stack identical items if stackable
- Prevent pickup when inventory is full
- Update UI immediately (optimistic)
- Persist to database within 5 seconds

### FR-004: Item Properties
The system MUST support:
- Item name and type
- Item icon/sprite (future enhancement)
- Stackability (max stack size)
- Item metadata (properties JSON)

### FR-005: Inventory Limits
The system MUST:
- Enforce maximum inventory slots (configurable, default 30)
- Prevent item acquisition when full
- Display slot usage (e.g., "15/30 slots")

### FR-006: Item Usage
The system MUST:
- Allow using consumable items
- Decrement item count on use
- Remove item when count reaches zero
- Apply item effects (healing, buffs)

---

## Key Entities

### Inventory Item
- **id** (integer, primary key): Unique inventory entry ID
- **character_id** (integer, foreign key): Owner character
- **item_name** (string): Item identifier
- **quantity** (integer): Item count (default 1)
- **properties** (JSON): Item-specific metadata
- **created_at** (timestamp): Acquisition time

**Relationships:**
- One character has many inventory items
- Inventory items reference item definitions (future: items table)

---

## Item Types

### Equipment
- Weapons (weapon_waraxe, weapon_sword)
- Armor (torso_armor_plate_iron, torso_armor_leather)
- Accessories (future)

**Stackability:** No (each piece is unique)

### Consumables
- Potions (health_potion, mana_potion)
- Food (bread, meat)
- Scrolls (teleport_scroll)

**Stackability:** Yes (max 99 per stack)

### Resources
- Crafting materials (iron_ore, wood, leather)
- Currency (gold coins)

**Stackability:** Yes (max 999 per stack)

### Quest Items
- Special items for quests
- Cannot be dropped/traded

**Stackability:** No

---

## Success Criteria

### SC-001: Data Integrity
- Inventory items always reference valid character (foreign key)
- Item quantities never negative
- Duplicate item entries for non-stackables are allowed (different instances)
- Database constraints prevent orphaned items

### SC-002: Performance
- Inventory loads within 1 second
- Item pickup updates UI within 200ms
- Database writes complete within 5 seconds
- Inventory UI rendering scales to 30+ items without lag

### SC-003: User Experience
- Inventory toggle is smooth (no flicker)
- Items visually distinct and readable
- Empty inventory clearly indicates no items
- Inventory doesn't cover critical UI elements

### SC-004: Reliability
- Zero item duplication bugs
- Zero item loss (except through intended usage/deletion)
- Network failures don't corrupt inventory state
- Logout during item changes doesn't lose items

---

## Non-Functional Requirements

### Security
- Players cannot access other characters' inventories
- Item acquisition validated server-side (not client-trusted)
- Item quantities validated (no negative or overflow values)

### Scalability
- Supports 30+ unique items per character
- Database indexed by character_id for fast lookup
- Stackable items reduce database rows

### Compatibility
- Inventory UI responsive to window resize
- Works with future drag-and-drop enhancement
- Compatible with future item trading system

---

## Out of Scope

- Item trading between players (future feature)
- Item dropping/deletion (future feature)
- Item sorting/filtering (future feature)
- Item drag-and-drop rearrangement (future feature)
- Item tooltips with detailed stats (future enhancement)
- Item icons/sprites (currently text-based)

---

## Dependencies

- Character management system (inventory per character)
- PostgreSQL database (inventory table)
- Client UI framework for inventory display
- Item definition system (currently in equipment-registry.js)

---

## Acceptance Checklist

- [ ] Inventory displays all character items
- [ ] Items persist across logout/login
- [ ] Item pickup adds item to inventory immediately
- [ ] Stackable items increment count (not duplicate entries)
- [ ] Inventory full prevents item pickup (shows error)
- [ ] Inventory toggle works (open/close)
- [ ] Empty inventory shows appropriate message
- [ ] Item quantities display correctly
- [ ] Inventory loads within 1 second
- [ ] Items validated per character (security)

---

## UI Specifications

### Inventory Container
- **Position:** Bottom-right corner of game screen
- **Dimensions:** 300px width, collapsible height
- **Behavior:** Toggle with "-" button in header

### Item Display
- **Layout:** Grid with 5-6 items per row
- **Item Size:** 50x50px per slot
- **Content:** Item name, quantity (if > 1)

### Visual States
- **Normal:** Standard item display
- **Empty:** "Inventory is empty" message
- **Full:** Visual indication when at capacity

---

## Database Schema

```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_character ON inventory(character_id);
```

---

## Related Documentation

- Database schema: `database/schema.sql` (inventory table)
- Server endpoints: `server/index.js` (inventory routes)
- Client UI: `client/index.html` (inventory-container)
- Item definitions: `client/equipment-registry.js` (equipment items)

---

**Specification Author:** Claude Sonnet 4.5
**Reviewed By:** Pending
**Approved By:** Pending
