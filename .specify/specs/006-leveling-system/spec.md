# Leveling System Specification

**Version**: 1.0
**Status**: Draft
**Author**: Claude
**Created**: 2026-01-19

---

## 1. Overview

### 1.1 Purpose
Implement a complete character progression system that rewards players for combat and resource gathering activities through experience points (XP) and level advancement.

### 1.2 Goals
- Provide clear progression feedback through XP gains and level-ups
- Encourage group play through favorable XP sharing mechanics
- Prevent low-level content farming through level scaling
- Integrate seamlessly with existing class and stat systems
- Support offline progression (level-ups while disconnected)

### 1.3 Non-Goals
- Skill trees or talent point allocation (future feature)
- Level-based equipment restrictions (future feature)
- Prestige or level reset systems (future feature)
- Experience multipliers/boosters (future feature)

---

## 2. System Design

### 2.1 XP Curve Formula

**Type**: Quadratic progression
**Formula**: `XP_required(level) = 100 × (level - 1)²`

**Rationale**: Quadratic curves provide fast early progression while creating meaningful long-term goals at higher levels.

**Level Progression Table**:

| Level | XP Required | Cumulative XP | Time to Level* |
|-------|-------------|---------------|----------------|
| 1→2   | 100         | 100           | ~1 enemy      |
| 2→3   | 300         | 400           | ~4 enemies    |
| 3→4   | 600         | 1,000         | ~8 enemies    |
| 5→6   | 1,600       | 4,100         | ~21 enemies   |
| 10→11 | 8,100       | 28,900        | ~108 enemies  |
| 20→21 | 36,100      | 133,100       | ~481 enemies  |
| 49→50 | 230,400     | 117,600       | ~3,072 enemies|

*Approximate, based on level-appropriate content (100 XP per enemy)

### 2.2 Level Cap

**Maximum Level**: 50
**Enforcement**:
- Server-side: `checkLevelUp()` stops at level 50
- Client-side: XP bar displays "MAX LEVEL" at level 50
- Database: Continues storing XP beyond level 50 for future cap increases

---

## 3. XP Sources

### 3.1 Combat XP

#### 3.1.1 Base Calculation
```javascript
baseXP = 100 × enemy.level
```

**Examples**:
- Level 1 Skeleton: 100 XP
- Level 5 Bandit: 500 XP
- Level 10 Dragon: 1000 XP

#### 3.1.2 Group Sharing
Each player who damages the enemy receives **75% of base XP** (not split).

**Rationale**: Encourages group play without excessive XP inflation. Players get most of the XP but slightly less than solo to balance the safety of group play.

**Examples**:
- Solo player kills level 1 enemy: 75 XP
- Two players kill level 1 enemy: Each gets 75 XP (150 XP total generated)
- Five players kill level 5 enemy: Each gets 375 XP (1,875 XP total generated)

#### 3.1.3 Level Scaling

**Purpose**: Prevent high-level players from farming low-level content efficiently.

**Formula**:
```javascript
function calculateLevelScaling(playerLevel, enemyLevel) {
    const levelDiff = playerLevel - enemyLevel;

    if (levelDiff <= 0) return 1.0;   // Full XP (equal or higher level enemy)
    if (levelDiff <= 2) return 0.8;   // 80% XP (2 levels above)
    if (levelDiff <= 4) return 0.5;   // 50% XP (4 levels above)
    if (levelDiff <= 6) return 0.25;  // 25% XP (6 levels above)
    if (levelDiff <= 8) return 0.1;   // 10% XP (8 levels above)
    return 0;                          // 0% XP (9+ levels above)
}
```

**Final Combat XP**:
```javascript
finalXP = Math.floor(baseXP × 0.75 × scalingMultiplier)
```

### 3.2 Gathering XP

#### 3.2.1 Base Calculation
```javascript
baseXP = 20 × resource.minSkillLevel
```

**Examples**:
- Level 1 Oak Tree: 20 XP
- Level 3 Iron Ore: 60 XP
- Level 5 Rare Herb: 100 XP

