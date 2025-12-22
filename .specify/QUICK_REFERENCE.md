# Spec-Kit Quick Reference

Fast reference guide for specification-driven development in the MMO Game project.

---

## 🚀 Quick Start

```powershell
# Create new feature
cd .specify/scripts/powershell
.\create-new-feature.ps1 "feature-name" "Feature Display Name"

# Then tell Claude:
"Generate a specification for [feature description]"
"Create a technical plan for [feature-name]"
"Break down into tasks"
"Implement [feature-name]"
```

---

## 📁 Directory Structure

```
.specify/
├── memory/constitution.md           ← Project principles
├── templates/                       ← Templates for new features
├── scripts/powershell/              ← Helper scripts
└── specs/
    └── ###-feature-name/
        ├── spec.md                  ← WHAT to build
        ├── plan.md                  ← HOW to build
        ├── tasks.md                 ← Task breakdown
        ├── research.md              ← Research findings
        ├── data-model.md            ← Database schema
        ├── quickstart.md            ← Developer guide
        └── contracts/               ← API specs
```

---

## 🔄 Workflow

```
1. constitution.md  → Read project principles
2. spec.md         → Define WHAT (user scenarios, requirements)
3. plan.md         → Define HOW (architecture, tech stack)
4. tasks.md        → Define STEPS (actionable tasks)
5. implement       → Build it
```

---

## 💬 Claude Code Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.specify` | Create feature spec | Starting new feature |
| `/speckit.clarify` | Resolve ambiguities | After writing spec |
| `/speckit.plan` | Generate technical plan | After spec is clear |
| `/speckit.tasks` | Create task breakdown | After plan exists |
| `/speckit.analyze` | Quality check | Before implementing |
| `/speckit.implement` | Execute tasks | Ready to build |

---

## 📋 Natural Language Equivalents

**Don't want to use slash commands? Say:**

- "Create a specification for [feature] following spec-kit format"
- "Generate a technical plan for [feature] in spec.md"
- "Break down the plan into tasks with file paths"
- "Implement [feature] following the task breakdown"

---

## ✅ Constitution Principles (Quick)

| ID | Principle | Key Rule |
|----|-----------|----------|
| P1 | Server Authority | Server = source of truth |
| P2 | Performance | Network <50ms, DB <5s |
| P3 | Data Persistence | All state → PostgreSQL |
| P4 | Testing | Multiplayer features need tests |
| P5 | Asset Standards | LPC format (1152x4224, rows 8-11) |
| P6 | Scalability | Support 1000+ players |
| P7 | Security | Validate all client input |
| P8 | Code Quality | Document complex logic |
| P9 | UX | Immediate feedback |
| P10 | Workflow | Spec-driven development |

Full details: `.specify/memory/constitution.md`

---

## 📝 Spec.md Template

```markdown
## User Scenarios

### Scenario 1: [Name] (P1)
**Given:** [context]
**When:** [action]
**Then:** [outcome]

**Acceptance Criteria:**
- [measurable criterion]

**Edge Cases:**
- [edge case]

## Functional Requirements

### FR-001: [Name]
The system MUST [requirement using MUST language]

## Success Criteria

### SC-001: [Category]
- [Measurable metric with number]

## Acceptance Checklist
- [ ] [Testable criterion]
```

---

## 📊 Task Format

```markdown
- [ ] [T001] [P?] [Story?] Description with file path
  - File: `path/to/file.js`
```

**Components:**
- `[ ]` = Not done, `[X]` = Done
- `T001` = Task ID (sequential)
- `[P]` = Can run in parallel (optional)
- `[Story]` = User story label like [US1] (optional)
- Description = Clear action
- File = Exact file path

---

## 🎯 Current Features

| ID | Feature | Status |
|----|---------|--------|
| 001 | Authentication System | ✅ Spec |
| 002 | Character Management | ✅ Spec |
| 003 | Inventory System | ✅ Spec |
| 004 | Equipment System | ✅ Spec |
| 005 | Enemy Spawning | ✅ Spec |

Next: 006-[your-feature]

---

## 🛠️ Tech Stack

- **Backend:** Node.js + PostgreSQL + WebSocket
- **Frontend:** Phaser 3 + HTML/CSS/JS
- **Assets:** LPC format sprites (1152x4224 pixels)

---

## 🆘 Common Requests

**Create new feature:**
```
Create a new feature specification for a player trading system
where players can exchange items securely
```

**Generate plan:**
```
Generate a technical implementation plan for the trading system
specification, following our constitution principles
```

**Create tasks:**
```
Break down the trading system plan into an actionable task list
with dependencies and file paths
```

**Check quality:**
```
Analyze the trading system spec, plan, and tasks for consistency
and validate against the constitution
```

**Implement:**
```
Implement the trading system following the task breakdown in tasks.md
```

---

## 📖 Example Feature Request

```
I want to add a guild system where players can:
- Create guilds with unique names
- Invite other players to join
- Have guild chat
- See member list
- Have guild ranks (leader, officer, member)

Please create a specification for this following spec-kit format,
then generate the plan and tasks.
```

Claude will:
1. Create `.specify/specs/006-guild-system/`
2. Generate complete `spec.md` with scenarios
3. Generate `plan.md` with architecture
4. Generate `tasks.md` with implementation steps

---

## 🔧 File Locations

- **Constitution:** `.specify/memory/constitution.md`
- **Templates:** `.specify/templates/`
- **Specs:** `.specify/specs/###-feature-name/`
- **Scripts:** `.specify/scripts/powershell/`
- **Guides:** `.specify/README.md`, `.specify/CLAUDE_CODE_GUIDE.md`

---

## ⚡ Power Tips

1. **Always start with spec** - Define WHAT before HOW
2. **Reference constitution** - Mention principles in requests
3. **Use Given/When/Then** - Makes scenarios testable
4. **Include edge cases** - Don't just happy path
5. **Measurable criteria** - Numbers, percentages, time limits
6. **Validate quality** - Use `/speckit.analyze` before implementing

---

## 🎓 Learning Path

1. **Read constitution** (5 min)
2. **Review existing spec** (10 min) - Pick any from 001-005
3. **Create small feature** (30 min) - Practice workflow
4. **Build it** (varies) - Implement following tasks

**Suggested first practice feature:**
```
Chat command system with /help, /online, /stats commands
```

Small enough to complete quickly, teaches full workflow.

---

## 📚 Resources

- **Full Guide:** `.specify/CLAUDE_CODE_GUIDE.md`
- **README:** `.specify/README.md`
- **Spec-Kit GitHub:** https://github.com/github/spec-kit
- **Constitution:** `.specify/memory/constitution.md`

---

**Keep this file bookmarked for quick reference during development!**
