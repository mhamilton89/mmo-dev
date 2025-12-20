# Adding New Equipment - Quick Guide

The equipment system is now fully dynamic and scalable. Adding hundreds of weapons and armor is as simple as adding entries to a registry file!

## Quick Start (3 Steps)

### Step 1: Add Your Sprite Sheet
Place your LPC-format sprite sheet in the appropriate folder:
- **Armor**: `client/assets/equipment/[armor_name].png`
- **Weapons**: `client/assets/equipment/[weapon_name].png`

**Requirements:**
- LPC format sprite sheet (1152x4224 pixels, 18 columns)
- Directional walk animations in rows 8-11
- Frame size: 64x64 pixels

### Step 2: Register in equipment-registry.js
Add ONE entry to `EQUIPMENT_REGISTRY` in `client/equipment-registry.js`:

```javascript
weapon_longsword: {
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_longsword.png',
    spriteLayout: 'lpc_standard',
    depth: 102
},
```

**That's it!** The system will automatically:
- ✅ Load the sprite sheet
- ✅ Create all directional walk animations (up, down, left, right)
- ✅ Create all directional idle animations
- ✅ Handle rendering during walk and idle states
- ✅ Manage depth layering
- ✅ Sync with character animations

### Step 3: Update Database (Optional)
If you want to add database validation:

```sql
-- For weapons
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_weapon_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_weapon_check
CHECK (slot != 'weapon' OR item_name IN ('weapon_waraxe', 'weapon_longsword'));

-- For armor
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_armor_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_armor_check
CHECK (slot != 'armor' OR item_name IN ('torso_armor_plate_iron', 'torso_armor_leather'));
```

## Example: Adding 10 Weapons

```javascript
// In equipment-registry.js, just add these entries:

const EQUIPMENT_REGISTRY = {
    // Existing equipment...
    torso_armor_plate_iron: { /* ... */ },
    weapon_waraxe: { /* ... */ },

    // Add your 10 new weapons:
    weapon_longsword: {
        type: 'weapon',
        slot: 'weapon',
        file: 'assets/equipment/weapon_longsword.png',
        spriteLayout: 'lpc_standard',
        depth: 102
    },
    weapon_dagger: {
        type: 'weapon',
        slot: 'weapon',
        file: 'assets/equipment/weapon_dagger.png',
        spriteLayout: 'lpc_standard',
        depth: 102
    },
    weapon_staff: {
        type: 'weapon',
        slot: 'weapon',
        file: 'assets/equipment/weapon_staff.png',
        spriteLayout: 'lpc_standard',
        depth: 102
    },
    // ... 7 more weapons ...
};
```

Done! All 10 weapons will work automatically.

## Registry Entry Reference

```javascript
equipment_name: {
    type: 'weapon' | 'armor',           // Equipment type
    slot: 'weapon' | 'armor',            // Equipment slot
    file: 'assets/equipment/name.png',   // Path to sprite sheet
    spriteLayout: 'lpc_standard',        // Layout format (see below)
    depth: 102                           // Optional: custom render depth
}
```

### Sprite Layout Types

**lpc_standard** (Default):
- Dimensions: 1152x4224 pixels
- Frame size: 64x64
- Columns: 18
- Walk animations: rows 8-11 (up, down, left, right)
- 9 frames per walk animation
- Idle: first frame of each walk row

## Equipment Properties

### Depth Layering
Equipment renders in layers:
- **100**: Base character
- **101**: Armor (default)
- **102**: Weapons (default)

Override depth in registry:
```javascript
special_shield: {
    type: 'armor',
    slot: 'armor',
    file: 'assets/equipment/special_shield.png',
    spriteLayout: 'lpc_standard',
    depth: 103  // Renders above weapons
}
```

## Testing New Equipment

Create a test script to equip items:

```javascript
// database/equip_test.js
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });

async function equipItem() {
    const result = await pool.query(
        `UPDATE equipment
         SET item_name = 'weapon_longsword'
         WHERE character_id = (SELECT id FROM characters WHERE name = 'testchar')
         AND slot = 'weapon'`
    );
    console.log('Equipped!');
    await pool.end();
}

equipItem();
```

Run: `node database/equip_test.js`

## Advanced: Custom Sprite Layouts

If you have non-standard sprite sheets, add a new layout to `SPRITE_LAYOUTS`:

```javascript
const SPRITE_LAYOUTS = {
    lpc_standard: { /* existing */ },

    custom_layout: {
        frameWidth: 64,
        frameHeight: 64,
        expectedWidth: 832,
        expectedHeight: 3456,
        expectedColumns: 13,

        walkAnimations: {
            up: { row: 0, frames: 9 },
            down: { row: 1, frames: 9 },
            left: { row: 2, frames: 9 },
            right: { row: 3, frames: 9 }
        },

        idleAnimations: {
            up: { row: 0, frame: 0 },
            down: { row: 1, frame: 0 },
            left: { row: 2, frame: 0 },
            right: { row: 3, frame: 0 }
        },

        defaultDirection: 'down',
        defaultDepth: {
            armor: 101,
            weapon: 102
        }
    }
};
```

Then use it:
```javascript
weapon_special: {
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_special.png',
    spriteLayout: 'custom_layout',  // Use your custom layout
    depth: 102
}
```

## Troubleshooting

### Equipment doesn't appear
1. Check sprite sheet is in correct folder
2. Verify equipment name matches exactly in database and registry
3. Check browser console for loading errors
4. Verify sprite sheet dimensions (should be 1152x4224 for lpc_standard)

### Equipment appears but doesn't animate
1. Confirm rows 8-11 have animations in your sprite sheet
2. Check console for animation creation messages
3. Verify `spriteLayout` is set correctly

### Equipment animates but wrong direction
1. Verify row layout matches your sprite sheet
2. Check if you need a custom sprite layout
3. Ensure sprite sheet uses LPC standard (rows 8-11 for directions)

## Key Files

- **Registry**: `client/equipment-registry.js` - Add all equipment here
- **Manager**: `client/equipment-registry.js` - EquipmentManager class (don't modify)
- **Game**: `client/game.js` - Uses EquipmentManager (don't modify equipment code)
- **Database**: Equipment stored in `equipment` table with `item_name` matching registry keys

## Benefits of Dynamic System

✅ **Scalable**: Add hundreds of items easily
✅ **No code changes**: Just edit registry file
✅ **Automatic**: Loading, animations, rendering all handled
✅ **Type-safe**: Equipment manager validates everything
✅ **Maintainable**: All equipment in one place
✅ **Flexible**: Support custom layouts

## Migration from Old System

Old hardcoded equipment is automatically compatible. The system now handles:
- `torso_armor_plate_iron` ✅
- `weapon_waraxe` ✅

Just add new equipment to the registry and they'll work the same way!