#### 3.2.2 Level Scaling
Uses same `calculateLevelScaling()` function as combat, comparing player level to `resource.minSkillLevel`.

**Final Gathering XP**:
```javascript
finalXP = Math.floor(baseXP × scalingMultiplier)
```

**Rationale**: No 75% multiplier like combat since gathering is solo activity.

---

## 4. Stat Progression

### 4.1 Class Growth Rates

**Requirement**: All growth values must be whole numbers (no decimals).

#### 4.1.1 Warrior
```javascript
growth: {
    health: 12,
    mana: 2,
    strength: 3,        // Changed from 2.5
    intelligence: 1,    // Changed from 0.5
    dexterity: 1,
    vitality: 2,
    stamina: 2
}
```

**Per-Level Gains**: +3 STR (+6 attack_power), +2 stamina (+20 max_health)

#### 4.1.2 Wizard
```javascript
growth: {
    health: 5,
    mana: 15,
    strength: 1,        // Changed from 0.4
    intelligence: 3,
    dexterity: 1,       // Changed from 0.8
    vitality: 1,        // Changed from 0.8
    stamina: 1          // Changed from 0.8
}
```

**Per-Level Gains**: +3 INT (+6 magic_power, +30 max_mana), +1 stamina (+10 max_health)

#### 4.1.3 Paladin
```javascript
growth: {
    health: 10,
    mana: 8,
    strength: 2,        // Changed from 1.8
    intelligence: 2,    // Changed from 1.8
    dexterity: 1,       // Changed from 0.8
    vitality: 2,
    stamina: 2          // Changed from 1.5
}
```

**Per-Level Gains**: +2 STR (+4 attack_power), +2 INT (+4 magic_power, +20 max_mana), +2 stamina (+20 max_health)

#### 4.1.4 Rogue
```javascript
growth: {
    health: 7,
    mana: 4,
    strength: 2,        // Changed from 1.5
    intelligence: 1,    // Changed from 0.8
    dexterity: 3,
    vitality: 1,        // Changed from 1.2
    stamina: 1          // Changed from 1.2
}
```

**Per-Level Gains**: +3 DEX, +2 STR (+4 attack_power), +1 stamina (+10 max_health)

### 4.2 Derived Stat Formulas

**Existing formulas** (no changes):
- Attack Power: `strength × 2`
- Magic Power: `intelligence × 2`
- Max Mana Bonus: `intelligence × 10`
- Max Health Bonus: `stamina × 10`

---

## 5. Level-Up Mechanics

### 5.1 Trigger Conditions

A level-up occurs when:
```javascript
character.experience >= getTotalXPForLevel(character.level + 1)
```

**Multiple Level-Ups**: System must support gaining multiple levels from a single XP award (e.g., massive XP gain or offline progression).

### 5.2 Level-Up Process

**Order of Operations**:
1. Detect level-up condition
2. Calculate new level (may be multiple levels)
3. Recalculate ALL stats using `calculateStats(class, newLevel)`
4. Update database with new level, XP, and all attributes
5. **Restore health and mana to new maximum values**
6. Update in-memory player state (`activePlayers` Map)
7. Update player character object for future calculations
8. Send `levelUp` event to player
9. Broadcast `playerLevelUp` event to all connected players
10. Log level-up to server console

### 5.3 Offline Level-Up

**Trigger**: On player login via `handlePlayerJoin()`

**Process**:
1. Check if `character.experience >= required XP for next level`
2. If true, perform full level-up process (stat recalculation, DB update)
3. Update character object BEFORE adding to `activePlayers`
4. Client receives updated stats in `init` message

**Rationale**: Ensures players don't miss level-ups due to disconnects or server restarts.

---

## 6. API Contracts

### 6.1 Server-to-Client Messages

#### 6.1.1 XP Gain (No Level-Up)
```javascript
{
    type: 'xpGain',
    experience: 450,        // New total XP
    xpGained: 75           // Amount gained this action
}
```

**Trigger**: Player gains XP but doesn't level up
**Client Action**: Update XP bar, show "+75 XP" notification

