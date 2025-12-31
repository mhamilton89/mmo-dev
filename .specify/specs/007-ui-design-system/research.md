# Research & Technical Decisions: UI Design System

**Feature**: UI Design System - Overlapped
**Date**: 2025-12-30
**Status**: Completed

## Purpose

This document consolidates research findings and technical decisions made during Phase 0 planning for the RPGUI-based medieval/fantasy UI system.

## Research Areas

### 1. RPGUI Integration Patterns

**Question**: How should RPGUI v1.3+ be integrated into the existing client?

**Research Findings**:
- RPGUI is a standalone CSS/JS library requiring no build tooling
- Two integration options: CDN vs local hosting
- Library consists of:
  - rpgui.min.css (core styles)
  - rpgui.min.js (optional JavaScript utilities)
  - 48 image assets (borders, frames, textures, buttons)
- Browser compatibility: Works on all modern browsers supporting CSS3 and Flexbox
- No jQuery dependency (vanilla JavaScript)

**Decision**: **Local hosting**
- Install RPGUI assets directly in `client/rpgui-assets/` directory
- Link rpgui.min.css and rpgui.min.js from `client/styles/` and `client/scripts/`
- Commit assets to version control

**Rationale**:
- Avoids external CDN dependency (game UI shouldn't depend on third-party availability)
- Enables offline development
- Allows customization of asset paths if needed
- No build step required - simple HTML `<link>` and `<script>` tags

**Alternatives Considered**:
- ❌ CDN hosting: Single point of failure, network dependency for core UI
- ❌ npm package with build step: Adds unnecessary complexity for static CSS library

---

### 2. CSS Organization Strategy

**Question**: How should custom Overlapped theme styles be organized relative to RPGUI defaults?

**Research Findings**:
- RPGUI uses CSS custom properties (variables) for limited customization
- Framework provides base styles, but color palette is baked into CSS
- Common pattern: Load RPGUI first, then override with custom styles
- CSS cascade allows selective overrides without modifying framework files

**Decision**: **Separate theme file** (`overlapped-theme.css`)
- Load order: rpgui.min.css → overlapped-theme.css → components.css
- Theme file contains: Color palette overrides, typography (Georgia serif), shadows
- Component file contains: Screen-specific styles (login, character select, create)

**Rationale**:
- Clean separation of concerns (framework → theme → components)
- Easy to update RPGUI without losing customizations
- Theme variables can be reused across components
- No build step, standard CSS cascade

**Alternatives Considered**:
- ❌ Inline styles in HTML: Hard to maintain, violates separation of concerns
- ❌ SCSS with preprocessing: Adds build complexity, not needed for this project
- ❌ CSS-in-JS: Overkill for static styling, adds runtime overhead

---

### 3. Graceful Degradation Patterns

**Question**: What happens if RPGUI image assets fail to load?

**Research Findings**:
- RPGUI images provide decorative borders, frames, and textures
- If images 404, containers appear with no borders/backgrounds
- CSS can provide fallback styling using solid colors and borders
- Modern browsers support multiple background layers with fallback

**Decision**: **CSS-only fallback strategy**
- Define fallback styles in `overlapped-theme.css`
- Use CSS borders, box-shadows, and gradients as image replacements
- Maintain color palette (gold borders, parchment backgrounds) without images

**Implementation**:
```css
.rpgui-container.framed-golden {
  /* RPGUI image borders (if loaded) */
  border-image-source: url('../rpgui-assets/frames/golden-frame.png');

  /* Fallback: solid gold border + shadow (if images fail) */
  border: 3px solid #FFD700;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.4);
  background: rgba(245, 245, 220, 0.95); /* parchment fallback */
}
```

**Rationale**:
- Maintains usability even if CDN fails or assets are missing
- No JavaScript required for fallback detection
- Graceful degradation is automatic via CSS cascade

**Alternatives Considered**:
- ❌ JavaScript detection and re-render: Added complexity, flash of unstyled content
- ❌ No fallback: Poor UX, broken-looking UI if assets don't load
- ❌ Server-side detection: Not applicable for static client assets

---

### 4. Responsive Design Approach

**Question**: How to implement desktop-first responsive design with basic mobile support?

**Research Findings**:
- Target desktop resolutions: 1920x1080 (primary), 1366x768 (secondary)
- Minimum mobile viewport: 375px width (iPhone SE, older devices)
- RPGUI components use fixed pixel dimensions by default
- CSS media queries allow viewport-specific styling

**Decision**: **Desktop-optimized with mobile-readable fallback**
- Default styles: Optimized for 1920x1080 (no media query)
- Media query @1366px: Adjust font sizes, spacing for smaller laptops
- Media query @768px and below: Stack containers, increase touch targets
- Mobile (375px min): Ensure horizontal scrolling if needed, but readable text

**Implementation**:
```css
/* Default: 1920x1080 */
.rpgui-container { width: 600px; }
h1 { font-size: 48px; }

/* Laptop: 1366x768 */
@media (max-width: 1366px) {
  .rpgui-container { width: 500px; }
  h1 { font-size: 40px; }
}

/* Tablet/Mobile: 768px and below */
@media (max-width: 768px) {
  .rpgui-container { width: 90%; max-width: 400px; }
  h1 { font-size: 32px; }
}

/* Mobile: 375px minimum */
@media (max-width: 480px) {
  .rpgui-container { width: 95%; }
  h1 { font-size: 28px; }
  button { min-height: 44px; } /* iOS touch target minimum */
}
```

**Rationale**:
- Desktop-first matches primary use case (game is played on PC)
- Mobile support ensures character checking on phone is usable
- No dedicated mobile breakpoints avoids over-engineering
- Progressive enhancement from desktop down

**Alternatives Considered**:
- ❌ Mobile-first responsive: Wrong priority for desktop game
- ❌ No responsive design: Excludes mobile use case entirely
- ❌ Separate mobile stylesheet: Adds maintenance burden

---

### 5. Browser Compatibility Testing

**Question**: What compatibility issues exist for modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)?

