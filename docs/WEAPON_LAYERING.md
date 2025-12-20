# Weapon Layering Issue & Solutions

## The Problem

Weapons currently render **behind** the character's hands/body because the LPC character sprite sheets have the body and hands baked into a single texture.

**Current Render Order:**
- Depth 100: Character sprite (includes body + hands as one image)
- Depth 101: Armor
- Depth 200: Weapon ❌ *Still appears behind because hands are part of character texture*

## Why Depth Doesn't Fix It

Phaser renders sprites by depth, but if the character's **hands are part of the base character texture**, they will always appear in front of the weapon, regardless of depth settings.

Think of it like this:
```
Character Texture at Depth 100 = [Body + Hands + Arms all in one image]
Weapon at Depth 200 = Separate sprite

Result: Character texture (including hands) blocks the weapon
```

## Solutions

### Solution 1: Use LPC Sprites with Separate Hand Layers (RECOMMENDED)

LPC format supports layered sprites:

**Proper LPC Layer Structure:**
1. **Body Base** (depth 100) - Torso, legs, NO hands
2. **Armor** (depth 101) - Body armor
3. **Weapon** (depth 200) - The weapon
4. **Hands Overlay** (depth 201) - Hands that go OVER the weapon

**Where to get proper LPC sprites:**
- https://lpc.opengameart.org/
- Look for "Universal LPC Spritesheet Character Generator"
- Generate sprites with separate "hands" layer

**Implementation:**
```javascript
// In equipment-registry.js, add hand overlays:
const EQUIPMENT_REGISTRY = {
    // ...existing equipment...

    // Add hand overlays
    hands_male: {
        type: 'overlay',
        slot: 'hands',
        file: 'assets/characters/hands_male.png',
        spriteLayout: 'lpc_standard',
        depth: 201  // Above weapons
    }
};
```

### Solution 2: Accept Current Behavior (EASIEST)

Many 2D games have weapons that appear slightly behind hands. This is acceptable for:
- Top-down perspective games
- Pixel art games with simple sprites
- Games where weapon visibility isn't critical

**Pros:**
- No sprite sheet changes needed
- Works with current assets
- Simple to maintain

**Cons:**
- Weapons less visible
- Looks less professional

### Solution 3: Modify Character Sprites (ADVANCED)

Manually edit character sprite sheets to remove hands and create separate hand overlays.

**Steps:**
1. Open character sprite sheets in image editor
2. Remove/erase the hands from each frame
3. Create new sprite sheet with just hands
4. Add hand overlay to equipment system

**Tools needed:**
- GIMP, Photoshop, or Aseprite
- Knowledge of pixel art editing

**Time required:** 1-2 hours per character class

### Solution 4: Offset Weapons (WORKAROUND)

Adjust weapon position to make it more visible:

```javascript
weapon_waraxe: {
    type: 'weapon',
    slot: 'weapon',
    file: 'assets/equipment/weapon_waraxe.png',
    spriteLayout: 'lpc_standard',
    depth: 200,
    offsetX: 2,   // Shift right
    offsetY: -3   // Shift up
}
```

This doesn't fix layering but can make weapons more visible.

## Recommended Action

**For production game:**
Use **Solution 1** - Get LPC sprites with separate hand layers from the LPC generator.

**For prototype/testing:**
Use **Solution 2** - Accept current behavior and add hand layers later.

**Quick test:**
If you want to test Solution 1 without rebuilding sprites, try setting the character sprite to have transparent hands in one frame and see if the weapon appears.

## Implementation Checklist for Solution 1

- [ ] Download LPC Universal Sprite Generator
- [ ] Generate character sprites WITHOUT hands baked in
- [ ] Generate separate hand overlay sprites
- [ ] Replace current character sprites
- [ ] Add hand overlays to equipment registry with depth 201
- [ ] Update player creation to add hand layer
- [ ] Test weapon visibility

## Current Status

**Status:** Weapons render at depth 200 but appear behind character hands
**Limitation:** Character sprite has hands baked into texture
**Workaround:** Offset weapons or accept current behavior
**Proper Fix:** Use LPC sprites with separate hand layers
