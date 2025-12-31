# RPGUI Components Reference

**Source**: https://github.com/RonenNess/RPGUI
**Demo**: https://ronenness.github.io/RPGUI/
**Date**: 2025-12-30
**Purpose**: Complete reference for implementing RPGUI-styled UI in Overlapped

---

## Core Concepts

### Required Wrapper

**ALL RPGUI elements MUST be inside `rpgui-content`:**

```html
<div class="rpgui-content">
  <!-- All RPGUI components go here -->
</div>
```

**Why**: This class provides the base styling context for all RPGUI components.

---

## Container & Frame Types

### Base Container

```html
<div class="rpgui-container">
  <!-- Content without frame border -->
</div>
```

### Frame Variations

#### 1. Standard Frame (Grey with Orange Borders)

```html
<div class="rpgui-container framed">
  <!-- Default grey frame with orange borders -->
  <h3>Container Title</h3>
  <p>Container content...</p>
</div>
```

**Use Case**: General purpose containers, secondary panels

#### 2. Golden Frame (Brown Background)

```html
<div class="rpgui-container framed-golden">
  <!-- Golden frame with brown background -->
  <h3>Important Panel</h3>
  <p>Main content...</p>
</div>
```

**Use Case**: Main panels, primary content areas, highlighted sections

#### 3. Brighter Golden Frame (Smoother Borders)

```html
<div class="rpgui-container framed-golden-2">
  <!-- Brighter golden frame, smoother borders -->
  <h3>Premium Panel</h3>
  <p>Special content...</p>
</div>
```

**Use Case**: Premium features, special announcements, VIP content

#### 4. Grey Frame (Internal Container)

```html
<div class="rpgui-container framed-grey">
  <!-- Mostly used as internal container inside other framed divs -->
  <p>Nested content...</p>
</div>
```

**Use Case**: Nested containers inside other framed containers

### Nesting Example

```html
<div class="rpgui-container framed-golden">
  <h3>Character Stats</h3>

  <div class="rpgui-container framed-grey">
    <p>Health: 100</p>
    <p>Mana: 80</p>
  </div>
</div>
```

---

## Buttons

### Standard Button

```html
<button class="rpgui-button">
  <p>Click Me</p>
</button>
```

**States**:
- Default: Normal appearance
- Hover: Lighter appearance on mouse over
- Pressed: Darker appearance when clicked

### Golden Button

```html
<button class="rpgui-button golden">
  <p>Primary Action</p>
</button>
```

**Use Case**: Primary actions (Login, Create Character, Confirm, etc.)

**Important**: Button text MUST be wrapped in `<p>` tag for proper styling.

### Disabled Button

```html
<button class="rpgui-button" disabled>
  <p>Disabled Action</p>
</button>
```

**Visual**: Grayed out, non-interactive

---

## Form Elements

All form elements automatically receive RPGUI styling when inside `rpgui-content`. No special classes needed.

### Text Input

```html
<input type="text" placeholder="Enter your name" />
```

**Styling**: Parchment background, brown border, gold focus glow (from overlapped-theme.css)

### Password Input

```html
<input type="password" placeholder="Enter your password" />
```

### Textarea

```html
<textarea placeholder="Enter your message"></textarea>
```

**Use Case**: Character bio, guild descriptions, long-form input

### Checkbox

```html
<label>
  <input type="checkbox" />
  <span>Accept Terms</span>
</label>
```

**Styling**: Custom medieval-themed checkbox replaces default

**Numbered Variants**: The demo shows `checkbox1`, `checkbox2`, etc., suggesting multiple visual styles may exist.

### Radio Buttons

```html
<label>
  <input type="radio" name="class" value="warrior" />
  <span>Warrior</span>
</label>

<label>
  <input type="radio" name="class" value="mage" />
  <span>Mage</span>
</label>

<label>
  <input type="radio" name="class" value="rogue" />
  <span>Rogue</span>
</label>
```

