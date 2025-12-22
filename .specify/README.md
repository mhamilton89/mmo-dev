# MMO Game - Specification-Driven Development

This directory contains all specifications, plans, and technical documentation for the MMO Game project, following the **Spec-Kit** framework for specification-driven development.

---

## What is Specification-Driven Development?

Specification-driven development (SDD) emphasizes creating detailed specifications BEFORE writing code. This approach:

- ✅ **Reduces rework** - Know what you're building before you build it
- ✅ **Maintains consistency** - All features follow the same quality standards
- ✅ **Scales with AI** - Specs enable AI to implement features correctly
- ✅ **Documents intent** - Specs persist knowledge beyond code comments
- ✅ **Enables planning** - Break down large features into manageable tasks

---

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project governance principles
├── templates/
│   ├── spec-template.md         # Template for new feature specs
│   ├── plan-template.md         # Template for technical plans
│   └── tasks-template.md        # Template for task breakdowns
├── scripts/
│   └── powershell/
│       └── create-new-feature.ps1
├── specs/
│   ├── 001-authentication-system/
│   │   ├── spec.md              # Feature specification
│   │   ├── plan.md              # Technical implementation plan
│   │   ├── tasks.md             # Task breakdown
│   │   ├── research.md          # Research findings
│   │   ├── data-model.md        # Database schema
│   │   ├── quickstart.md        # Developer onboarding
│   │   └── contracts/           # API specifications
│   ├── 002-character-management/
│   ├── 003-inventory-system/
│   ├── 004-equipment-system/
│   └── 005-enemy-spawning/
└── README.md                    # This file
```

---

## Quick Start

### 1. Read the Constitution

Start by reading `.specify/memory/constitution.md` to understand the project's core principles:
- Server authority
- Performance requirements
- Data persistence standards
- Testing expectations
- Art asset standards
- Security principles

**All features must align with these principles.**

---

### 2. Creating a New Feature

Use the PowerShell script to create a new feature specification:

```powershell
cd .specify/scripts/powershell
.\create-new-feature.ps1 "combat-system" "Player Combat System"
```

This creates:
- `.specify/specs/006-combat-system/` directory
- `spec.md` from template
- Placeholder files for plan, tasks, research, etc.

---

### 3. Writing the Specification

Edit `spec.md` to define WHAT you want to build:

**Focus on:**
- User scenarios (Given/When/Then)
- Functional requirements (FR-001, FR-002, etc.)
- Success criteria (measurable metrics)
- Acceptance checklist

**Avoid:**
- Technical implementation details (those go in plan.md)
- Framework/library choices
- Code structure decisions

**Example:**
```markdown
### Scenario 1: Player Attacks Enemy
**Given:** A player is near an enemy
**When:** The player presses the attack key
**Then:**
- Attack animation plays
- Damage is calculated and applied to enemy
- Enemy health decreases
- Combat log shows damage dealt
```

---

### 4. AI-Assisted Workflow

Once you have a spec, use these commands with Claude Code:

#### `/speckit.clarify`
Identifies ambiguities in your spec and asks targeted questions to resolve them.

**When to use:** After writing spec.md, before planning

#### `/speckit.plan`
Generates technical implementation plan including:
- Architecture decisions
- Tech stack choices
- Database schema (data-model.md)
- API contracts
- Testing strategy

**When to use:** After spec is complete and clarified

#### `/speckit.tasks`
Creates actionable task breakdown:
- Dependency-ordered tasks
- Parallel execution opportunities
- File paths for each change
- Test-driven structure

**When to use:** After plan.md is complete

#### `/speckit.analyze`
Performs quality review across spec, plan, and tasks:
- Identifies inconsistencies
- Validates requirement coverage
- Checks constitution alignment

**When to use:** Before implementation, as quality gate

#### `/speckit.implement`
Executes the implementation plan by processing all tasks.

**When to use:** After tasks.md is validated

---

## Existing Features

The following features are already implemented and documented:

| ID | Feature | Status | Spec | Plan | Tasks |
|----|---------|--------|------|------|-------|
| 001 | Authentication System | ✅ Implemented | ✅ | Pending | Pending |
| 002 | Character Management | ✅ Implemented | ✅ | Pending | Pending |
| 003 | Inventory System | ✅ Implemented | ✅ | Pending | Pending |
| 004 | Equipment System | ✅ Implemented | ✅ | Pending | Pending |
| 005 | Enemy Spawning | ✅ Implemented | ✅ | Pending | Pending |

These specifications document the current state for reference and future enhancements.

---

## Constitution Principles

All features must adhere to these principles (see [constitution.md](memory/constitution.md) for details):

1. **P1-AUTHORITY:** Server is source of truth for all game state
2. **P2-PERFORMANCE:** Network ops within 50ms, DB writes within 5s
3. **P3-DATA:** All player state persists to PostgreSQL
4. **P4-TESTING:** Multiplayer features require automated tests
5. **P5-ASSETS:** LPC sprite format (1152x4224, rows 8-11)
6. **P6-SCALE:** Support 1000+ concurrent players
7. **P7-SECURITY:** All player input validated server-side
8. **P8-QUALITY:** Code documented, configuration-driven
9. **P9-UX:** Immediate feedback, player-friendly errors
10. **P10-WORKFLOW:** Spec-driven development required

---

## Specification Format

### Required Sections

Every spec.md MUST include:

1. **Overview** - Brief description
2. **User Scenarios** - Given/When/Then with acceptance criteria
3. **Functional Requirements** - FR-001, FR-002, etc. using "MUST" language
4. **Success Criteria** - Measurable outcomes (SC-001, SC-002, etc.)
5. **Acceptance Checklist** - Testable criteria

### Optional Sections

- **Key Entities** - Data models and relationships
- **Non-Functional Requirements** - Security, performance, scalability
- **Out of Scope** - Explicitly excluded features
- **Dependencies** - Required systems/libraries

---

## Technical Plans

### plan.md Structure

1. **Summary** - Requirements and approach
2. **Technical Context** - Stack, dependencies, platform
3. **Constitution Check** - Alignment with principles
4. **Project Structure** - File organization
5. **Architecture** - Components, data flow, APIs
6. **Implementation Approach** - Phased breakdown
7. **Testing Strategy** - Unit, integration, manual tests

---

## Task Breakdown

### tasks.md Format

Tasks follow this structure:
```
- [ ] [T001] [P?] [Story?] Description with file path
```

**Components:**
- Checkbox: `- [ ]` (mark `[X]` when complete)
- Task ID: Sequential (T001, T002, T003...)
- `[P]` marker: Can run in parallel
- `[Story]` label: Maps to user story (US1, US2)
- Description: Clear action with exact file path

**Example:**
```markdown
### Phase 3: User Story - Login Flow [US1]
- [ ] [T007] [US1] Write integration test for login endpoint
  - File: `tests/auth_test.js`
