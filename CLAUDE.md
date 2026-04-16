# Project Guidelines for Claude Code

## Project Overview
A Torah reader web application built with React + Vite + Tailwind CSS. It displays Hebrew Torah text with a premium dark theme (navy/gold aesthetic). The app has desktop and mobile views with a custom golden hand (yad) cursor, chapter navigation, focus mode, magnify mode, and adjustable text borders/padding.

## Key Commands
- **Dev Server**: `cd torah-reader && npm run dev`
- **Build**: `cd torah-reader && npm run build`
- **Start**: `cd torah-reader && npm start`

## Project Structure
- `torah-reader/` — Main React app (Vite)
  - `src/components/ReaderView.jsx` — The main reading view (top bar, bottom bar, text display, settings, border adjustment, all controls)
  - `src/components/CustomCursor.jsx` — The golden yad (hand) cursor that follows the mouse on desktop
  - `src/components/SettingsPanel.jsx` — Settings panel component
  - `public/` — Static assets (icons, cursor image, etc.)
- `photos/` — Source image files (icons, backgrounds). These get copied into `torah-reader/public/` when used.

## Important Files
- `torah-reader/src/components/ReaderView.jsx` — This is THE main file. Almost everything lives here: top bar, bottom bar, text rendering, settings, modes, border adjustment, etc.
- `torah-reader/src/components/CustomCursor.jsx` — Golden yad cursor logic
- `torah-reader/public/cursor-yad.png` — The yad cursor image
- `torah-reader/public/icon-settings.png` — Gold gear icon for settings button
- `torah-reader/public/icon-back.png` — Gold arrow icon for back button
- `torah-reader/public/icon-chapter-verse.png` — Gold frame behind chapter/book display
- `torah-reader/public/icon-eye.png` — Gold eye icon for focus mode toggle

---

## CRITICAL: Icon/Button Implementation Guide (Lessons Learned)

### The Core Problem with Image Icons
All icon images in this project (from the `photos/` folder) are PNGs with **massive transparent whitespace** around the actual visible icon. For example, `settings.png` is 500x333 pixels but the visible gear icon is only ~30% of that area, centered in the middle. This means:

1. If you set an `<img>` to `width: 200px`, the VISIBLE icon might only appear ~60px because the rest is transparent padding.
2. If you make a `<button>` the size of the image, the clickable area will be MUCH larger than the visible icon — the user will trigger the button when their cursor is nowhere near the visible icon.

### The Solution: `transform: scale()` Technique
This is the technique that works. Do NOT use `overflow: visible` with large images — parent containers will clip them. Instead:

```jsx
<button
  onClick={handler}
  className="cursor-pointer transition-all duration-300 hover:brightness-125 flex items-center justify-center"
  style={{ width: '70px', height: '70px' }}  // This controls the CLICKABLE area
>
  <img
    src="/icon-whatever.png"
    alt="description"
    style={{
      width: '70px',          // Same as button size
      height: '70px',         // Same as button size
      objectFit: 'contain',
      pointerEvents: 'none',  // CRITICAL: clicks pass through to button
      transform: 'scale(4)',  // This makes the icon VISUALLY large
      transformOrigin: 'center'
    }}
  />
</button>
```

**How it works:**
- The `<button>` defines the clickable hitbox (e.g., 70x70px)
- The `<img>` is set to the same size as the button
- `transform: scale(X)` visually enlarges the image X times WITHOUT affecting layout or the clickable area
- `pointerEvents: 'none'` on the image ensures only the button catches clicks
- `transformOrigin: 'center'` keeps it centered while scaling

**To adjust position:** Add `translateX()` or `translateY()` to the transform:
```jsx
transform: 'scale(2.15) translateY(-1.5px)'  // scale + move up 1.5px
```

### Current Icon Scale Values (for reference)
- **Settings button (gear)**: `scale(4)`, button size `70x70px`
- **Back button (arrow)**: `scale(2.15) translateY(-1.5px)`, button size `70x70px`
- **Chapter/verse frame**: `scale(6.35) translateY(0.5px)`, positioned absolute behind text
- **Focus mode (eye)**: `scale(4)`, button size `10x10px`, opacity changes for on/off state