**Use Case**: Character class selection, difficulty selection, gender selection

---

## Dropdowns & Lists

### Dropdown (Select Element)

```html
<select class="rpgui-dropdown">
  <option value="warrior">Warrior</option>
  <option value="mage">Mage</option>
  <option value="rogue">Rogue</option>
  <option value="ranger">Ranger</option>
</select>
```

**Styling**: Transforms standard `<select>` into medieval-themed dropdown

**Use Case**: Class selection, server selection, language selection

### Listbox

```html
<select class="rpgui-list" multiple>
  <option>Iron Sword</option>
  <option>Steel Shield</option>
  <option>Leather Armor</option>
  <option>Health Potion</option>
</select>
```

**Styling**: Multi-item selection with RPGUI theme

**Use Case**: Inventory displays, quest logs, skill trees

---

## Sliders

### Standard Slider

```html
<input class="rpgui-slider" type="range" min="0" max="10" value="8" />
```

**Use Case**: Volume controls, brightness, skill point allocation

### Golden Slider

```html
<input class="rpgui-slider golden" type="range" min="0" max="100" value="50" />
```

**Use Case**: Important settings, premium adjustments

---

## Progress Bars

### Base Progress Bar (Purple)

```html
<div class="rpgui-progress">
  <div class="rpgui-progress-fill" style="width: 75%;"></div>
</div>
```

**Default Color**: Purple

### Red Progress Bar (Health)

```html
<div class="rpgui-progress red">
  <div class="rpgui-progress-fill" style="width: 80%;"></div>
  <div class="rpgui-progress-track"></div>
</div>
```

**Use Case**: Health bars, danger meters

### Blue Progress Bar (Mana)

```html
<div class="rpgui-progress blue">
  <div class="rpgui-progress-fill" style="width: 60%;"></div>
  <div class="rpgui-progress-track"></div>
</div>
```

**Use Case**: Mana bars, magic meters

### Green Progress Bar (Stamina)

```html
<div class="rpgui-progress green">
  <div class="rpgui-progress-fill" style="width: 50%;"></div>
  <div class="rpgui-progress-track"></div>
</div>
```

**Use Case**: Stamina bars, endurance meters

**Dynamic Updates**: Use JavaScript to update `style="width: X%"` on the fill element.

---

## Icons

### Icon Classes

```html
<div class="rpgui-icon sword"></div>
<div class="rpgui-icon shield"></div>
<div class="rpgui-icon potion-red"></div>
```

### Available Icons (15 built-in)

**Weapons & Equipment**:
- `sword` - Weapon icon
- `shield` - Shield icon

**Potions**:
- `potion-red` - Health potion
- `potion-green` - Stamina/poison cure
- `potion-blue` - Mana potion

**Equipment Slots**:
- `weapon-slot` - Empty weapon slot
- `shield-slot` - Empty shield slot
- `armor-slot` - Empty armor slot
- `helmet-slot` - Empty helmet slot
- `ring-slot` - Empty ring slot
- `shoes-slot` - Empty boots slot
- `potion-slot` - Empty potion slot
- `magic-slot` - Empty magic item slot
- `empty-slot` - Generic empty slot

**UI Icons**:
- `exclamation` - Alert/notification icon

**Extensible**: Icons can be extended by adding images to the RPGUI img/ directory.

---

## Typography

All text elements receive automatic styling inside `rpgui-content`:

### Headers

```html
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<h4>Small Title</h4>
```

**Styling**: White text with black outline (medieval fantasy aesthetic)

### Paragraphs

```html
<p>Regular body text with medieval styling.</p>
```

### Labels

```html
<label>Form Label</label>
<span>Inline text</span>
```

### Links

```html
<a href="#">Click here</a>
```

**Styling**: Themed link colors, hover effects

---

## Draggable Containers

### Making Containers Moveable