#### 6.1.2 Level-Up
```javascript
{
    type: 'levelUp',
    level: 5,                    // New level
    levelsGained: 1,             // Number of levels gained (can be > 1)
    experience: 4100,            // New total XP
    stats: {
        strength: 26,
        intelligence: 9,
        dexterity: 14,
        vitality: 18,
        stamina: 19,
        max_health: 348,
        max_mana: 140,
        attack_power: 52,
        magic_power: 18
    }
}
```

**Trigger**: Player levels up
**Client Action**: Show level-up popup, update HUD, update character state, restore health/mana to max

#### 6.1.3 Other Player Level-Up
```javascript
{
    type: 'playerLevelUp',
    playerId: 'char_123',
    playerName: 'Thorgar',
    level: 10
}
```

**Trigger**: Another player in the world levels up
**Client Action**: Display chat message "[Thorgar] reached level 10!"

### 6.2 Database Schema

**No schema changes required**. Existing fields:
- `level INTEGER DEFAULT 1`
- `experience INTEGER DEFAULT 0`
- All attribute columns (strength, intelligence, etc.)

---

## 7. Module Architecture

### 7.1 New Module: `server/experienceSystem.js`

**Purpose**: Centralized XP calculation logic

**Exports**:
```javascript
module.exports = {
    getXPRequiredForLevel(level),      // Returns XP for specific level
    getTotalXPForLevel(level),         // Returns cumulative XP to reach level
    calculateLevelScaling(pLevel, cLevel), // Returns multiplier 0.0-1.0
    calculateGroupXP(baseXP),          // Returns baseXP × 0.75
    checkLevelUp(currentLevel, currentXP) // Returns {leveled, newLevel, levelsGained}
};
```

**Dependencies**: None (pure math functions)

### 7.2 Modified Module: `server/index.js`

**New Exports** (add to existing):
```javascript
module.exports = {
    activePlayers,  // Map<characterId, playerObject>
    handleLevelUp,  // async function(player, xpGained)
    broadcast       // function(message)
};
```

**New Function**: `handleLevelUp(player, xpGained)`
- **Parameters**:
  - `player`: Player object from `activePlayers` Map
  - `xpGained`: Amount of XP to award
- **Returns**: `Promise<boolean>` - true if leveled up, false otherwise
- **Side Effects**: Updates database, modifies player object, sends WebSocket messages

### 7.3 Modified Module: `server/resourceGathering.js`

**New Imports**:
```javascript
const { calculateLevelScaling } = require('./experienceSystem');
const { activePlayers, handleLevelUp } = require('./index');
```

**Modification Location**: `handleGatherComplete()` function, after line 125 (after inventory update success)

---

## 8. UI/UX Specifications

### 8.1 XP Progress Bar

**Location**: Main HUD, below player info line

**Components**:
- Background bar (dark brown, 20px height)
- Fill bar (green gradient, animates on change)
- Text overlay (white, shows "XP: current / required")

**Behavior**:
- Updates immediately on `xpGain` message
- Animates fill width change over 0.3s
- Shows "MAX LEVEL" at level 50
- Resets to 0% on level-up, then fills to current progress in new level

**Visual Design**:
```
┌─────────────────────────────────────────────┐
│████████████░░░░░░░░░░░░░░░░░░░  XP: 450/600│
└─────────────────────────────────────────────┘
```

### 8.2 Level-Up Popup

**Trigger**: `levelUp` message received

**Duration**: 3 seconds (fade in 0.5s, display 2s, fade out 0.5s)

**Layout**:
```
╔═══════════════════════════════════╗
║         ⭐ LEVEL UP! ⭐           ║
║                                   ║
║              25                   ║
║                                   ║
║      You gained 1 level!          ║
║  Health and mana fully restored   ║
╚═══════════════════════════════════╝
```

**Visual Effects**:
- Background: Purple/blue gradient with gold border
- "LEVEL UP!" text: Gold color, pulsing animation
- Level number: Large white text (72px)
- Popup scales from 0.8 to 1.0 on appear

**Accessibility**:
- Popup doesn't block gameplay input
- Fades automatically (no dismiss button required)
- Multiple level-ups show single popup with final level