### Step-by-Step: Adding a New Icon Button
1. **Copy the image** from `photos/` to `torah-reader/public/` with a clean name (e.g., `icon-newbutton.png`)
2. **Start small**: Begin with button size `50x50px` and `scale(3)`. You WILL need to adjust.
3. **Match clickable area first**: Get the button hitbox to align with the visible icon center. The user should be able to click exactly on the visible icon.
4. **Then scale up**: Increase the scale value until the icon is the desired visual size.
5. **Fine-tune position**: Use `translateX/Y` in the transform to nudge by pixels.
6. **Expect multiple rounds of adjustment**: The user will ask for percentage increases/decreases and pixel-level nudges. This is normal.

### Percentage Math for Adjustments
When the user says "make it 15% bigger", multiply the current scale by 1.15:
- scale(4) + 15% = scale(4.6)
- scale(4.6) + 15% = scale(5.29)
- scale(5.29) + 20% = scale(6.35)

When the user says "cut it by 40%", multiply by 0.6:
- scale(3.45) * 0.6 = scale(2.07)

### For Background Frame Images (like chapter/verse banner)
When an image goes BEHIND text as a decorative frame:
```jsx
<div className="relative flex items-center justify-center">
  <img
    src="/icon-frame.png"
    alt=""
    className="absolute"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
      transform: 'scale(6.35) translateY(0.5px)',
      transformOrigin: 'center'
    }}
  />
  <div className="relative z-10 text-center px-10 py-2">
    {/* Text content goes here, z-10 keeps it above the frame */}
  </div>
</div>
```

### For Toggle Buttons (on/off state like focus mode eye)
Use opacity to indicate state:
```jsx
style={{
  opacity: isActive ? 1 : 0.4,
  transition: 'opacity 0.3s'
}}
```

---

## Desktop vs Mobile Layout

### CRITICAL RULE: Do NOT change desktop when asked to fix mobile, and vice versa.
The top bar has two completely separate layouts controlled by `{isMobile ? (...) : (...)}`. Always identify which branch you're editing.

### Desktop Top Bar
- Single row, `h-16`, contains: back button | mode toggles + focus/magnify | gold line | chapter frame | gold line | font slider | settings + collapse
- Back button on the RIGHT (RTL layout, `dir="rtl"`)
- Settings button on the LEFT

### Mobile Top Bar
- Two rows: Row 1 (`h-10`): back + chapter + settings. Row 2 (`h-8`): mode toggles + focus/magnify + font slider
- Total height: ~72px (spacer is `h-[72px]`)

### Z-Index Hierarchy
- `z-50`: Top bar and bottom bar (must be ABOVE border adjustment)
- `z-[55]`: Border adjustment hint text + done button
- `z-40`: Border adjustment gold lines/handles
- `z-99999`: Custom cursor (always on top of everything)

---

## Custom Cursor (Golden Yad)

### How it works
- `CustomCursor.jsx` renders an `<img>` that follows the mouse via `mousemove` event
- Only shows on desktop (hidden on touch/mobile devices)
- Image is positioned so the fingertip aligns with the actual cursor point
- Current offset: `left: pos.x - 145, top: pos.y - 16` (fingertip position within 320x320 image)

### Rotation
- Uses `transform: rotate(-2.5deg)` with `transformOrigin: '145px 16px'` (the fingertip point)
- Rotating around the fingertip ensures it stays aligned with the real cursor
- Negative degrees = tilt right (bottom swings right), positive = tilt left

### Changing the cursor image
- Source images are in `photos/` folder (e.g., `GOLDEN HAND - Copy (2) (1).png`)
- Copy to `torah-reader/public/cursor-yad.png` to replace

---

## Border/Padding Adjustment
- `textPadding` controls left/right padding of the Torah text area
- Draggable gold handles on left and right edges
- Border lines (`z-40`) must stay BELOW the top/bottom bars (`z-50`) so they don't overlap the UI
- The top/bottom bars should NOT be affected by textPadding — only the text content area

---

## Font Size
- Desktop: `settings.fontSize + 4` (no cap)
- Mobile: `settings.fontSize * 0.75 + 4` (no cap, allows very large text on mobile)
- Slider range: 18 to 80

---

## Code Style
- Use consistent indentation (2 spaces)
- RTL layout (`dir="rtl"`) for Hebrew text
- Gold color: `text-gold` or `#d4a843`
- Navy background: `bg-navy` or `#0a0e1a`
- Use Tailwind classes where possible, inline `style={{}}` for dynamic values
- Always add `cursor-pointer` to interactive elements
- Add `transition-all duration-300` for smooth interactions

