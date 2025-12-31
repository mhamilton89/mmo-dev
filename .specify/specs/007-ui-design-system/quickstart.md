# Quick Start: UI Design System - Overlapped

**Last Updated**: 2025-12-30
**Target Audience**: Developers implementing or modifying the RPGUI-themed UI

## Overview

This guide helps you set up and work with the medieval/fantasy UI system built on the RPGUI framework. Follow these steps to integrate RPGUI styling into existing screens or create new fantasy-themed UI components.

---

## Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)
- Basic knowledge of HTML and CSS
- Access to `client/` directory in the project repository

---

## Setup Instructions

### 1. Install RPGUI Assets

The RPGUI framework assets should already be present in the repository. Verify the following files exist:

```text
client/
├── rpgui-assets/           # 48 medieval-themed image assets
│   ├── borders/
│   ├── buttons/
│   ├── frames/
│   └── textures/
├── styles/
│   ├── rpgui.min.css       # RPGUI core styles (v1.3+)
│   ├── overlapped-theme.css # Custom Overlapped theme
│   └── components.css       # Screen-specific styles
└── scripts/
    └── rpgui.min.js        # RPGUI JavaScript utilities
```

**If assets are missing**:
1. Download RPGUI v1.3+ from https://github.com/RonenNess/RPGUI
2. Extract image assets to `client/rpgui-assets/`
3. Copy `rpgui.min.css` to `client/styles/`
4. Copy `rpgui.min.js` to `client/scripts/`

### 2. Link RPGUI in HTML Files

Add these lines to the `<head>` section of your HTML file:

```html
<!-- RPGUI Framework (load first) -->
<link rel="stylesheet" href="styles/rpgui.min.css">

<!-- Overlapped Custom Theme (load second) -->
<link rel="stylesheet" href="styles/overlapped-theme.css">

<!-- Component Styles (load last) -->
<link rel="stylesheet" href="styles/components.css">

<!-- RPGUI JavaScript (optional, for advanced features) -->
<script src="scripts/rpgui.min.js" defer></script>
```

**Load Order Matters**: RPGUI base styles → Custom theme → Component overrides

### 3. Verify Assets Load Correctly

1. Open your HTML file in a browser
2. Open Developer Tools (F12)
3. Check the **Console** tab for 404 errors
4. Check the **Network** tab to ensure all CSS/JS files loaded successfully

**Common Issues**:
- 404 errors for images: Check that `rpgui-assets/` path is correct relative to your HTML file
- CSS not applying: Verify `<link>` tags are in the correct order
- Fonts not loading: Ensure Georgia and Segoe UI are available (system fonts)

---

## Development Workflow

### Working with RPGUI Components

RPGUI provides pre-styled components using specific CSS classes. Here are the most common:

#### Golden Framed Container (Main Panels)

```html
<div class="rpgui-container framed-golden">
  <div class="rpgui-content">
    <h3>Panel Title</h3>
    <p>Content goes here...</p>
  </div>
</div>
```

#### Standard Framed Container (Secondary Panels)

```html
<div class="rpgui-container framed">
  <div class="rpgui-content">
    <p>Secondary content...</p>
  </div>
</div>
```

#### Golden Button (Primary Actions)

```html
<button class="rpgui-button golden">
  <p>Login</p>
</button>
```

#### Standard Button (Secondary Actions)

```html
<button class="rpgui-button">
  <p>Cancel</p>
</button>
```

#### Input Fields

Input fields use custom styling defined in `overlapped-theme.css`:

```html
<input type="text" class="rpg-input" placeholder="Enter your email">
<input type="password" class="rpg-input" placeholder="Enter your password">
```

### Customizing Theme Colors

Overlapped uses a specific color palette defined in `overlapped-theme.css`:

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gold | `#FFD700` | Titles, accents, hover states, selected borders |
| Silver | `#C0C0C0` | Subtitles, secondary text |
| Parchment | `#F5F5DC` | Input field backgrounds |
| Brown | `#8B7355` | Borders, input field borders |
| Saddle Brown | `#8B4513` | Panel headers and accents |
| Dark Navy | `#1A1A2E` | Background gradient start |
| Midnight Blue | `#16213E` | Background gradient middle |
| Deep Blue | `#0F3460` | Background gradient end |