### 8.3 Chat Notifications

**Own Level-Up**:
```
[SYSTEM] LEVEL UP! You are now level 25!
```
- Color: System yellow/gold
- Bold text

**Other Player Level-Up**:
```
[SYSTEM] Thorgar reached level 10!
```
- Color: System yellow/gold
- Normal text

---

## 9. Testing Requirements

### 9.1 Unit Tests

#### XP Formula Tests
- `getXPRequiredForLevel(2)` returns 100
- `getXPRequiredForLevel(10)` returns 8,100
- `getTotalXPForLevel(3)` returns 400
- `getTotalXPForLevel(50)` returns correct cumulative XP

#### Level Scaling Tests
- Player level = enemy level → multiplier = 1.0
- Player level = enemy level + 9 → multiplier = 0.0
- Player level < enemy level → multiplier = 1.0

#### Level-Up Detection Tests
- 99 XP at level 1 → no level-up
- 100 XP at level 1 → level-up to 2
- 1,000 XP at level 1 → level-up to 3 (multiple levels)
- 250,000 XP at level 49 → level-up to 50 (not 51)

### 9.2 Integration Tests

#### Combat XP Flow
1. Create level 1 player
2. Kill level 1 enemy
3. Verify player received 75 XP in database
4. Verify `xpGain` message sent to client

#### Gathering XP Flow
1. Create level 1 player
2. Gather level 5 resource
3. Verify player received 100 XP
4. Verify items added to inventory AND XP awarded

#### Level-Up Flow
1. Create level 1 player with 50 XP
2. Award 50 XP (total 100, should level up)
3. Verify player level = 2 in database
4. Verify stats recalculated (strength increased)
5. Verify health = max_health (restored)
6. Verify `levelUp` message sent

#### Offline Level-Up
1. Create level 1 player with 100 XP in database
2. Connect with that player
3. Verify player receives `init` message with level = 2
4. Verify stats are correct for level 2

### 9.3 Manual Testing Scenarios

| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| Basic Combat XP | Kill 1 enemy as level 1 | Gain 75 XP, XP bar updates |
| Level-Up | Kill 2nd enemy (150 total XP) | Level-up popup, stats increase, HP/MP full |
| Group XP | 2 players kill enemy together | Each gets 75 XP |
| Level Scaling - High | Level 10 kills level 1 enemy | Gain 0 XP |
| Level Scaling - Low | Level 1 kills level 5 enemy | Gain full XP (375) |
| Gathering XP | Harvest level 3 resource | Gain 60 XP |
| Multiple Level-Ups | Admin command: award 10,000 XP at level 1 | Level-up to level 9 or 10, single popup |
| Max Level | Reach level 50 | XP bar shows "MAX LEVEL", no more level-ups |
| Other Player Notification | Another player levels up | See "[Name] reached level X!" in chat |
| XP Bar Accuracy | Gain XP without leveling | Bar percentage matches formula |

---

## 10. Performance Considerations

### 10.1 Database Operations

**Per XP Gain** (no level-up): 1 UPDATE query
**Per Level-Up**: 1 UPDATE query (includes all stat updates)
**Optimization**: All stat updates in single query (no N+1 problem)

### 10.2 Memory

**Minimal Impact**: Uses existing `activePlayers` Map, no new data structures

### 10.3 Network

**Message Sizes**:
- `xpGain`: ~50 bytes
- `levelUp`: ~200 bytes
- `playerLevelUp`: ~80 bytes

**Broadcast Frequency**:
- `playerLevelUp` broadcasts only on level-up (rare event)
- No XP synchronization needed for other players

---

## 11. Edge Cases

### 11.1 Multiple Simultaneous Level-Ups
**Scenario**: Player gains 10,000 XP at level 1
**Handling**: `checkLevelUp()` loops until no more levels gained
**Result**: Single level-up popup showing final level

### 11.2 Level Cap Enforcement
**Scenario**: Player at level 50 gains XP
**Handling**: XP stored in database, level stays at 50
**Result**: Allows future level cap increases without data loss

