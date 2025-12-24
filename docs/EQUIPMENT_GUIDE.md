# Equipment System Guide

This guide explains how to add new weapons and armor to the game.

## Understanding Equipment Sprite Sheets

### LPC Format
All equipment uses the **Liberated Pixel Cup (LPC)** sprite sheet format. These are sprite sheets with specific row layouts for different animations.

### Critical Requirements

1. **Equipment sprite sheets MUST use rows 8-11** for directional walk animations to properly sync with character animations
2. **All equipment must have the same column count as specified in their config** (typically 18 columns for 1152px wide sheets)
3. **Frame size is 64x64 pixels**

### Row Layout (Rows 8-11)
- **Row 8**: Walking UP (north)
- **Row 9**: Walking DOWN (south)
- **Row 10**: Walking LEFT (west)
- **Row 11**: Walking RIGHT (east)

Each row contains **9 frames** for the walk animation cycle.

## Adding New Equipment

### Step 1: Prepare the Sprite Sheet

1. **Ensure correct dimensions**:
   - Width: 1152 pixels (18 columns × 64px)
   - Height: 4224 pixels (66 rows × 64px)

2. **Verify row layout**:
   - Walk animations MUST be in rows 8-11
   - If your sprite sheet has animations in rows 0-3, you need to move them to rows 8-11

3. **Save the file**:
   - Armor: `client/assets/equipment/[armor_name].png`
   - Weapons: `client/assets/equipment/[weapon_name].png`

### Step 2: Add to Database Schema

Update `database/schema.sql` to allow the new equipment name in the CHECK constraint:

```sql
-- For armor
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_armor_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_armor_check
CHECK (slot != 'armor' OR item_name IN ('torso_armor_plate_iron', 'your_new_armor'));

-- For weapons
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_weapon_check;
ALTER TABLE equipment ADD CONSTRAINT equipment_weapon_check
CHECK (slot != 'weapon' OR item_name IN ('weapon_waraxe', 'your_new_weapon'));
```

### Step 3: Add to Configuration

Edit `client/equipment-registry.js` in the EQUIPMENT_REGISTRY object:

```javascript
// For armor
torso_armor_new_item: {
    type: 'armor',
    slot: 'armor',
    file: 'assets/equipment/torso_armor_new_item.png',
    spriteLayout: 'lpc_armor'  // 13 cols for armor without attack animations
},

// For weapons (standard)
weapon_new_sword: {
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_new_sword.png',
    spriteLayout: 'lpc_standard',  // 18 cols
    depth: 200
},

// For weapons with oversize attack animations
weapon_new_greataxe: {
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_new_greataxe.png',
    spriteLayout: 'lpc_standard',
    depth: 200,
    hasOversizeAttack: true,  // Enable 192x192 attack frames
    attackSpeed: 6,  // Slow 2-hander
    attackFrames: {
        up: [108, 109, 110, 111, 112, 113],     // row 18 * 6 cols
        left: [114, 115, 116, 117, 118, 119],   // row 19 * 6 cols
        down: [120, 121, 122, 123, 124, 125],   // row 20 * 6 cols
        right: [126, 127, 128, 129, 130, 131]   // row 21 * 6 cols
    },
    idleFrames: { up: 144, down: 162, left: 180, right: 198 }
}
```

**That's it!** The EquipmentManager automatically:
- Loads the sprite sheet
- Creates walk/idle animations
- Handles directional rendering

No manual preload or animation creation needed!

### Step 5: Create Animations in game.js

Add to the `createEquipmentAnimations()` method (around line 820):

```javascript
// For the new equipment
const newEquipmentTexture = this.textures.get('your_equipment_name');
if (newEquipmentTexture && newEquipmentTexture.key !== '__MISSING') {
    const source = newEquipmentTexture.source[0];
    const cols = Math.floor(source.width / frameWidth);

    // Create walk animations for rows 8-11
    const getWalkFrameRange = (direction, frameCount) => {
        const directionRow = { up: 0, down: 1, left: 2, right: 3 }[direction];
        const row = 8 + directionRow; // Rows 8-11
        const start = row * cols;
        const end = start + frameCount - 1;
        return { start, end };
    };

    ['up', 'left', 'down', 'right'].forEach(dir => {
        const range = getWalkFrameRange(dir, 9);
        this.createSafeAnimation(`your_equipment_name_walk_${dir}`, 'your_equipment_name', range.start, range.end, 10);
    });

    // Create idle animations (first frame of each walk row)
    const idleMapping = { up: 8, down: 9, left: 10, right: 11 };
    ['up', 'left', 'down', 'right'].forEach(dir => {
        const row = idleMapping[dir];
        const idleFrame = row * cols;
        this.createSafeAnimation(`your_equipment_name_idle_${dir}`, 'your_equipment_name', idleFrame, idleFrame, 10);
    });
}
```

