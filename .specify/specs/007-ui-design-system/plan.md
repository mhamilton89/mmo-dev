# Implementation Plan: UI Design System - Overlapped

**Branch**: `007-ui-design-system` | **Date**: 2025-12-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `.specify/specs/007-ui-design-system/spec.md`

## Summary

Implement a medieval/fantasy UI system for Overlapped using the RPGUI CSS framework. The UI provides desktop-optimized experience with basic mobile support, featuring golden frames, parchment textures, and medieval theming across login, character selection, and character creation screens. Performance targets include <2s load time and smooth 60fps animations on modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript (ES6+)
**Primary Dependencies**: RPGUI CSS v1.3+ (https://github.com/RonenNess/RPGUI), existing Phaser 3.90+ game client
**Storage**: N/A (UI styling only, game state managed by existing backend)
**Testing**: Manual browser testing (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+), visual regression testing
**Target Platform**: Modern web browsers (desktop-optimized, basic mobile support min 375px width)
**Project Type**: Web frontend enhancement
**Performance Goals**: UI loads <2s, animations run at 60fps, no perceptible interaction lag
**Constraints**: Desktop-optimized (1920x1080, 1366x768), graceful degradation for RPGUI asset loading failures, no IE support
**Scale/Scope**: 3 main screens (login, character selection, character creation), ~10 reusable UI components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**P2-PERFORMANCE (Real-Time Performance):**
- ✅ PASS: Client rendering MUST achieve 60 FPS - Spec requires smooth animations with no lag
- ✅ PASS: UI must be responsive - Spec requires no perceptible delay in user interactions

**P9-UX (Player Experience):**
- ✅ PASS: UI actions MUST provide immediate visual feedback - Spec includes hover states, focus states, transitions
- ✅ PASS: Error messages MUST be player-friendly - Accessibility handled as discovered during testing
- ✅ PASS: UI changes MUST reflect immediately - Performance constraint: no perceptible delay

**P5-ASSETS (Art Asset Standards):**
- ⚠️ PARTIAL: Uses RPGUI framework (external asset pack) - Not LPC format, but UI styling, not game sprites
- **Justification**: RPGUI provides medieval-themed UI assets specifically designed for fantasy game interfaces. This is complementary to LPC sprite standard for game characters/items. No conflict.

**P10-WORKFLOW (Development Workflow):**
- ✅ PASS: Feature began with spec.md (completed with clarifications)
- ✅ PASS: Technical decisions documented in this plan.md
- ✅ PASS: Following spec-driven development process

**CONCLUSION**: All gates PASS. No constitution violations. Minor note on P5-ASSETS but justified as UI framework vs. sprite assets.

## Project Structure

### Documentation (this feature)

```text
.specify/specs/007-ui-design-system/
├── spec.md              # Feature specification (completed with clarifications)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (RPGUI integration patterns, CSS organization)
├── data-model.md        # Not needed (UI-only feature, no data entities)
├── quickstart.md        # Phase 1 output (setup guide for RPGUI, testing checklist)
├── contracts/           # Not needed (no API contracts for styling)
└── tasks.md             # Phase 2 output (created by /speckit.tasks command)
```

### Source Code (repository root)

```text
client/
├── rpgui-assets/           # RPGUI framework image assets (48 medieval-themed PNGs)
│   ├── borders/
│   ├── buttons/
│   ├── frames/
│   └── textures/
├── styles/
│   ├── rpgui.min.css       # RPGUI core styles (v1.3+)
│   ├── overlapped-theme.css # Custom color palette and typography
│   └── components.css       # Component-specific overrides
├── scripts/
│   └── rpgui.min.js        # RPGUI JavaScript utilities
├── login.html              # Login screen (existing, will be restyled)
├── character-select.html   # Character selection (existing, will be restyled)
└── character-create.html   # Character creation (existing, will be restyled)
```

**Structure Decision**: Extending existing client directory with RPGUI framework and custom theme files. RPGUI assets live in dedicated `rpgui-assets/` folder. Theme customizations in `styles/overlapped-theme.css` to override RPGUI defaults with project-specific color palette (gold, parchment, medieval blues).

## Complexity Tracking

> No constitution violations requiring justification.

## Phase 0: Outline & Research

### Research Tasks

1. **RPGUI Integration Patterns**
   - Task: Research RPGUI v1.3+ setup and best practices for game UI
   - Focus: Installation methods, browser compatibility, known issues
   - Output: Decision on local vs CDN hosting, build process requirements

2. **CSS Organization Strategy**
   - Task: Determine optimal CSS architecture for theming RPGUI
   - Focus: Override patterns, CSS cascade management, maintainability
   - Output: Decision on CSS file structure (separate theme file vs inline overrides)

3. **Graceful Degradation Patterns**
   - Task: Research CSS fallback strategies for image asset loading failures
   - Focus: How to maintain usability when RPGUI images don't load
   - Output: CSS-only fallback styles (borders, backgrounds, colors)

4. **Responsive Design Approach**
   - Task: Best practices for desktop-first responsive design with basic mobile support
   - Focus: Viewport units, fluid typography, touch-friendly minimums
   - Output: Media query breakpoints, mobile viewport strategy (375px min)

5. **Browser Compatibility Testing**
   - Task: Identify compatibility issues for modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
   - Focus: CSS Grid, Flexbox, CSS variables support, RPGUI compatibility
   - Output: Polyfill requirements (if any), known browser quirks

### Consolidation (research.md)

**Outputs**:
- RPGUI installation decision (local vs CDN)
- CSS file organization pattern
- Graceful degradation strategy
- Responsive design breakpoints
- Browser compatibility matrix

## Phase 1: Design & Contracts

### Data Model (data-model.md)

**Not Required**: UI Design System is a styling/presentation layer feature with no data entities, state transitions, or persistence requirements. All game data (users, characters, inventory) is handled by existing backend systems referenced in other specs.

### API Contracts (contracts/)

**Not Required**: No new API endpoints needed. UI styles are applied to existing HTML rendered by client. WebSocket communication for game state is handled by existing infrastructure (not changed by this feature).

### Quick Start Guide (quickstart.md)

**Purpose**: Developer setup guide for working with RPGUI-styled UI

**Contents**:
1. **Setup Instructions**
   - Clone RPGUI assets into `client/rpgui-assets/`
   - Link RPGUI CSS/JS in HTML files
   - Verify assets load correctly (check browser console for 404s)

2. **Development Workflow**
   - How to customize theme colors in `overlapped-theme.css`
   - RPGUI component class reference (containers, buttons, inputs)
   - Testing checklist for each browser

3. **Testing Checklist**
   - Visual verification: golden frames render, parchment backgrounds visible
   - Performance: DevTools network tab shows <2s load, 60fps animations
   - Browser compatibility: Test on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
   - Graceful degradation: Disable images in DevTools, verify CSS fallbacks work
   - Responsive: Test at 1920x1080, 1366x768, 375px mobile viewport

4. **Common Issues**
   - RPGUI asset 404 errors → Check file paths in rpgui.min.css
   - Fonts not loading → Verify Google Fonts CDN or local font files
   - Animations stuttering → Check for CSS transform will-change property

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to add:
- RPGUI CSS framework v1.3+ (medieval/fantasy UI library)
- Custom theme: Overlapped color palette (gold #FFD700, parchment #F5F5DC, medieval blues)
- Browser targets: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Performance constraints: <2s load, 60fps animations

## Implementation Notes

### Key Design Decisions

1. **RPGUI Framework Choice**
   - **Decision**: Use RPGUI v1.3+ for medieval/fantasy theming
   - **Rationale**: Mature framework with extensive medieval UI assets, active maintenance, MIT license
   - **Alternatives Considered**: Custom CSS from scratch (too time-consuming), other game UI frameworks (less medieval focus)

2. **Local Asset Hosting**
   - **Decision**: Host RPGUI assets locally in `client/rpgui-assets/`
   - **Rationale**: Avoids CDN dependencies, ensures asset availability, enables offline development
   - **Alternatives Considered**: CDN hosting (single point of failure for game UI)

3. **CSS Architecture**
   - **Decision**: Separate `overlapped-theme.css` for color/typography overrides
   - **Rationale**: Cleanly separates framework defaults from project customizations, easier maintenance
   - **Alternatives Considered**: Inline styles (harder to maintain), SCSS with build step (adds complexity)

4. **Graceful Degradation Strategy**
   - **Decision**: CSS-only fallbacks (solid borders, background colors) when images fail
   - **Rationale**: Maintains usability even if RPGUI assets don't load, simple implementation
   - **Alternatives Considered**: JavaScript detection and re-render (added complexity), no fallback (poor UX)

5. **Desktop-First Responsive Approach**
   - **Decision**: Optimize for 1920x1080 and 1366x768, ensure basic mobile functionality at 375px min
   - **Rationale**: Game primarily played on desktop, mobile is secondary use case (character checking)
   - **Alternatives Considered**: Mobile-first (wrong priority), no mobile support (excludes use case)

### Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RPGUI assets fail to load | High (broken UI) | CSS-only fallback styles, local asset hosting |
| Browser compatibility issues | Medium (excludes users) | Test on all target browsers, use standard CSS features |
| Performance degradation | Medium (poor UX) | Optimize image sizes, use CSS transforms for animations, lazy load non-critical assets |
| RPGUI framework updates break styling | Low (rare updates) | Pin to v1.3+ in documentation, test after updates |

### Testing Strategy

1. **Visual Regression Testing**
   - Manual screenshots of all 3 screens (login, character select, character create)
   - Compare before/after RPGUI integration
   - Verify color palette consistency (gold, parchment, medieval blues)

2. **Performance Testing**
   - Chrome DevTools Network tab: Verify <2s total load time
   - Chrome DevTools Performance tab: Verify 60fps animations during hover/transitions
   - Test on target resolutions: 1920x1080, 1366x768, 375px mobile

3. **Browser Compatibility Testing**
   - Test matrix: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
   - Verify all RPGUI components render correctly
   - Check for console errors or warnings

4. **Graceful Degradation Testing**
   - Disable images in Chrome DevTools
   - Verify CSS fallback borders and backgrounds display
   - Ensure UI remains functional and readable

## Phase 2: Task Breakdown

**Note**: Task breakdown is generated by `/speckit.tasks` command (separate from this plan).

Tasks will cover:
- RPGUI library setup and asset organization
- Theme customization (color palette, typography)
- Login screen restyling
- Character selection screen restyling
- Character creation screen restyling
- Browser compatibility testing
- Performance optimization
- Documentation updates

## Success Criteria Verification

From spec.md Success Criteria:
- [ ] RPGUI library integrated and functional
- [ ] Login screen uses fantasy-themed components
- [ ] "Overlapped" branding clearly visible
- [ ] All interactive elements styled with RPGUI
- [ ] UI is optimized for desktop browsers (1920x1080 and 1366x768)
- [ ] UI remains readable and functional on mobile devices (minimum 375px width)
- [ ] Consistent theme across login and character selection
- [ ] UI loads in under 2 seconds
- [ ] Animations are smooth with no noticeable lag
- [ ] UI works correctly on modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Verification Method**: Manual testing checklist documented in quickstart.md

---

**Next Steps**: Run `/speckit.tasks` to generate actionable task breakdown for implementation.
