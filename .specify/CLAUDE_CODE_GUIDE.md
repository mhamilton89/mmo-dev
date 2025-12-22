# Using Spec-Kit with Claude Code

This guide explains how to use the spec-kit framework with Claude Code (Sonnet 4.5) for the MMO Game project.

---

## Overview

**Spec-Kit** is a specification-driven development framework that works seamlessly with AI coding assistants like Claude Code. Instead of diving straight into code, you define WHAT you want in specifications, then use AI to generate HOW to build it.

**Benefits:**
- Reduced rework (plan before coding)
- Consistent quality (constitution enforces standards)
- Better documentation (specs persist knowledge)
- Scalable development (AI implements from specs)

---

## Workflow Summary

```
1. constitution.md → Define project principles (one-time setup) ✅ DONE
2. spec.md → Define what to build (per feature)
3. /speckit.clarify → Resolve ambiguities (optional)
4. plan.md → Generate technical approach
5. /speckit.tasks → Create task breakdown
6. /speckit.analyze → Validate quality
7. /speckit.implement → Build the feature
```

---

## Using Spec-Kit Commands with Claude Code

### Prerequisites

Claude Code understands spec-kit commands when:
1. The `.specify/` directory exists with proper structure ✅
2. Constitution and templates are in place ✅
3. You reference spec-kit workflow in your requests

**For this project: All prerequisites are met!**

---

## Command Reference

### `/speckit.constitution` - Project Governance

**Purpose:** Creates or updates the project's governing principles.

**Status for this project:** ✅ **Already created** at `.specify/memory/constitution.md`

**When to use:**
- Updating core principles
- Adding new standards
- Revising architectural decisions

**Example request:**
```
I want to update the constitution to add a principle about
code review requirements. Can you help?
```

---

### `/speckit.specify` - Create Feature Specification

**Purpose:** Generates a feature specification from natural language description.

**When to use:** Starting a new feature (e.g., combat system, trading, quests)

**How to request:**
```
/speckit.specify - Create a specification for a player-to-player
trading system where players can exchange items and gold securely
```

**What Claude will do:**
1. Run `create-new-feature.ps1` to create next numbered feature directory
2. Generate comprehensive spec.md with:
   - User scenarios (Given/When/Then)
   - Functional requirements (FR-001, FR-002, etc.)
   - Success criteria (measurable)
   - Acceptance checklist
3. Create placeholder files (plan.md, tasks.md, etc.)

**Output:**
- `.specify/specs/006-trading-system/spec.md`
- Ready for review and refinement

---

### `/speckit.clarify` - Resolve Ambiguities

**Purpose:** Identifies unclear or underspecified areas in a specification and asks targeted questions.

**When to use:** After writing spec.md, before planning

**How to request:**
```
/speckit.clarify - Review the trading system spec and identify
any ambiguities or missing details
```

**What Claude will do:**
1. Scan spec.md against 9 taxonomy categories:
   - Functional scope
   - Data model
   - UX flows
   - Non-functional requirements
   - Integrations
   - Edge cases
   - Constraints
   - Terminology
   - Completion signals
2. Ask maximum 5 prioritized questions
3. Present questions one at a time
4. Update spec incrementally after each answer

**Example questions:**
- "Should trading be instant or require confirmation from both players?"
- "What happens if a player disconnects during an active trade?"
- "Is there a distance limit for trading (must be nearby)?"

---

### `/speckit.plan` - Generate Technical Plan

**Purpose:** Translates specification into detailed technical implementation plan.

**When to use:** After spec is complete (and clarified if needed)

**How to request:**
```
/speckit.plan - Generate a technical implementation plan for
the trading system specification
```

**What Claude will do:**

**Phase 0: Research & Clarification**
- Extract items marked `[NEEDS CLARIFICATION]`
- Research dependencies, patterns, libraries
- Consolidate findings into `research.md`

**Phase 1: Design & Contracts**
- Extract entities into `data-model.md`
- Generate API contracts (JSON/Markdown) in `/contracts/`
- Produce `quickstart.md` for developer onboarding
- Create comprehensive `plan.md` with:
  - Technical context (stack, dependencies)
  - Constitution check (validates alignment)
  - Architecture (components, data flow, APIs)
  - Implementation approach (phased breakdown)
  - Security considerations
  - Testing strategy

**Output:**
- `plan.md` - Main technical plan
- `research.md` - Research findings
- `data-model.md` - Database schema, TypeScript interfaces
- `contracts/api-spec.json` - API specifications
- `quickstart.md` - Developer guide

---

### `/speckit.tasks` - Create Task Breakdown

**Purpose:** Generates actionable, dependency-ordered task list.

**When to use:** After plan.md is complete

**How to request:**
```
/speckit.tasks - Break down the trading system plan into
executable tasks
```

**What Claude will do:**
1. Parse plan.md and spec.md
2. Break into phases:
   - Phase 1: Setup (database, dependencies)
   - Phase 2: Foundational (data models, API contracts)
   - Phase 3+: User Stories (one phase per story)
   - Final: Polish & cross-cutting