```html
<div class="rpgui-container framed-golden rpgui-draggable">
  <h3>Draggable Window</h3>
  <p>Grab this container to move it!</p>
</div>
```

**Important**: Users must grab the div itself, not child elements within it.

**Use Case**: Inventory windows, character sheets, modal dialogs

---

## Cursor Styles

### Available Cursor Classes

```html
<div style="cursor: default;">Default Cursor</div>
<div style="cursor: pointer;">Pointer Cursor</div>
<div style="cursor: text;">Text Select Cursor</div>
<div style="cursor: grab;">Grab Open Cursor</div>
<div style="cursor: grabbing;">Grab Close Cursor</div>
```

**RPGUI Cursors**: Custom medieval-themed cursors replace default browser cursors.

**Use Case**:
- `pointer` - Clickable elements (buttons, links)
- `grab` - Draggable elements
- `text` - Text input fields

---

## JavaScript API

RPGUI provides JavaScript utilities for dynamic element creation and value manipulation.

### Creating Elements Dynamically

```javascript
// Create RPGUI element after page load
RPGUI.create(element, type);
```

**When to Use**: Creating UI elements dynamically (e.g., adding inventory items via JavaScript)

### Setting Element Values

```javascript
// Set value and trigger onchange event
RPGUI.set_value(element, value);
```

**Use Case**: Updating progress bars, sliders, form fields programmatically

### Getting Element Values

```javascript
// Get value consistently across element types
var value = RPGUI.get_value(element);
```

**Use Case**: Reading form input, slider positions, dropdown selections

---

## Disabled Elements

All RPGUI components support the `disabled` attribute:

```html
<button class="rpgui-button" disabled>
  <p>Disabled Button</p>
</button>

<input type="text" disabled />

<select class="rpgui-dropdown" disabled>
  <option>Disabled Dropdown</option>
</select>
```

**Visual**: Grayed out appearance, non-interactive

---

## Asset Requirements

### Required Files

```text
dist/
├── rpgui.css       # Core RPGUI styles
├── rpgui.js        # JavaScript utilities
└── img/            # Image assets (~1.35MB)
    ├── borders/
    ├── buttons/
    ├── frames/
    ├── icons/
    └── textures/
```

### Installation

1. Copy `rpgui.css` to `client/styles/`
2. Copy `rpgui.js` to `client/scripts/`
3. Copy `img/` directory to `client/rpgui-assets/`
4. Link in HTML:

```html
<link rel="stylesheet" href="styles/rpgui.css">
<script src="scripts/rpgui.js"></script>
```

---

## Best Practices

### 1. Always Use rpgui-content Wrapper

```html
<!-- ✅ CORRECT -->
<div class="rpgui-content">
  <div class="rpgui-container framed-golden">
    <p>Content</p>
  </div>
</div>

<!-- ❌ WRONG -->
<div class="rpgui-container framed-golden">
  <p>Content</p>
</div>
```

### 2. Wrap Button Text in `<p>` Tags

```html
<!-- ✅ CORRECT -->
<button class="rpgui-button">
  <p>Click Me</p>
</button>

<!-- ❌ WRONG -->
<button class="rpgui-button">
  Click Me
</button>
```

### 3. Use Standard HTML Elements

RPGUI styles standard HTML elements. Don't create custom elements.

```html
<!-- ✅ CORRECT -->
<input type="text" />
<select class="rpgui-dropdown">...</select>

<!-- ❌ WRONG -->
<div class="custom-input">...</div>
```

### 4. No JavaScript Required for Static UI

Unless creating elements dynamically after page load, no JavaScript coding is needed.

### 5. Combine with Overlapped Theme

RPGUI provides the framework. `overlapped-theme.css` customizes colors:

```css
/* overlapped-theme.css overrides */
.rpgui-container.framed-golden {
  border-color: #FFD700; /* Overlapped gold */
}

input {
  background: #F5F5DC; /* Parchment */
  border-color: #8B7355; /* Brown */
}
```