### 11.3 Disconnected Player in Combat
**Scenario**: Player disconnects mid-fight, party kills enemy
**Handling**: XP only awarded to players in `activePlayers` Map
**Result**: Disconnected player doesn't receive XP (expected behavior)

### 11.4 Offline XP Accumulation
**Scenario**: Player has 99 XP, disconnect, admin grants 100 XP via DB edit
**Handling**: `handlePlayerJoin()` checks level-up condition
**Result**: Player levels up on next login

### 11.5 Negative XP
**Scenario**: Malicious client sends negative XP value
**Handling**: Server validation (optional enhancement)
**Result**: XP cannot decrease (deaths don't lose XP per design)

### 11.6 Resource Gathering by Max Level Player
**Scenario**: Level 50 player harvests level 1 resource
**Handling**: Level scaling returns 0.0 multiplier
**Result**: No XP gained, items still harvested

---

## 12. Migration Strategy

### 12.1 Existing Characters

**Issue**: Existing characters may have incorrect stats from old formulas

**Solution**: Not required initially (start with new character testing)

**Future Migration** (if needed):
```sql
-- Recalculate all character stats
-- Run via migration script, not in production code
UPDATE characters SET
    strength = base_strength + (growth_strength * (level - 1)),
    -- ... repeat for all attributes
WHERE level > 1;
```

### 12.2 Backward Compatibility

**Database**: No schema changes, fully backward compatible
**Client**: Old clients without XP bar will still function (no errors)
**Server**: New exports don't break existing imports

---

## 13. Future Enhancements

### 13.1 Skill System Integration
- Separate combat XP and gathering XP
- Gathering levels (Mining 1-50, Woodcutting 1-50, etc.)
- Skill-specific XP pools

### 13.2 Rested XP
- Bonus XP multiplier after logging out
- Encourages periodic play over marathon sessions

### 13.3 Level-Based Content
- Enemy levels sync with map zones
- Recommended level indicators
- Level requirements for quests

### 13.4 Leaderboards
- Top players by level
- Fastest level 50 achievements
- Database indexes on level/experience columns

### 13.5 Level-Up Rewards
- Attribute points for manual allocation
- New abilities/skills at specific levels
- Cosmetic rewards (titles, effects)

---

## 14. Acceptance Criteria

### 14.1 Must Have (MVP)
- ✅ Player gains XP from killing enemies (75% of base)
- ✅ Player gains XP from gathering resources (20 × minSkillLevel)
- ✅ Level scaling prevents low-level farming (0 XP at 9+ level difference)
- ✅ Player levels up when XP threshold reached
- ✅ Stats recalculate on level-up using class growth rates
- ✅ Health and mana restore to max on level-up
- ✅ XP bar shows progress to next level
- ✅ Level-up popup appears with visual feedback
- ✅ Other players see level-up in chat
- ✅ Level cap enforced at 50
- ✅ Offline level-ups detected on login

### 14.2 Should Have
- ✅ Multiple level-ups from single XP gain
- ✅ Group XP (75% each participant)
- ✅ All stat growth values are whole numbers

### 14.3 Nice to Have
- ⭕ Sound effects for level-up
- ⭕ Particle effects on player at level-up
- ⭕ "/xp" command to check XP progress
- ⭕ Stat comparison in level-up popup (old vs new)

---

## 15. Open Questions

1. **Should deaths have XP penalty?**
   → Current spec: No XP loss on death (aligned with casual MMO design)

2. **Should rested areas exist (towns, camps)?**
   → Current spec: Not implemented, future enhancement

3. **Should level-ups be manually confirmed (click "OK")?**
   → Current spec: Automatic with 3-second notification

4. **Should stat allocation be manual or automatic?**
   → Current spec: Automatic based on class growth rates

5. **Should XP be visible as floating numbers in game world?**
   → Current spec: Only in XP bar and chat, not world text

---

## 16. Approval

**Stakeholders**: Product Owner, Technical Lead, QA Lead

**Sign-off Required**: Yes, before implementation begins

**Review Date**: TBD

---

## 17. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | Claude | Initial specification |