**Research Findings**:
- All target browsers support:
  - CSS Grid (since 2017)
  - Flexbox (since 2015)
  - CSS Custom Properties / Variables (since 2016-2017)
  - CSS Transforms and Transitions (since 2012)
- No polyfills required for CSS features used by RPGUI
- Known issues:
  - Safari text rendering differences (antialiasing)
  - Edge Chromium (post-2020) has same compatibility as Chrome

**Decision**: **No polyfills required, manual testing on each browser**
- Test matrix: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- No IE11 support (spec explicitly excludes IE)
- Use standard CSS features (no vendor prefixes needed for target browsers)

**Testing Approach**:
- Manual visual regression on each browser
- Check for console errors/warnings
- Verify RPGUI components render identically
- Test hover states, focus states, transitions

**Rationale**:
- Target browsers all support modern CSS without prefixes
- Manual testing is sufficient for 4 browser targets
- No automated cross-browser testing needed for UI styling (would be overkill)

**Alternatives Considered**:
- ❌ Add autoprefixer build step: Not needed for modern browsers
- ❌ Support IE11: Spec explicitly excludes IE, would require extensive polyfills
- ❌ Automated cross-browser testing (BrowserStack): Overkill for visual styling

---

## Summary of Decisions

| Area | Decision | Key Rationale |
|------|----------|---------------|
| RPGUI Hosting | Local assets in `client/rpgui-assets/` | Avoid CDN dependency, enable offline dev |
| CSS Organization | Separate theme file (`overlapped-theme.css`) | Clean separation, easy maintenance |
| Graceful Degradation | CSS-only fallback (borders, shadows, colors) | Automatic fallback, no JS required |
| Responsive Design | Desktop-first with mobile-readable fallback | Matches primary use case (desktop game) |
| Browser Compatibility | Manual testing on 4 modern browsers, no polyfills | Target browsers support all CSS features |

## Technology Stack Confirmation

**Frontend**:
- RPGUI CSS Framework v1.3+ (MIT license)
- Vanilla CSS3 (no preprocessors)
- Vanilla JavaScript ES6+ (minimal JS, mostly CSS-driven)
- HTML5 semantic markup

**Fonts**:
- Georgia, Times New Roman (serif fallback) - for headings
- Segoe UI, Tahoma, Geneva, Verdana (sans-serif fallback) - for body text
- No web fonts required (all system fonts)

**Browser Targets**:
- Chrome 90+ (May 2021 onwards)
- Firefox 88+ (April 2021 onwards)
- Safari 14+ (September 2020 onwards)
- Edge 90+ (May 2021 onwards)

**No Build Step Required**: All CSS and JS are static files linked via HTML.

---

## Open Questions (None)

All technical unknowns from plan.md have been resolved through research. No clarifications needed.

---

## Next Steps

1. ✅ Research complete (this document)
2. → Create quickstart.md (developer setup guide)
3. → Run `/speckit.tasks` to generate implementation tasks
4. → Begin implementation following task breakdown