### Step 6: Handle Equipment in Walk Animations

In the `update()` method where walk animations are handled (around line 1454), add:

```javascript
if (this.player.yourEquipmentLayer) {
    this.player.yourEquipmentLayer.setVisible(true);
    const equipAnimKey = `your_equipment_name_walk_${animDirection}`;
    if (this.anims.exists(equipAnimKey)) {
        this.player.yourEquipmentLayer.anims.play(equipAnimKey, true);
    }
}
```

### Step 7: Handle Equipment in Idle State

In the idle state handling (around line 1525), add:

```javascript
if (this.player.yourEquipmentLayer) {
    const idleAnimKey = `your_equipment_name_idle_${animDirection}`;
    this.player.yourEquipmentLayer.setVisible(true);
    if (this.anims.exists(idleAnimKey)) {
        this.player.yourEquipmentLayer.anims.play(idleAnimKey, true);
    }
}
```

## Testing New Equipment

### Create a Test Script

Create `database/equip_[item]_to_[character].js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'mmo_game',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
});

async function equipItem() {
    try {
        // Find character
        const charResult = await pool.query(
            `SELECT id, name, class FROM characters WHERE name = 'your_character_name'`
        );

        if (charResult.rows.length === 0) {
            console.log('❌ Character not found');
            return;
        }

        const character = charResult.rows[0];

        // Equip item
        const result = await pool.query(
            `INSERT INTO equipment (character_id, slot, item_name, properties)
             VALUES ($1, $2, $3, '{}')
             ON CONFLICT (character_id, slot)
             DO UPDATE SET item_name = $3, properties = '{}'
             RETURNING *`,
            [character.id, 'weapon', 'your_equipment_name'] // or 'armor' for armor
        );

        console.log('✅ Equipment added:', result.rows[0]);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

equipItem();
```

Run: `node database/equip_[item]_to_[character].js`

## Common Issues

### Issue: Equipment doesn't appear at all
- **Check**: Is the sprite sheet loaded? Look for the filename in console during preload
- **Check**: Are you using the correct item_name in the database?
- **Check**: Is the equipment layer being created? Add console.log in createPlayer

### Issue: Equipment appears during walk but not idle
- **Check**: Is the idle animation being played? Check console logs
- **Check**: Are you calling `setVisible(true)` in the idle state handler?
- **Check**: Is the idle animation using rows 8-11?

### Issue: Equipment appears but at wrong position/direction
- **Check**: Are rows 8-11 populated in your sprite sheet?
- **Check**: Is the column count correct (should be 18 for 1152px width)?
- **Check**: Are you calculating frames as `row * columns`?

### Issue: Equipment animations don't sync with character
- **Solution**: Equipment MUST use rows 8-11. If your sprite sheet uses rows 0-3, move the animations to rows 8-11

## Key Learnings from weapon_waraxe Implementation

1. **Sprite sheet dimensions matter**: The actual file dimensions determine column count, not what you expect
2. **Use `Math.floor(source.width / frameWidth)` to calculate columns** from the actual texture
3. **Always verify sprite sheet dimensions** with `file client/assets/equipment/[name].png`
4. **Idle animations should be single-frame animations** that play the first frame of each directional walk row
5. **Always call `setVisible(true)` before playing animations** to ensure the sprite renders
6. **Equipment depth layering**: weapon (102) > armor (101) > character (100)

## Reference

- LPC Sprite Sheet Format: https://lpc.opengameart.org/
- Current working equipment: `weapon_waraxe`, `torso_armor_plate_iron`
- Configuration file: `client/equipment-registry.js`