**To modify colors**: Edit `client/styles/overlapped-theme.css` and search for the hex code.

**Example**:
```css
/* Change gold accent color */
.rpgui-container.framed-golden {
  border-color: #FFD700; /* Change this to your desired color */
}
```

### Responsive Design Guidelines

The UI is **desktop-optimized** with basic mobile support. Test your changes at these breakpoints:

| Breakpoint | Target Device | Notes |
|------------|---------------|-------|
| 1920x1080 | Desktop (primary) | Default styles, no media query |
| 1366x768 | Laptop | Smaller fonts and spacing |
| 768px and below | Tablet | Stacked layout, larger touch targets |
| 375px | Mobile (minimum) | Readable text, horizontal scroll if needed |

**Test Responsive Behavior**:
1. Open Chrome DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M)
3. Select a device or enter custom dimensions
4. Verify UI is readable and functional

---

## Testing Checklist

Use this checklist when adding or modifying UI screens:

### Visual Verification

- [ ] Golden frames render correctly around main panels
- [ ] Parchment backgrounds visible in input fields
- [ ] "Overlapped" branding uses Georgia serif font at 48px
- [ ] Hover states show gold highlighting on interactive elements
- [ ] Focus states show gold glow (8px blur, rgba(255, 215, 0, 0.3))
- [ ] All text is readable (good contrast against backgrounds)
- [ ] Shadows and textures enhance depth (no flat appearance)

### Performance Verification

- [ ] **Total load time <2 seconds**
  - Open Chrome DevTools → Network tab
  - Hard refresh (Ctrl+Shift+R)
  - Check total load time in bottom right corner
- [ ] **Animations run at 60fps**
  - Open Chrome DevTools → Performance tab
  - Record interaction (hover button, open panel)
  - Check FPS graph (should be solid green at 60fps)
- [ ] **No perceptible lag** in hover states, transitions, or clicks

### Browser Compatibility

Test on all target browsers:

- [ ] **Chrome 90+**: All components render correctly
- [ ] **Firefox 88+**: No visual differences from Chrome
- [ ] **Safari 14+**: Text rendering is crisp (check antialiasing)
- [ ] **Edge 90+**: Identical to Chrome (Chromium-based)

**How to Test**:
1. Open the same HTML file in each browser
2. Compare screenshots side-by-side
3. Check browser console for warnings/errors
4. Verify all RPGUI images loaded (Network tab)

### Graceful Degradation

Test what happens if RPGUI images fail to load:

- [ ] **Disable images in Chrome DevTools**:
  - DevTools → Settings (gear icon) → Debugger → "Disable cache" + "Disable images"
  - Hard refresh page
- [ ] **Verify CSS fallbacks display**:
  - Solid gold borders appear instead of image borders
  - Parchment background colors visible
  - Box shadows provide depth
  - UI remains functional and readable

### Responsive Design

Test at each breakpoint:

- [ ] **1920x1080 (desktop)**: Optimal appearance, all elements properly sized
- [ ] **1366x768 (laptop)**: Slightly smaller fonts, layout still balanced
- [ ] **768px and below (tablet)**: Containers stack vertically, touch targets ≥44px
- [ ] **375px (mobile minimum)**: Text readable, UI functional (scrolling OK)

**Mobile-Specific Checks**:
- Touch targets (buttons, inputs) are at least 44x44px
- Text size ≥16px to prevent auto-zoom on iOS
- Horizontal scrolling is smooth (if needed)

---

## Common Issues and Solutions

### Issue: RPGUI Images Not Loading (404 Errors)

**Symptoms**: Containers appear with no borders, buttons have no textures

**Solution**:
1. Check `rpgui.min.css` for asset paths: `url('../rpgui-assets/...')`
2. Verify `rpgui-assets/` folder exists relative to `styles/` directory
3. Check file names match exactly (case-sensitive on Linux servers)

**Quick Fix**: Assets should be one directory up from `styles/`:
```
client/
├── styles/
│   └── rpgui.min.css (references ../rpgui-assets/)
└── rpgui-assets/
    └── borders/
```