## Development Workflow
1. Make small, focused changes
2. The user will fine-tune pixel by pixel — this is expected and normal
3. When adjusting sizes: always ask/confirm before making changes
4. When the user says "don't touch X", absolutely do NOT modify that element
5. Always preserve existing working behavior when adding new features

---

## CRITICAL: Moving Elements in RTL Flex Containers (Lessons Learned)

### The Problem
The top bar uses `dir="rtl"` with nested flex containers including `flex-1 flex justify-center`. Moving child elements inside this structure is tricky:

1. **`margin` changes inside a `justify-center` flex container are invisible** — the container re-centers everything, so adding margins just makes the group wider without visually shifting any item relative to the bar.
2. **`position: relative; left/right` can also fail** — in some cases the flex layout absorbs or clips the offset.
3. **Pulling elements OUT of the centered group breaks the layout** — other elements (like the chapter frame) lose their centering.

### The Solution: `transform: translateX()` on a wrapper div
Wrap the elements you want to move in a `<div>` and apply `translateX()`:
```jsx
<div style={{ transform: 'translateX(15px) translateY(1px)' }}>
  {/* elements to move */}
</div>
```

### Direction in RTL context
Even though the layout is `dir="rtl"`, `translateX` operates in **physical screen coordinates**:
- **`translateX(positive)` = moves RIGHT** (toward the back arrow)
- **`translateX(negative)` = moves LEFT** (toward eye/magnify/center)
- **`translateY(positive)` = moves DOWN**
- **`translateY(negative)` = moves UP**

This was confirmed by testing with `translateX(-100px)` (moved left onto icons) and `translateX(100px)` (moved right toward back arrow).

### Why other approaches failed
- **`marginInlineEnd`, `marginInlineStart`**: These add space but `justify-center` re-centers the whole group, so individual items don't visually shift relative to the top bar.
- **`position: relative; left: Xpx`**: Works in theory but can be absorbed by flex layout or clipped by overflow.
- **Moving elements out of the `flex-1 justify-center` container**: Breaks the centering of the chapter frame and other elements.

### Key Rule
When you need to move an element inside the centered top-bar group:
1. Wrap it in a `<div>` (if not already)
2. Use `transform: translateX(Npx)` for horizontal movement
3. Use `transform: translateY(Npx)` for vertical movement
4. Combine: `transform: 'translateX(5px) translateY(1px)'`
5. This does NOT affect layout of sibling elements — purely visual offset

---

## CRITICAL: Slider Overlay Thumb Positioning (Lessons Learned)

### The Problem
The font size slider uses an `<input type="range">` that is **wider than its container** (`calc(100% + 122px)` = 242px inside a 120px container, with `-61px` margins on each side). The native thumb is invisible (small hitbox only), and a separate `<img>` is positioned on top as the visual thumb.

If you position the visual thumb using `%` of the container, it only travels 120px — but the real thumb travels 223px (inputWidth - thumbWidth = 242 - 19). The visual falls behind the hitbox as you drag.

### The Solution: Use pixel math, not percentages
```
right: `${fraction * travelPx - offsetPx}px`
```

- **fraction** = `(value - min) / (max - min)` — how far through the range (0 to 1)
- **travelPx** = `inputWidth - thumbWidth` — actual pixel distance the thumb travels (223px)
- **offsetPx** = constant to align the starting position (tune manually, currently 111)

### Why percentages fail
- `right: calc(50% ...)` means 50% of the **container** (120px) = 60px
- But the thumb at 50% is actually 111.5px from the start (50% of 223px travel)
- The mismatch grows as you drag — perfectly aligned at start, way off at end

### Key Rules
1. **Always use px for visual thumb position** when the input overflows its container
2. **travelPx = inputWidth - thumbWidth** — this is the actual thumb travel distance
3. **The hitbox (invisible thumb) and visual image are independent** — move them separately
4. **The hitbox uses `transform: translateX/Y` on the CSS thumb pseudo-element**
5. **The visual uses `right: Xpx` with the pixel formula above**
6. If the input width or margins change, recalculate travelPx

---
*This file helps Claude understand this project. Updated after slider overlay positioning session.*