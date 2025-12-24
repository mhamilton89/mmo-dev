# MMO Game Project Constitution

**Version:** 1.0.0
**Last Updated:** 2025-12-22
**Status:** Active

---

## Purpose

This constitution establishes the foundational governance principles for the MMO Game project. These principles guide all technical decisions, feature development, and architectural choices throughout the project lifecycle.

---

## Core Principles

### 1. Server Authority (P1-AUTHORITY)

**Principle:** The server is the single source of truth for all game state.

**Requirements:**
- All game logic MUST execute on the authoritative server
- Client applications MUST be treated as untrusted presentation layers
- Player actions MUST be validated server-side before state changes
- Client-predicted movements MAY be allowed but MUST be reconciled with server state
- NO gameplay-critical logic may exist only on the client

**Rationale:** Prevents cheating, ensures consistency across all players, and maintains game integrity.

---

### 2. Real-Time Performance (P2-PERFORMANCE)

**Principle:** Network operations must provide responsive gameplay experience.

**Requirements:**
- Player movement updates MUST transmit within 50ms for smooth gameplay
- Database writes MUST complete within 5 seconds of state change
- Server tick rate MUST maintain 20 updates per second minimum
- Client rendering MUST achieve 60 FPS on target hardware
- WebSocket connections MUST reconnect automatically within 3 seconds

**Rationale:** MMO gameplay requires real-time responsiveness to feel engaging and competitive.

---

### 3. Data Persistence (P3-DATA)

**Principle:** Player progress and game state must persist reliably.

**Requirements:**
- All player state changes MUST write to PostgreSQL database
- Character data MUST persist immediately upon logout
- Inventory changes MUST save within 5 seconds
- Database schema changes MUST use versioned migration scripts
- NO critical game data may exist only in memory without persistence strategy

**Rationale:** Players expect their progress to be saved reliably; data loss destroys trust.

---

### 4. Testing Standards (P4-TESTING)

**Principle:** All multiplayer features require automated testing with simulated clients.

**Requirements:**
- Server endpoints MUST have integration tests
- Database operations MUST have transaction tests
- Multiplayer features MUST include multi-client simulation tests
- Real-time synchronization MUST be tested with latency simulation
- Regression tests MUST run before merging to main branch

**Rationale:** Multiplayer bugs are complex and costly; automated testing catches issues early.

---

### 5. Art Asset Standards (P5-ASSETS)

**Principle:** Visual assets follow consistent format for scalability.

**Requirements:**
- All sprites MUST use LPC (Liberated Pixel Cup) format
- Equipment MUST match character sprite dimensions and animation structure
- Asset registration MUST use declarative configuration (no hardcoded assets)
- Sprite specifications defined in `.specify/specs/004-equipment-system/spec.md`

**Rationale:** Standardized formats enable rapid content addition and maintain visual consistency.

---

### 6. Scalability Architecture (P6-SCALE)

**Principle:** Systems must support growth in players and content.

**Requirements:**
- Server architecture MUST support 1000+ concurrent players per instance
- Database queries MUST use indexing for performance at scale
- Equipment/item systems MUST support hundreds of entries via configuration
- Code changes SHOULD NOT be required to add new content items
- Resource spawning MUST distribute across zones to prevent hotspots

**Rationale:** MMO success depends on ability to grow without architectural rewrites.

---

### 7. Security & Anti-Cheat (P7-SECURITY)

**Principle:** All player input is untrusted and must be validated.

**Requirements:**
- Movement commands MUST validate against speed/position constraints
- Item transactions MUST verify inventory state server-side
- Authentication tokens MUST use secure sessions with expiration
- SQL queries MUST use parameterized statements (no string concatenation)
- Client-sent data MUST be sanitized before database writes

**Rationale:** Online games are targets for exploitation; security must be built-in from the start.

---

### 8. Code Quality (P8-QUALITY)

**Principle:** Code should be maintainable, readable, and documented.

**Requirements:**
- Complex systems MUST include inline documentation explaining intent
- Magic numbers MUST be replaced with named constants
- Configuration SHOULD live in dedicated files (not scattered in code)
- Database schema MUST be documented with column purposes
- API contracts SHOULD be documented for client-server communication

**Rationale:** This project will grow large; maintainability prevents technical debt.

---

### 9. Player Experience (P9-UX)

**Principle:** Player-facing features must be intuitive and responsive.

**Requirements:**
- UI actions MUST provide immediate visual feedback (loading states, confirmations)
- Error messages MUST be player-friendly (no raw database errors)
- Inventory/equipment changes MUST reflect immediately in client UI
- Chat messages MUST appear within 200ms of submission
- Character animations MUST sync with movement state (no walking-while-idle bugs)

**Rationale:** Player retention depends on polished, bug-free user experience.

---

### 10. Development Workflow (P10-WORKFLOW)

**Principle:** Use specification-driven development for consistency.

**Requirements:**
- New features MUST begin with specification document (spec.md)
- Technical decisions MUST be documented in plan.md before implementation
- Breaking changes MUST be communicated via migration guides
- All changes MUST be committed to version control with descriptive messages
- Feature branches SHOULD follow naming: `###-feature-name` (001-authentication, 002-inventory)

**Rationale:** Specifications ensure alignment, reduce rework, and provide documentation.

---

## Technology Stack

### Backend
- **Runtime:** Node.js (LTS version)
- **Database:** PostgreSQL 14+ with connection pooling
- **Real-Time:** WebSocket via Socket.io
- **Language:** JavaScript (ES6+)

### Frontend
- **Game Engine:** Phaser 3.90+
- **UI:** HTML5, CSS3, vanilla JavaScript
- **Assets:** PNG sprites (LPC format)
- **API Consistency:** Prefer Phaser APIs over vanilla JS for game logic

### Infrastructure
- **Version Control:** Git with GitHub
- **Package Management:** npm

---

## Amendment Process

This constitution may be amended when:
1. A technical decision consistently violates a principle across multiple features
2. New technology makes a principle obsolete
3. Scalability requirements change fundamentally

**Amendment Procedure:**
1. Propose change with rationale in `constitution_update_checklist.md`
2. Update semantic version (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)
3. Review impact on existing specifications and plans
4. Update all dependent documentation

---

## Governance

**Decision Authority:**
- Principle violations require documented justification in plan.md
- Architectural changes affecting multiple features require constitution review
- Content additions (items, enemies) follow established patterns without review

**Conflict Resolution:**
When implementation conflicts with constitution, constitution takes precedence unless:
1. Technical blocker makes compliance impossible (document in plan.md)
2. Temporary violation with migration path (document timeline)

---

## Success Metrics

This constitution succeeds when:
- Features ship faster due to established patterns
- Bugs decrease due to testing and validation requirements
- New content (items, enemies) can be added by editing configuration files only
- Multiplayer synchronization remains reliable under load
- Player data persists without loss

---

**Signed:** Claude Sonnet 4.5 (AI Development Assistant)
**Date:** 2025-12-22
**Next Review:** After 5 major features or 6 months