3. Generate tasks with:
   - Sequential IDs (T001, T002, T003...)
   - Parallel markers [P] where applicable
   - Story labels [US1], [US2]
   - Exact file paths
   - TDD structure (tests before implementation)

**Task format:**
```markdown
- [ ] [T007] [US1] Write integration test for trade initiation
  - File: `tests/trading_test.js`
- [ ] [T008] [US1] Implement POST /api/trade/initiate endpoint
  - File: `server/index.js`
- [ ] [T009] [US1] [P] Create trade UI window
  - File: `client/index.html`
```

**Output:**
- `tasks.md` with full task breakdown
- Task summary (total count, phases, parallel opportunities)

---

### `/speckit.checklist` - Quality Validation

**Purpose:** Generates domain-specific quality checklists to validate spec completeness.

**When to use:** After spec.md is written, before investing in planning

**How to request:**
```
/speckit.checklist - Create quality checklists for the
trading system specification
```

**What Claude will do:**
1. Create "unit tests for English" - objective, measurable criteria
2. Validate:
   - Completeness (all scenarios covered?)
   - Clarity (ambiguous language?)
   - Consistency (contradictions?)
   - Coverage (edge cases defined?)
3. Address critical domains:
   - UX (user experience flows)
   - Security (data protection, validation)
   - Testing (testability criteria)
   - Performance (metrics defined?)
   - Accessibility (if applicable)

**Output:**
- Checklist markdown (may append to spec.md or create separate file)
- Identifies gaps and missing requirements

---

### `/speckit.analyze` - Quality Review

**Purpose:** Performs read-only cross-artifact consistency analysis.

**When to use:** After tasks.md is complete, before implementation

**How to request:**
```
/speckit.analyze - Review the trading system spec, plan, and
tasks for consistency and quality
```

**What Claude will do:**
1. Load spec.md, plan.md, tasks.md
2. Build semantic models (requirements → tasks mapping)
3. Detect issues:
   - Inconsistencies between spec and plan
   - Requirements without tasks (coverage gaps)
   - Tasks without requirements (scope creep)
   - Duplicate or conflicting definitions
   - Constitution violations
4. Assign severity (CRITICAL, HIGH, MEDIUM, LOW)
5. Generate structured report (≤50 findings)

**Output format:**
- Findings table with ID, Category, Severity, Location, Summary, Recommendation
- Coverage summary (% of requirements with tasks)
- Constitution alignment issues
- Metrics (requirements, tasks, coverage %)

**Does NOT modify files** - read-only analysis

---

### `/speckit.implement` - Execute Implementation

**Purpose:** Executes the implementation plan by processing all tasks.

**When to use:** After tasks.md is validated and quality-checked

**How to request:**
```
/speckit.implement - Implement the trading system following
the task breakdown
```

**What Claude will do:**
1. Validate prerequisites (spec, plan, tasks exist)
2. Load all context files (tasks, plan, data-model, contracts, research, quickstart)
3. Execute tasks in dependency order:
   - Setup phase (project init, database, dependencies)
   - Foundational phase (data models, API contracts)
   - User story phases (implement features)
   - Polish phase (error handling, optimization, docs)
4. Track progress by marking tasks `[X]` as completed
5. Report errors and validate completion

**Implementation workflow:**
- Respects task dependencies (sequential tasks run in order)
- Allows parallel tasks marked [P] to execute together
- Updates tasks.md with completion status
- Verifies implementation matches specifications

---

## Example: Adding a Combat System

Here's a complete walkthrough of using spec-kit to add a combat system:

### Step 1: Create Specification

**Request:**
```
/speckit.specify - Create a specification for a real-time combat
system where players can attack enemies and other players. Include
melee and ranged attacks, damage calculation, cooldowns, and death/respawn.
```

**Claude will:**
- Create `.specify/specs/006-combat-system/`
- Generate `spec.md` with scenarios, requirements, success criteria
- Create placeholder files

### Step 2: Review and Clarify

**You:** Review the spec.md, make any edits needed

**Request:**
```
/speckit.clarify - Review the combat system spec for ambiguities
```

**Claude might ask:**
- "Should friendly fire be enabled (player-vs-player damage)?"
- "How should attack range be determined (weapon-based or character-based)?"
- "What happens to items when a player dies (drop all, drop some, keep all)?"

**You:** Answer questions, Claude updates spec

### Step 3: Generate Technical Plan

**Request:**
```
/speckit.plan - Generate a technical implementation plan for
the combat system
```

**Claude will:**
- Create `plan.md` with architecture, tech decisions, testing strategy
- Create `data-model.md` with combat-related database schema
- Create `contracts/combat-api.json` with WebSocket message formats
- Create `research.md` with findings about damage calculation algorithms
- Create `quickstart.md` for combat system development

### Step 4: Create Task Breakdown

**Request:**
```
/speckit.tasks - Break down the combat system into executable tasks
```