---

## Component Combinations

### Login Form Example

```html
<div class="rpgui-content">
  <div class="rpgui-container framed-golden">
    <h1>Overlapped</h1>
    <p>Enter the realm...</p>

    <label>Email</label>
    <input type="email" placeholder="your@email.com" />

    <label>Password</label>
    <input type="password" placeholder="Enter password" />

    <button class="rpgui-button golden">
      <p>Login</p>
    </button>

    <button class="rpgui-button">
      <p>Create Account</p>
    </button>
  </div>
</div>
```

### Character Selection Card

```html
<div class="rpgui-content">
  <div class="rpgui-container framed">
    <h3>Warrior Lvl 50</h3>

    <div class="rpgui-progress red">
      <div class="rpgui-progress-fill" style="width: 100%;"></div>
    </div>
    <label>Health: 1000/1000</label>

    <div class="rpgui-progress blue">
      <div class="rpgui-progress-fill" style="width: 80%;"></div>
    </div>
    <label>Mana: 400/500</label>

    <button class="rpgui-button golden">
      <p>Select Character</p>
    </button>
  </div>
</div>
```

### Inventory Slot Grid

```html
<div class="rpgui-content">
  <div class="rpgui-container framed-golden">
    <h3>Inventory</h3>

    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
      <div class="rpgui-icon sword"></div>
      <div class="rpgui-icon shield"></div>
      <div class="rpgui-icon potion-red"></div>
      <div class="rpgui-icon empty-slot"></div>
      <div class="rpgui-icon empty-slot"></div>
    </div>
  </div>
</div>
```

---

## Overlapped-Specific Customizations

### Color Palette Integration

RPGUI provides the structure. Overlapped theme provides the colors:

```css
/* overlapped-theme.css */
:root {
  --overlapped-gold: #FFD700;
  --overlapped-silver: #C0C0C0;
  --overlapped-parchment: #F5F5DC;
  --overlapped-brown: #8B7355;
}

/* Apply to RPGUI components */
.rpgui-container.framed-golden {
  border-color: var(--overlapped-gold);
}

input, textarea {
  background: var(--overlapped-parchment);
  border-color: var(--overlapped-brown);
}

input:focus, textarea:focus {
  border-color: var(--overlapped-gold);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}
```

### Typography Overrides

```css
/* overlapped-theme.css */
h1, h2, h3 {
  font-family: Georgia, 'Times New Roman', serif;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

p, label, span {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

---

## Responsive Design Adaptations

### Desktop (Default)

```css
/* No media query - default RPGUI sizing for 1920x1080 */
.rpgui-container {
  max-width: 600px;
}
```

### Laptop (1366x768)

```css
@media (max-width: 1366px) {
  .rpgui-container {
    max-width: 500px;
  }

  h1 { font-size: 40px; }
  h3 { font-size: 16px; }
}
```

### Tablet/Mobile (768px and below)

```css
@media (max-width: 768px) {
  .rpgui-container {
    max-width: 90%;
  }

  .rpgui-button {
    min-height: 44px; /* Touch target */
  }
}
```

---

## Resources

- **GitHub Repository**: https://github.com/RonenNess/RPGUI
- **Live Demo**: https://ronenness.github.io/RPGUI/
- **License**: MIT (free for commercial use)
- **Asset Size**: ~1.35MB (images)
- **Browser Support**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## Next Steps for Implementation

1. ✅ Research RPGUI components (this document)
2. → Download RPGUI v1.3+ from GitHub
3. → Install assets in `client/` directory
4. → Create `overlapped-theme.css` with custom colors
5. → Implement login screen using RPGUI components
6. → Implement character selection screen
7. → Implement character creation screen
8. → Test on all target browsers
9. → Optimize performance (<2s load, 60fps animations)

---

**Last Updated**: 2025-12-30
**Maintained By**: Overlapped Dev Team
**Status**: Ready for Implementation
