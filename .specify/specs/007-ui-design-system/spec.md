# UI Design System - Overlapped

## Overview
Design and implement a medieval/fantasy UI system for Overlapped using RPGUI CSS framework. The UI should evoke the aesthetics of games like World of Warcraft and Lord of the Rings while maintaining modern usability standards.

**Status**: ✅ Phase 1-3 Complete (Login, Character Selection, Character Creation)

## Goals
- ✅ Create immersive fantasy-themed UI components
- ✅ Implement RPGUI CSS library for consistent styling
- ✅ Design login screen with fantasy aesthetic
- ✅ Establish UI patterns for in-game interfaces
- ⏳ Ensure responsive design for different screen sizes (desktop complete, mobile pending)

## Scope

### In Scope
- RPGUI library integration
- Login screen redesign
- UI component library (buttons, panels, inputs)
- Character selection screen styling
- Game branding ("Overlapped" theme)

### Out of Scope
- In-game HUD (separate spec)
- 3D rendering or game assets
- Backend authentication logic (already implemented)

## Technical Requirements

### RPGUI Integration
- ✅ Use RPGUI v1.3+ from https://github.com/RonenNess/RPGUI
- ✅ Local installation (rpgui.min.css, rpgui.min.js)
- ✅ 48 medieval-themed image assets in client/rpgui-assets/
- ✅ Configure theme colors for medieval/fantasy aesthetic

### Login Screen Components
- ✅ Fantasy-styled login form with RPGUI golden frames
- ✅ RPGUI containers (`rpgui-container framed-golden`)
- ✅ Themed input fields for email/password (parchment style)
- ✅ Fantasy-styled buttons (`rpgui-button golden`)
- ✅ "Overlapped" game title with golden serif font
- ✅ Background imagery (dark medieval gradient theme)

### Design Principles
- ✅ Maintain fantasy immersion (medieval aesthetic achieved)
- ✅ Clear visual hierarchy (golden titles, parchment inputs, framed containers)
- ✅ Accessible controls (all interactive elements clearly styled)
- ✅ Consistent theming across all screens

## Design Specification

### Color Palette
**Primary Colors:**
- Gold: `#FFD700` - Titles, accents, hover states, selected borders
- Silver: `#C0C0C0` - Subtitles, secondary text
- Parchment: `#F5F5DC` - Input field backgrounds
- Brown: `#8B7355` - Borders, input field borders
- Saddle Brown: `#8B4513` - Panel headers and accents

**Background Colors:**
- Dark Navy: `#1A1A2E` - Base background gradient start
- Midnight Blue: `#16213E` - Background gradient middle
- Deep Blue: `#0F3460` - Background gradient end
- Subtle overlays with rgba browns and greens for depth

**State Colors:**
- Error: `#FF4444` - Error messages
- Success: `#4ADE80` - Success states (inventory gold, online count)
- Warning: `#FBBF24` - Class names, chat system messages

### Typography
**Headings:**
- Font Family: `Georgia, 'Times New Roman', serif` (classic fantasy aesthetic)
- Game Title: 48px, #FFD700, letter-spacing: 2px, text-shadow
- Section Headers (h1): 32px, #FFD700, text-shadow
- Panel Headers (h3): 18px, #8B4513

**Body Text:**
- Font Family: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- Regular: 14-16px
- Subtitle: 14px italic, #C0C0C0
- Placeholders: #8B7355 (muted brown)

### Component Specifications

#### RPGUI Containers
```html
<!-- Golden framed container (main panels) -->
<div class="rpgui-container framed-golden">
  <div class="rpgui-content">
    <!-- Content here -->
  </div>
</div>

<!-- Standard framed container (secondary panels) -->
<div class="rpgui-container framed">
  <div class="rpgui-content">
    <!-- Content here -->
  </div>
</div>
```

#### RPGUI Buttons
```html
<!-- Primary action button (golden) -->
<button class="rpgui-button golden">
  <p>Button Text</p>
</button>

<!-- Secondary action button (standard) -->
<button class="rpgui-button">
  <p>Button Text</p>
</button>
```

#### Input Fields
- Background: #F5F5DC (parchment)
- Border: 2px solid #8B7355 (brown)
- Focus Border: #FFD700 (gold)
- Focus Glow: 0 0 8px rgba(255, 215, 0, 0.3)
- Placeholder Color: #8B7355

#### Character Cards
- Background: rgba(245, 245, 220, 0.9) (translucent parchment)
- Border: 2px solid #8B7355
- Hover Border: #FFD700
- Hover Transform: translateY(-2px)
- Hover Glow: 0 4px 12px rgba(255, 215, 0, 0.3)

#### Class Selection Cards
- Background: rgba(245, 245, 220, 0.9)
- Border: 3px solid #8B7355
- Selected Border: #FFD700
- Selected Background: rgba(255, 215, 0, 0.3)
- Selected Glow: 0 0 16px rgba(255, 215, 0, 0.5)

## Implementation Plan

### Phase 1: RPGUI Setup
- Add RPGUI CSS to project
- Test basic components
- Configure theme variables

### Phase 2: Login Screen
- Redesign login form with RPGUI
- Add "Overlapped" branding
- Implement fantasy-themed backgrounds
- Style form elements (inputs, buttons)

### Phase 3: Character Selection
- Apply RPGUI styling to character selection
- Fantasy-themed character cards
- Consistent navigation elements

## Dependencies
- RPGUI CSS library
- Existing authentication system
- Current HTML structure

## Success Criteria
- [ ] RPGUI library integrated and functional
- [ ] Login screen uses fantasy-themed components
- [ ] "Overlapped" branding clearly visible
- [ ] All interactive elements styled with RPGUI
- [ ] UI is responsive on desktop browsers
- [ ] Consistent theme across login and character selection