**Claude will:**
- Generate `tasks.md` with ~40-60 tasks organized by phase
- Mark parallel tasks, map to user stories
- Include exact file paths for each change

### Step 5: Quality Check

**Request:**
```
/speckit.analyze - Validate the combat system spec, plan, and tasks
```

**Claude will:**
- Report any inconsistencies
- Verify requirement coverage
- Check constitution alignment
- Provide recommendations

### Step 6: Implement

**Option A - Full Auto:**
```
/speckit.implement - Implement the combat system
```

**Option B - Manual (task by task):**
```
Let's start implementing the combat system. Begin with Phase 1
tasks (T001-T005) from tasks.md
```

Then continue through each phase as you prefer.

---

## Tips for Effective Spec-Kit Usage

### Writing Good Specifications

✅ **DO:**
- Focus on user scenarios (Given/When/Then)
- Use measurable success criteria (numbers, percentages, time limits)
- Include edge cases and error scenarios
- Define acceptance checklist
- Reference constitution principles

❌ **DON'T:**
- Specify frameworks or libraries (that's for plan.md)
- Include implementation details or code structure
- Make assumptions without documenting them
- Skip edge cases or error handling

### Leveraging the Constitution

The constitution is your project's North Star. When in doubt:
- Reference principles in requests: "following P1-AUTHORITY..."
- Ask Claude to validate against constitution: "Does this approach align with our constitution?"
- Update constitution when you discover new principles

### Iterative Refinement

Spec-kit supports iteration:
- Update spec.md as requirements change
- Regenerate plan.md if architecture shifts
- Revise tasks.md when discovering new work
- Use `/speckit.analyze` to catch drift

---

## Manual Spec-Kit Workflow (Without Slash Commands)

If you prefer not to use slash commands, you can request the same workflow with natural language:

**Instead of:** `/speckit.specify - [description]`
**Say:** "Create a new feature specification for [description] following the spec-kit format. Use the next available feature number and follow the constitution principles."

**Instead of:** `/speckit.plan`
**Say:** "Generate a comprehensive technical plan for the [feature] specification in spec.md. Include architecture, data model, API contracts, and testing strategy."

**Instead of:** `/speckit.tasks`
**Say:** "Break down the technical plan into an actionable task list with dependencies, parallel markers, and exact file paths."

Claude understands the intent and will follow the same structured approach.

---

## Project-Specific Notes

### Current State
- ✅ Constitution established with 10 principles
- ✅ 5 existing features documented (specs written retroactively)
- ✅ Templates ready for new features
- ✅ Scripts available for feature creation

### Constitution Highlights for MMO Game
- **P1-AUTHORITY:** Server-authoritative (all game logic server-side)
- **P2-PERFORMANCE:** Network <50ms, DB writes <5s
- **P5-ASSETS:** LPC sprite format mandatory (1152x4224, rows 8-11)
- **P6-SCALE:** Support 1000+ concurrent players
- **P7-SECURITY:** Never trust client input

### Tech Stack Context
- Backend: Node.js + PostgreSQL + WebSocket
- Frontend: Phaser 3 + HTML/CSS/JS
- Assets: LPC format sprites

When working with Claude, these constraints are already known via the constitution.

---

## Troubleshooting

### "I don't see the .specify directory"
- It's located at `c:\Users\micha\Documents\game_dev\mmo-dev\.specify\`
- Ensure you're in the project root when running commands

### "Claude isn't following spec-kit format"
- Reference the constitution: "Following the project constitution..."
- Point to templates: "Using the spec template from .specify/templates/spec-template.md"
- Be explicit: "Generate spec.md following spec-kit format with Given/When/Then scenarios"

### "I want to skip a step (e.g., skip plan, go straight to tasks)"
- Not recommended - each step builds on the previous
- But if needed: "Create tasks.md directly from spec.md, inferring the technical approach"

### "Tasks seem too granular / not granular enough"
- Provide guidance: "Make tasks more atomic, one file change per task"
- Or: "Combine related tasks, focusing on complete features"

---

## Next Steps

Now that spec-kit is fully set up:

1. **Try it out:** Create a small new feature to practice the workflow
2. **Refine:** Update constitution as you learn what works
3. **Scale:** Use for all future features (combat, quests, trading, etc.)
4. **Document:** Add to specs as you implement

**Example starter feature:**
```
/speckit.specify - Create a specification for a simple chat command
system where players can type /help, /online, /stats to get information
```

This small feature lets you practice the full workflow before tackling larger systems like combat or trading.

---

## Resources

- **Spec-Kit GitHub:** https://github.com/github/spec-kit
- **Constitution:** `.specify/memory/constitution.md`
- **Templates:** `.specify/templates/`
- **Existing Specs:** `.specify/specs/001-*` through `.specify/specs/005-*`

---

**Happy spec-driven development!**

This framework will scale with your project as it grows to hundreds of features and thousands of items. The specifications become your project's knowledge base, persisting beyond any individual coding session.
