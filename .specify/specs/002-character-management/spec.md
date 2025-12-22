# Feature Specification: Character Management

**Feature ID:** 002-character-management
**Status:** Implemented
**Priority:** P1 (Critical)
**Created:** 2025-12-22
**Last Updated:** 2025-12-22

---

## Overview

The Character Management system allows players to create, select, and manage multiple characters per account. Each character has a unique name, class, visual appearance, and persistent game state.

---

## User Scenarios & Testing

### Scenario 1: Character Selection (P1)

**Given:** A logged-in player with existing characters
**When:** They complete authentication
**Then:**
- Character selection screen displays all their characters
- Each character shows: name, class, level
- Player can click a character to enter the game
- "Create New Character" button is available

**Acceptance Criteria:**
- All characters load within 1 second
- Character list is sorted by creation date (newest first)
- Selecting a character loads the game within 2 seconds
- Maximum characters per account enforced (e.g., 5)

**Edge Cases:**
- Account with zero characters shows only "Create New Character" button
- Account at character limit hides/disables "Create New Character" button

---

### Scenario 2: Character Creation (P1)

**Given:** A player on character selection screen
**When:** They click "Create New Character"
**Then:**
- Character creation screen displays
- Player enters character name
- Player selects a class (Warrior, Mage/Wizard, Ranger)
- Character is created and player enters game with that character

**Acceptance Criteria:**
- Character name validated (3-20 characters, alphanumeric + spaces)
- Duplicate names within account are rejected
- Class selection displays class info (description, stats)
- Character creation completes within 2 seconds
- New character spawns at default starting position

**Edge Cases:**
- Empty name shows validation error
- Profanity filter (future enhancement)
- Special characters in name are handled/rejected
- Extremely long names are truncated or rejected

---

### Scenario 3: Character Persistence (P1)

**Given:** A player controlling a character in-game
**When:** They move, gain items, or change equipment
**Then:**
- Character position updates in database
- Inventory changes persist
- Equipment changes persist
- Player can logout and rejoin with same state

**Acceptance Criteria:**
- Position updates write within 5 seconds
- Inventory updates write within 5 seconds
- Logout saves all character state immediately
- Re-login loads exact previous state (position, inventory, equipment)

**Edge Cases:**
- Disconnection without logout attempts to save last known state
- Rapid movements batch update to reduce database writes

---

### Scenario 4: Multi-Character Support (P2)

**Given:** A player with multiple characters
**When:** They logout and return to character selection
**Then:**
- All characters are listed
- Each character maintains independent state
- Switching characters loads different game state

**Acceptance Criteria:**
- Characters don't share inventory or position
- Each character has independent level/stats
- Switching characters completes within 2 seconds

---

## Functional Requirements

### FR-001: Character Creation
The system MUST allow players to create characters with:
- Unique name (per account, 3-20 characters)
- Class selection (Warrior, Wizard, Ranger)
- Visual sprite based on class
- Default starting position (x, y coordinates)

### FR-002: Character Storage
The system MUST persist:
- Character name, class, level
- Position (x, y coordinates)
- Health, mana, experience points
- Associated account ID (foreign key)
- Creation timestamp

### FR-003: Character Selection
The system MUST:
- Load all characters for authenticated account
- Display character name, class, level
- Allow player to select character to play
- Provide "Create New Character" option

### FR-004: Character Limits
The system MUST:
- Enforce maximum characters per account (configurable, default 5)
- Prevent character creation when limit reached
- Display remaining character slots

### FR-005: Character State Persistence
The system MUST:
- Update character position in database periodically (every 5 seconds or on logout)
- Save inventory changes immediately
- Save equipment changes immediately
- Preserve character state across sessions

### FR-006: Character Data Loading
The system MUST:
- Load complete character state on selection
- Include position, stats, inventory, equipment
- Validate character belongs to authenticated account (security)

---

## Key Entities

### Character
- **id** (integer, primary key): Unique character identifier
- **account_id** (integer, foreign key): Owner account
- **name** (string, unique per account): Character name
- **class** (string): Character class (warrior, wizard, ranger)
- **level** (integer): Character level (default 1)
- **x** (float): X position in game world
- **y** (float): Y position in game world
- **health** (integer): Current health points
- **max_health** (integer): Maximum health points
- **mana** (integer): Current mana points
- **max_mana** (integer): Maximum mana points
- **experience** (integer): Experience points
- **created_at** (timestamp): Creation time

**Relationships:**
- One account has many characters
- One character has many inventory items
- One character has many equipment slots

---

## Success Criteria

### SC-001: Data Integrity
- Character names are unique per account (database constraint)
- Characters always reference valid account (foreign key constraint)
- Orphaned characters are impossible (cascade delete on account deletion)

### SC-002: Performance
- Character list loads within 1 second
- Character creation completes within 2 seconds
- Character selection and game load within 2 seconds
- Position updates write within 5 seconds

### SC-003: User Experience
- Class selection displays helpful information (stats, description)
- Character creation provides immediate feedback (loading states)
- Character list is visually clear and organized
- Errors are user-friendly ("Name already taken", not "UNIQUE constraint violation")

### SC-004: Scalability
- Supports 5 characters per account without performance degradation
- Database indexed by account_id for fast character lookup
- Character count query is efficient (COUNT vs. loading all data)

---

## Non-Functional Requirements

### Security
- Character selection validates ownership (account_id match)
- Players cannot access other accounts' characters
- Character deletion requires confirmation (future feature)

### Data Validation
- Name length enforced (3-20 characters)
- Class validated against enum (warrior, wizard, ranger)
- Position coordinates validated (within world bounds)

### Compatibility
- Character data compatible with future features (skills, quests)
- Schema allows adding columns without breaking existing characters

---

## Out of Scope

- Character deletion (future feature)
- Character renaming (future feature)
- Character appearance customization beyond class sprite (future feature)
- Character transfer between accounts (future feature)
- Character skill trees/specializations (future feature)

---

## Dependencies

- Authentication system (must be logged in)
- PostgreSQL database (characters table)
- Class definitions with sprites and stats
- Inventory system for character items
- Equipment system for character gear

---

## Acceptance Checklist

- [ ] Player can create character with name and class
- [ ] Character name validation works (length, uniqueness)
- [ ] Class selection displays class information
- [ ] Character appears in selection list after creation
- [ ] Player can select character and enter game
- [ ] Character position persists across logout/login
- [ ] Multiple characters per account work independently
- [ ] Character limit enforced (max 5 per account)
- [ ] Character data validates ownership (security)
- [ ] Character stats (HP, MP) load correctly

---

## Class Definitions

### Warrior
- **Description:** Melee fighter with high health and defense
- **Starting Stats:** HP 150, MP 50
- **Sprite:** LPC warrior sprite (male_warrior.png)

### Wizard (formerly Mage)
- **Description:** Magic user with high mana and ranged attacks
- **Starting Stats:** HP 80, MP 150
- **Sprite:** LPC wizard sprite (male_mage.png)

### Ranger
- **Description:** Agile ranged fighter with balanced stats
- **Starting Stats:** HP 100, MP 100
- **Sprite:** LPC ranger sprite (male_ranger.png)

---

## Related Documentation

- Database schema: `database/schema.sql` (characters table)
- Migration scripts: `database/run_migration.js` (Mage → Wizard rename)
- Server endpoints: `server/index.js` (character routes)
- Client UI: `client/index.html` (character-select-screen, character-create-screen)

---

**Specification Author:** Claude Sonnet 4.5
**Reviewed By:** Pending
**Approved By:** Pending
