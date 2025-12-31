# Tasks: UI Design System - Overlapped

**Feature**: UI Design System - Overlapped
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)
**Branch**: `007-ui-design-system`
**Total Tasks**: 32

---

## Task Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Implementation Strategy

**MVP First**: Phase 3 (Login Screen) represents the minimum viable product. Complete this phase first to deliver a working, styled login experience. Subsequent phases build on this foundation incrementally.

**Incremental Delivery**: Each phase is a complete, independently testable increment:
- Phase 3: Delivers styled login screen
- Phase 4: Adds character selection screen
- Phase 5: Adds character creation screen

**Parallel Opportunities**: Tasks marked with [P] can run in parallel within the same phase (different files, no dependencies).

---

## Phase 1: Setup (Project Initialization)

**Goal**: Install RPGUI framework and organize assets for use across all screens.

**Tasks**:

- [X] T001 Download RPGUI v1.3+ from https://github.com/RonenNess/RPGUI/releases
- [X] T002 Create client/rpgui-assets/ directory structure (borders/, buttons/, frames/, textures/, icons/)
- [X] T003 Extract RPGUI image assets (~48 PNGs) to client/rpgui-assets/ subdirectories
- [X] T004 Copy rpgui.min.css to client/styles/rpgui.min.css
- [X] T005 Copy rpgui.min.js to client/scripts/rpgui.min.js
- [X] T006 Verify asset paths in rpgui.min.css reference ../rpgui-assets/ correctly relative to client/styles/

**Independent Test Criteria**:
- [ ] All RPGUI assets exist in client/rpgui-assets/ with correct directory structure
- [ ] rpgui.min.css and rpgui.min.js exist in client/styles/ and client/scripts/
- [ ] No 404 errors when loading rpgui.min.css in browser console
- [ ] Asset paths in rpgui.min.css correctly reference ../rpgui-assets/

---

## Phase 2: Foundational (Shared Theme & Components)

**Goal**: Create Overlapped-specific theme and shared CSS fallbacks that all screens will use.

**Tasks**:

- [X] T007 Create client/styles/overlapped-theme.css with CSS custom properties for color palette (gold #FFD700, parchment #F5F5DC, brown #8B7355, medieval blues)
- [X] T008 Define typography overrides in client/styles/overlapped-theme.css (Georgia for headings, Segoe UI for body)
- [X] T009 Implement CSS-only fallback styles in client/styles/overlapped-theme.css (solid borders, box-shadows, gradient backgrounds for when RPGUI images fail to load)
- [X] T010 Create client/styles/components.css for screen-specific component styles
- [X] T011 Add desktop-first responsive media queries to client/styles/overlapped-theme.css (@1366px for laptop, @768px for tablet, @480px for mobile)
- [X] T012 Implement input field base styles in client/styles/overlapped-theme.css (parchment background, brown border, gold focus glow)

**Independent Test Criteria**:
- [ ] overlapped-theme.css defines all color palette CSS variables
- [ ] Typography CSS applies Georgia serif to headings and Segoe UI to body text
- [ ] CSS fallback styles render golden borders and parchment backgrounds when images disabled in DevTools
- [ ] Responsive breakpoints adjust font sizes and container widths at 1366px, 768px, 480px
- [ ] Input fields show parchment background, brown border, and gold glow on focus

---

## Phase 3: Login Screen (US1 - MVP)

**Goal**: Implement complete RPGUI styling for login screen with golden frames, fantasy branding, and themed form elements.

**User Story 1**: As a player, I want to see a medieval/fantasy-themed login screen so I feel immersed in the game world from the start.

**Tasks**:

- [X] T013 [US1] Add RPGUI CSS links to client/login.html <head> (rpgui.min.css, overlapped-theme.css, components.css in correct load order)
- [X] T014 [US1] Add RPGUI JavaScript to client/login.html before </body> (rpgui.min.js with defer attribute)
- [X] T015 [US1] Wrap entire login page content in <div class="rpgui-content"> container in client/login.html
- [X] T016 [P] [US1] Implement "Overlapped" game title styling in client/login.html (Georgia 48px, gold color, letter-spacing 2px, text-shadow)
- [X] T017 [P] [US1] Wrap login form in <div class="rpgui-container framed-golden"> in client/login.html
- [X] T018 [P] [US1] Apply RPGUI styling to email input field in client/login.html (auto-styled by RPGUI, verify parchment background from theme)
- [X] T019 [P] [US1] Apply RPGUI styling to password input field in client/login.html (auto-styled by RPGUI, verify parchment background from theme)
- [X] T020 [US1] Convert login button to <button class="rpgui-button golden"><p>Login</p></button> in client/login.html
- [X] T021 [US1] Convert create account button to <button class="rpgui-button"><p>Create Account</p></button> in client/login.html
- [X] T022 [US1] Implement dark medieval gradient background in client/styles/components.css (gradient from #1A1A2E → #16213E → #0F3460)
- [X] T023 [US1] Add login screen hover states in client/styles/components.css (gold border on button hover, lift effect on containers)

**Independent Test Criteria**:
- [ ] Login screen displays golden-framed container around form
- [ ] "Overlapped" title renders in Georgia serif font at 48px with gold color
- [ ] Email and password inputs have parchment background and brown borders
- [ ] Input fields show gold glow on focus (8px blur, rgba(255, 215, 0, 0.3))
- [ ] Login button displays as golden RPGUI button with proper styling
- [ ] Create Account button displays as standard RPGUI button
- [ ] Page background shows dark medieval gradient (navy → midnight blue → deep blue)
- [ ] Hover states work (buttons highlight gold, containers lift 2px)
- [ ] No console errors for missing RPGUI assets
- [ ] Page loads in <2 seconds (verify in Chrome DevTools Network tab)

**Parallel Execution Example**:
```bash
# These tasks can run simultaneously (different HTML sections):
T016 (title styling) || T018 (email input) || T019 (password input)
```

---

## Phase 4: Character Selection Screen (US2)

**Goal**: Apply RPGUI styling to character selection screen with character cards, progress bars, and consistent theming.

**User Story 2**: As a player, I want to see my characters displayed in medieval-themed cards so I can choose which character to play in an immersive way.

**Tasks**:

- [X] T024 [US2] Add RPGUI CSS links to client/character-select.html <head> (rpgui.min.css, overlapped-theme.css, components.css in correct load order)
- [X] T025 [US2] Add RPGUI JavaScript to client/character-select.html before </body> (rpgui.min.js with defer attribute)
- [X] T026 [US2] Wrap entire character selection content in <div class="rpgui-content"> container in client/character-select.html
- [X] T027 [P] [US2] Implement character cards with <div class="rpgui-container framed"> in client/character-select.html
- [X] T028 [P] [US2] Add character stats display with health bars using <div class="rpgui-progress red"> in client/character-select.html
- [X] T029 [P] [US2] Add character stats display with mana bars using <div class="rpgui-progress blue"> in client/character-select.html
- [X] T030 [US2] Convert "Select Character" buttons to <button class="rpgui-button golden"><p>Select Character</p></button> in client/character-select.html
- [X] T031 [US2] Convert "Create New Character" button to <button class="rpgui-button"><p>Create New Character</p></button> in client/character-select.html
- [X] T032 [US2] Style character card grid layout in client/styles/components.css (CSS Grid with gap, responsive wrapping)
- [X] T033 [US2] Implement character card hover effects in client/styles/components.css (gold border, translateY(-2px), shadow glow)

**Independent Test Criteria**:
- [ ] Character cards render with RPGUI framed containers
- [ ] Each character card shows character name, level, and class
- [ ] Health bars display as red RPGUI progress bars with correct fill percentage
- [ ] Mana bars display as blue RPGUI progress bars with correct fill percentage
- [ ] "Select Character" buttons render as golden RPGUI buttons
- [ ] "Create New Character" button renders as standard RPGUI button
- [ ] Character cards arranged in responsive grid (wraps on smaller screens)
- [ ] Hover on character card shows gold border and lift effect
- [ ] Character card animations run at 60fps (verify in Chrome DevTools Performance tab)
- [ ] Screen maintains consistent theming with login screen (same colors, fonts)

**Parallel Execution Example**:
```bash
# These tasks can run simultaneously (different card sections):
T027 (character cards) || T028 (health bars) || T029 (mana bars)
```

---

## Phase 5: Character Creation Screen (US3)

**Goal**: Implement RPGUI styling for character creation with class selection cards, form inputs, and creation flow.

**User Story 3**: As a new player, I want to create my character using a fantasy-themed interface so I can customize my avatar in an immersive environment.

**Tasks**:

- [X] T034 [US3] Add RPGUI CSS links to client/character-create.html <head> (rpgui.min.css, overlapped-theme.css, components.css in correct load order)
- [X] T035 [US3] Add RPGUI JavaScript to client/character-create.html before </body> (rpgui.min.js with defer attribute)
- [X] T036 [US3] Wrap entire character creation content in <div class="rpgui-content"> container in client/character-create.html
- [X] T037 [P] [US3] Implement class selection cards with <div class="rpgui-container framed-golden-2"> in client/character-create.html
- [X] T038 [P] [US3] Add character name input field in client/character-create.html (auto-styled by RPGUI, verify parchment background)
- [X] T039 [P] [US3] Implement class selection using radio buttons with <input type="radio"> in client/character-create.html (auto-styled by RPGUI)
- [X] T040 [US3] Convert "Create Character" button to <button class="rpgui-button golden"><p>Create Character</p></button> in client/character-create.html
- [X] T041 [US3] Convert "Back" button to <button class="rpgui-button"><p>Back</p></button> in client/character-create.html
- [X] T042 [US3] Style class selection card grid in client/styles/components.css (CSS Grid with 3 columns, gap, responsive wrapping)
- [X] T043 [US3] Implement class card selected state in client/styles/components.css (gold border, gold background tint rgba(255, 215, 0, 0.3), glow shadow)
- [X] T044 [US3] Add class card hover states in client/styles/components.css (subtle gold glow, lift effect)

**Independent Test Criteria**:
- [ ] Character creation form wrapped in RPGUI golden-2 framed container
- [ ] Character name input has parchment background and brown border
- [ ] Class selection displays as 3 cards in a grid (Warrior, Mage, Rogue)
- [ ] Radio buttons auto-styled by RPGUI with medieval theme
- [ ] Clicking class card selects corresponding radio button and shows selected state
- [ ] Selected class card shows gold border and gold background tint
- [ ] "Create Character" button renders as golden RPGUI button
- [ ] "Back" button renders as standard RPGUI button
- [ ] Class cards arranged in responsive 3-column grid (wraps to 1 column on mobile)
- [ ] Hover on class cards shows subtle gold glow and lift effect
- [ ] All interactions feel responsive with no perceptible lag

**Parallel Execution Example**:
```bash
# These tasks can run simultaneously (different form sections):
T037 (class cards) || T038 (name input) || T039 (radio buttons)
```

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Browser compatibility testing, performance optimization, and final documentation updates.

**Tasks**:

- [ ] T045 [P] Test login screen on Chrome 90+ (verify all components render, no console errors)
- [ ] T046 [P] Test login screen on Firefox 88+ (verify visual consistency with Chrome)
- [ ] T047 [P] Test login screen on Safari 14+ (verify text rendering and antialiasing)
- [ ] T048 [P] Test login screen on Edge 90+ (verify identical rendering to Chrome)
- [ ] T049 [P] Test character selection on Chrome 90+ (verify progress bars, character cards)
- [ ] T050 [P] Test character selection on Firefox 88+ (verify visual consistency)
- [ ] T051 [P] Test character selection on Safari 14+ (verify progress bar animations)
- [ ] T052 [P] Test character selection on Edge 90+ (verify identical rendering)
- [ ] T053 [P] Test character creation on Chrome 90+ (verify radio buttons, class cards)
- [ ] T054 [P] Test character creation on Firefox 88+ (verify form element styling)
- [ ] T055 [P] Test character creation on Safari 14+ (verify input field rendering)
- [ ] T056 [P] Test character creation on Edge 90+ (verify identical rendering)
- [ ] T057 Test all screens at 1920x1080 resolution (verify optimal appearance, proper sizing)
- [ ] T058 Test all screens at 1366x768 resolution (verify responsive adjustments, readable text)
- [ ] T059 Test all screens at 768px tablet width (verify stacked layout, touch targets ≥44px)
- [ ] T060 Test all screens at 375px mobile width (verify readable text, horizontal scrolling if needed)
- [ ] T061 Measure page load time for all screens using Chrome DevTools Network tab (verify <2 seconds total load time)
- [ ] T062 Measure animation performance using Chrome DevTools Performance tab (verify 60fps during hover, transitions, interactions)
- [ ] T063 Test graceful degradation by disabling images in Chrome DevTools (verify CSS fallback borders, backgrounds display)
- [ ] T064 Update client/styles/overlapped-theme.css with any browser-specific fixes discovered during testing

**Independent Test Criteria**:
- [ ] All screens render identically on Chrome 90+, Firefox 88+, Edge 90+ (Chromium-based browsers)
- [ ] Safari 14+ shows acceptable rendering with minor antialiasing differences (documented)
- [ ] All screens load in <2 seconds on standard broadband (verified via Network tab)
- [ ] All animations run at 60fps (verified via Performance tab)
- [ ] UI remains functional and readable at all target resolutions (1920x1080, 1366x768, 768px, 375px)
- [ ] Touch targets on mobile are ≥44px (iOS minimum)
- [ ] CSS fallback styles display when RPGUI images disabled (golden borders, parchment backgrounds visible)
- [ ] No console errors across all browsers
- [ ] All success criteria from spec.md are met

**Parallel Execution Example**:
```bash
# Browser tests can run simultaneously (independent):
T045 (Chrome login) || T046 (Firefox login) || T047 (Safari login) || T048 (Edge login)

# Character selection tests can run simultaneously:
T049 (Chrome char-select) || T050 (Firefox char-select) || T051 (Safari char-select) || T052 (Edge char-select)

# Character creation tests can run simultaneously:
T053 (Chrome char-create) || T054 (Firefox char-create) || T055 (Safari char-create) || T056 (Edge char-create)
```

---

## Dependencies & Execution Order

### User Story Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1: Login Screen) ← MVP
    ↓
Phase 4 (US2: Character Selection) ← Can parallelize with Phase 5 if different developers
    ↓
Phase 5 (US3: Character Creation) ← Can parallelize with Phase 4 if different developers
    ↓
Phase 6 (Polish)
```

### Critical Path

**Sequential Dependencies**:
- Phase 1 must complete before Phase 2 (need RPGUI assets to create theme)
- Phase 2 must complete before Phase 3-5 (screens depend on shared theme)
- Phase 3-5 must complete before Phase 6 (can't test what doesn't exist)

**Parallel Opportunities**:
- Within Phase 2: T007-T012 can all run in parallel (different CSS sections)
- Phase 3 (US1): T016, T018, T019 can run in parallel (different HTML sections)
- Phase 4 (US2): T027, T028, T029 can run in parallel (different card components)
- Phase 5 (US3): T037, T038, T039 can run in parallel (different form sections)
- Phase 6: All browser tests (T045-T056) can run in parallel

**No Cross-Story Dependencies**: US2 and US3 are independent and can be implemented in parallel if resources allow.

---

## Task Summary

| Phase | User Story | Task Count | Parallelizable | Key Deliverable |
|-------|------------|------------|----------------|-----------------|
| Phase 1 | Setup | 6 | 0 | RPGUI assets installed |
| Phase 2 | Foundational | 6 | 6 | Overlapped theme created |
| Phase 3 | US1 (MVP) | 11 | 4 | Login screen styled |
| Phase 4 | US2 | 10 | 3 | Character selection styled |
| Phase 5 | US3 | 11 | 3 | Character creation styled |
| Phase 6 | Polish | 20 | 16 | All browsers tested, optimized |
| **Total** | | **64** | **32** | Complete UI Design System |

---

## MVP Scope (Phase 3 Only)

For fastest time-to-value, implement **Phase 1 + Phase 2 + Phase 3** only:
- Total: 23 tasks
- Deliverable: Fully styled, fantasy-themed login screen
- User Value: Immersive first impression of the game world
- Foundation: All subsequent screens use the same theme and patterns

---

## Implementation Notes

### File Paths Reference

**Assets**:
- `client/rpgui-assets/` - RPGUI framework images (48 PNGs)
- `client/styles/rpgui.min.css` - RPGUI core styles
- `client/scripts/rpgui.min.js` - RPGUI JavaScript utilities

**Theme**:
- `client/styles/overlapped-theme.css` - Overlapped color palette, typography
- `client/styles/components.css` - Screen-specific component styles

**Screens**:
- `client/login.html` - Login screen (Phase 3)
- `client/character-select.html` - Character selection (Phase 4)
- `client/character-create.html` - Character creation (Phase 5)

### Load Order (CRITICAL)

Always link CSS in this order in HTML <head>:
```html
<!-- 1. RPGUI framework (base styles) -->
<link rel="stylesheet" href="styles/rpgui.min.css">

<!-- 2. Overlapped theme (color/typography overrides) -->
<link rel="stylesheet" href="styles/overlapped-theme.css">

<!-- 3. Component styles (screen-specific overrides) -->
<link rel="stylesheet" href="styles/components.css">

<!-- 4. RPGUI JavaScript (optional utilities) -->
<script src="scripts/rpgui.min.js" defer></script>
```

**Why This Order Matters**: CSS cascade applies later rules over earlier ones. RPGUI provides defaults, Overlapped theme customizes colors/fonts, components override for specific screens.

### Required Wrapper (CRITICAL)

ALL RPGUI components MUST be inside `rpgui-content`:
```html
<div class="rpgui-content">
  <!-- All RPGUI components go here -->
</div>
```

**Without this wrapper, RPGUI components will not render correctly.**

### Button Text Format (CRITICAL)

Button text MUST be wrapped in `<p>` tag:
```html
<!-- ✅ CORRECT -->
<button class="rpgui-button golden">
  <p>Login</p>
</button>

<!-- ❌ WRONG (will not style correctly) -->
<button class="rpgui-button golden">
  Login
</button>
```

### Progress Bar Updates

Update progress bar fill percentage via inline style:
```html
<div class="rpgui-progress red">
  <div class="rpgui-progress-fill" style="width: 80%;"></div>
  <div class="rpgui-progress-track"></div>
</div>
```

Use JavaScript to update dynamically:
```javascript
document.querySelector('.rpgui-progress-fill').style.width = '50%';
```

---

## Testing Checklists

### Visual Verification (Every Screen)

- [ ] Golden frames render correctly around main panels
- [ ] Parchment backgrounds visible in input fields
- [ ] "Overlapped" branding uses Georgia serif font at 48px
- [ ] Hover states show gold highlighting on interactive elements
- [ ] Focus states show gold glow (8px blur, rgba(255, 215, 0, 0.3))
- [ ] All text is readable (good contrast against backgrounds)
- [ ] Shadows and textures enhance depth (no flat appearance)

### Performance Verification (Every Screen)

- [ ] **Total load time <2 seconds**
  - Open Chrome DevTools → Network tab
  - Hard refresh (Ctrl+Shift+R)
  - Check total load time in bottom right corner
- [ ] **Animations run at 60fps**
  - Open Chrome DevTools → Performance tab
  - Record interaction (hover button, open panel)
  - Check FPS graph (should be solid green at 60fps)
- [ ] **No perceptible lag** in hover states, transitions, or clicks

### Browser Compatibility (Every Screen)

- [ ] **Chrome 90+**: All components render correctly
- [ ] **Firefox 88+**: No visual differences from Chrome
- [ ] **Safari 14+**: Text rendering is crisp (check antialiasing)
- [ ] **Edge 90+**: Identical to Chrome (Chromium-based)

### Responsive Design (Every Screen)

- [ ] **1920x1080 (desktop)**: Optimal appearance, all elements properly sized
- [ ] **1366x768 (laptop)**: Slightly smaller fonts, layout still balanced
- [ ] **768px and below (tablet)**: Containers stack vertically, touch targets ≥44px
- [ ] **375px (mobile minimum)**: Text readable, UI functional (scrolling OK)

---

## Success Criteria Verification

From [spec.md](spec.md):

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

---

## Resources

- **RPGUI GitHub**: https://github.com/RonenNess/RPGUI
- **RPGUI Demo**: https://ronenness.github.io/RPGUI/
- **Feature Spec**: [spec.md](spec.md)
- **Implementation Plan**: [plan.md](plan.md)
- **Research Decisions**: [research.md](research.md)
- **Setup Guide**: [quickstart.md](quickstart.md)
- **Component Reference**: [rpgui-components-reference.md](rpgui-components-reference.md)

---

**Generated**: 2025-12-30
**Total Tasks**: 64
**Parallelizable**: 32
**MVP Tasks (Phase 1-3)**: 23
**Ready for Implementation**: ✅