- [ ] [T008] [US1] Implement POST /api/login endpoint
  - File: `server/index.js`
- [ ] [T009] [US1] [P] Create login UI form
  - File: `client/index.html`
```

---

## Best Practices

### Writing Specifications
- ✅ Focus on WHAT and WHY, not HOW
- ✅ Use Given/When/Then for scenarios
- ✅ Include measurable success criteria
- ✅ Define acceptance checklist
- ❌ Don't specify frameworks or libraries
- ❌ Don't include implementation details

### Writing Plans
- ✅ Align with constitution principles
- ✅ Document architectural decisions
- ✅ Define clear data models
- ✅ Include security considerations
- ✅ Plan for testing from the start

### Writing Tasks
- ✅ Order by dependencies
- ✅ Mark parallel tasks with [P]
- ✅ Include exact file paths
- ✅ Make tasks atomic and testable
- ✅ Follow TDD (tests before implementation)

---

## Adding Features to the Game

### For New Features (Not Yet Implemented)

1. Create feature spec using `create-new-feature.ps1`
2. Write spec.md defining what you want
3. Use `/speckit.clarify` to resolve ambiguities
4. Use `/speckit.plan` to generate technical plan
5. Use `/speckit.tasks` to create task breakdown
6. Use `/speckit.analyze` to validate quality
7. Use `/speckit.implement` or implement manually

### For Enhancing Existing Features

1. Review existing spec in `.specify/specs/[feature]/spec.md`
2. Update spec with new requirements
3. Regenerate or update plan.md
4. Create tasks.md for the enhancement
5. Implement changes

---

## File Naming Conventions

- Feature directories: `###-feature-name` (e.g., `001-authentication-system`)
- Always 3-digit padding for feature numbers
- Use lowercase with hyphens for multi-word names
- Spec files always named: `spec.md`, `plan.md`, `tasks.md`

---

## Integration with Claude Code

This project uses Claude Code (Sonnet 4.5) as the AI development assistant. The spec-kit structure enables Claude to:

1. Understand project context from constitution
2. Generate features from specifications
3. Maintain consistency across implementations
4. Follow established patterns and principles

**Key Commands:**
- Use `/speckit.*` commands for spec-driven workflow
- Reference constitution when making architectural decisions
- Cite specifications when implementing features

---

## Project Status

**Current State:**
- 5 features implemented and documented (specs written retroactively)
- Constitution established with 10 core principles
- Templates created for future features
- Ready for spec-driven development workflow

**Next Steps:**
- Generate plans for existing features (optional, for documentation)
- Use spec-kit workflow for all new features
- Refine constitution as project evolves

---

## Resources

- **Spec-Kit GitHub:** https://github.com/github/spec-kit
- **Spec-Kit Official Site:** https://speckit.org/
- **Constitution:** `.specify/memory/constitution.md`
- **Templates:** `.specify/templates/`

---

## Questions?

This README provides guidance on using specification-driven development for the MMO Game project. For specific feature questions, consult the individual spec files in `.specify/specs/[feature-id]/`.

For constitutional amendments or process improvements, create a proposal and discuss with the team.

---

**Last Updated:** 2025-12-22
**Maintained By:** Claude Sonnet 4.5 + Development Team