### Issue: Fonts Not Rendering Correctly

**Symptoms**: Text appears in default browser font, not Georgia or Segoe UI

**Solution**:
1. Check `overlapped-theme.css` font-family declarations
2. Verify system fonts are available:
   - Georgia (serif) - Windows, macOS built-in
   - Segoe UI (sans-serif) - Windows built-in
3. Fallback fonts will be used if primary fonts unavailable

**Note**: No web fonts are required; all fonts are system fonts.

### Issue: Animations Stuttering or Laggy

**Symptoms**: Hover effects, transitions appear choppy

**Solution**:
1. Check if `will-change: transform` is applied to animated elements
2. Use CSS `transform` instead of `left`/`top` for animations (GPU-accelerated)
3. Reduce number of simultaneous animations
4. Check Performance tab in DevTools for bottlenecks

**Example Fix**:
```css
/* Bad: CPU-intensive */
.hover-effect {
  transition: left 0.3s;
}

/* Good: GPU-accelerated */
.hover-effect {
  transition: transform 0.3s;
  will-change: transform;
}
.hover-effect:hover {
  transform: translateY(-2px);
}
```

### Issue: Mobile Touch Targets Too Small

**Symptoms**: Buttons hard to tap on mobile devices

**Solution**:
1. Ensure buttons have `min-height: 44px` in mobile media query
2. Add `min-width: 44px` for icon buttons
3. Increase padding if needed: `padding: 12px 20px`

**iOS Guideline**: 44x44px minimum touch target (Apple HIG)
**Android Guideline**: 48x48dp minimum touch target (Material Design)

---

## RPGUI Component Reference

Quick reference for common RPGUI classes:

| Component | HTML Class | Description |
|-----------|------------|-------------|
| Golden Frame | `.rpgui-container.framed-golden` | Main panel with golden borders |
| Standard Frame | `.rpgui-container.framed` | Secondary panel with standard borders |
| Golden Button | `.rpgui-button.golden` | Primary action button (gold styling) |
| Standard Button | `.rpgui-button` | Secondary action button |
| Progress Bar | `.rpgui-progress` | HP/MP bar with fantasy styling |
| Checkbox | `.rpgui-checkbox` | Custom styled checkbox |
| Radio Button | `.rpgui-radio` | Custom styled radio button |
| Slider | `.rpgui-slider` | Fantasy-themed range slider |

**Full Documentation**: https://github.com/RonenNess/RPGUI

---

## File Organization

When adding new screens or components, follow this structure:

```text
client/
├── login.html              # Login screen (RPGUI-styled)
├── character-select.html   # Character selection (RPGUI-styled)
├── character-create.html   # Character creation (RPGUI-styled)
├── styles/
│   ├── rpgui.min.css       # Framework (don't modify)
│   ├── overlapped-theme.css # Shared theme (modify colors here)
│   └── components.css       # Screen-specific styles (add new screens here)
└── scripts/
    └── rpgui.min.js        # Framework utilities (don't modify)
```

**Best Practices**:
- Don't modify `rpgui.min.css` or `rpgui.min.js` (framework files)
- Add theme-wide changes to `overlapped-theme.css`
- Add screen-specific styles to `components.css`
- Use CSS comments to document component purposes

---

## Next Steps

After setup is complete:

1. ✅ Verify RPGUI assets loaded successfully (no 404s in console)
2. → Review [plan.md](plan.md) for implementation phases
3. → Run `/speckit.tasks` to generate actionable task breakdown
4. → Begin implementation following task order
5. → Test each screen using the checklist above before considering it complete

---

## Support and Resources

- **RPGUI GitHub**: https://github.com/RonenNess/RPGUI
- **RPGUI Demo**: https://ronenness.github.io/RPGUI/
- **Project Spec**: [spec.md](spec.md)
- **Implementation Plan**: [plan.md](plan.md)
- **Research Decisions**: [research.md](research.md)

---

**Questions or Issues?** Check [research.md](research.md) for technical decisions, or refer to the RPGUI GitHub repository for framework-specific questions.
