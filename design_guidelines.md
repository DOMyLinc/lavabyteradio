# Lava Bytes Radio - Design Guidelines

## Design Approach

**Reference-Based: Modern Car Stereo Systems** - Drawing inspiration from Pioneer DMH-WT8600NEX, Alpine iLX-507, and Kenwood DMX series. The interface mimics physical car audio systems with digital sophistication while maintaining web application fluidity.

## Core Design Principles

1. **Skeuomorphic Realism**: Physical car stereo elements (knobs, buttons, displays) rendered digitally with depth and tactile appearance
2. **Dashboard Hierarchy**: Main radio controls as the focal point, secondary features accessible but not competing
3. **Lava Energy**: Warm, flowing visual theme with animated background elements suggesting molten movement
4. **LED-Style Displays**: High-contrast digital readouts mimicking modern car head units

## Layout System

**Desktop Layout (1024px+):**
- Fixed-height car stereo unit: 480-600px centered vertically
- Pop-out screen extends upward from the stereo unit (animated slide/fade)
- Maximum width: 1200px for optimal stereo proportions
- Background: Full viewport with animated lava effects

**Tablet Layout (768-1023px):**
- Stereo unit: 400-480px height
- Simplified controls, maintained visual hierarchy
- Collapsible station list as overlay

**Mobile Layout (<768px):**
- Full-screen interface adapting car stereo metaphor
- Stack controls vertically: display screen → playback controls → station selection
- Touch-optimized button sizes (minimum 48px tap targets)

**Spacing System:** Use Tailwind units of 2, 4, 6, and 8 consistently (p-2, m-4, gap-6, h-8)

## Typography

**Primary Font**: Inter or Roboto (clean, legible for displays)
- LED Display Text: 24-32px, semibold, monospace feel
- Station Names on Dial: 14-16px, medium weight
- Now Playing Info: 18-20px title, 14-16px artist
- Button Labels: 12-14px, uppercase, tracking-wide

**Secondary Font**: System UI for admin panel
- Admin Headers: 24-28px, bold
- Form Labels: 14px, medium
- Body Text: 16px, regular

## Component Library

### Main Stereo Unit
**Structure**: Horizontal panel with defined sections
- Left: Power button, source selector
- Center: Main display screen (240x120px LED-style), now playing info
- Right: Volume knob, preset buttons (1-5)
- Bottom: Station dial/tuner with station names

**Visual Treatment**: 
- Beveled edges suggesting physical depth
- Subtle gradients for dimensional appearance
- Glossy finish on display screens
- Matte finish on control surfaces

### Pop-Out Display Screen
**Dimensions**: 800x450px (16:9 aspect ratio)
- Extends from top of stereo unit
- Contains: Album art/station logo, visualizer area, expanded track info
- Animation: 0.5s ease-out slide up/fade in
- Border: Thin bezel mimicking screen frame

### Interactive Controls

**Volume Knob**: 
- Circular, 80-100px diameter
- Rotate interaction (drag to turn) or click increments
- Center display showing volume level 0-100
- Notched appearance with indicator line

**Preset Buttons** (1-5):
- Rectangular, 60x40px each
- Stacked or horizontal row
- LED indicator when station active
- Haptic-style visual feedback on press

**Station Dial/Tuner**:
- Horizontal slider, 400-600px wide
- Station names as labeled tick marks
- Glowing indicator at current position
- Draggable selector or click-to-tune

**Play/Pause Button**:
- Large, prominent (60-80px)
- Centered in control area
- Toggle state with clear icon change

### Station List Window
**Appearance**: Overlay panel or slide-in drawer
- Semi-transparent backdrop
- 300-400px wide panel
- Station entries: Logo thumbnail + name + description
- Search/filter bar at top
- Scrollable list with hover states

### Now Playing Display
**Location**: Main stereo display area
- Song Title: Prominent, marquee scroll if too long
- Artist Name: Secondary emphasis
- Station Name/Logo: Small identifier
- Time elapsed/duration: Digital readout

### Admin Panel
**Layout**: Clean dashboard separate from stereo interface
- Sidebar navigation: Stations, Settings
- Main content area: Station management table
- Action buttons: Add Station, Edit, Delete
- Form fields: Station Name, Stream URL, Description, Logo Upload

## Animation Guidelines

**Essential Animations Only**:
- Pop-out screen transition: 0.5s ease-out
- Button press feedback: 0.1s scale transform
- Volume knob rotation: Follow cursor smoothly
- Station switching: 0.3s crossfade audio, display update
- Lava background: Subtle, slow movement (3-5s loop)

**Avoid**: Excessive spinning, bouncing, or distracting effects

## Lava Theme Integration

**Background**: 
- Full viewport animated gradient suggesting lava flow
- Particle effects or SVG blobs for organic movement
- Depth through layering (slower back layers, faster front)

**Mascot Placement**:
- Logo in top-left or bottom-right of interface
- Watermark style, not competing with controls
- Subtle glow/ember effect on mascot

## Images

**Lava Bytes Mascot**: Use provided logo (588496392_1194040775959608_6497226853787014568_n_1766326274153.jpg)
- Placement: Top-left corner (120x120px) or as branding element
- Treatment: Slight glow/shadow for depth

**Station Logos**: 
- Square format, 100x100px in list view
- 240x240px in pop-out display
- Default placeholder if logo unavailable

**Reference Stereo Image**: Inspire control layout and button styling, not directly replicate

## Responsive Behavior

**Breakpoints**:
- Desktop: 1024px+ (full stereo experience)
- Tablet: 768-1023px (adapted controls)
- Mobile: <768px (stacked, touch-first)

**Touch Interactions**:
- Swipe to change stations
- Tap preset buttons (enlarged for mobile)
- Drag volume slider instead of knob rotation
- Pull-to-reveal station list

## Accessibility

- High contrast LED displays for readability
- ARIA labels for all interactive controls
- Keyboard navigation: Arrow keys for dial, Space for play/pause, 1-5 for presets
- Focus indicators on all interactive elements
- Screen reader announcements for station changes

## Admin Panel Design

**Aesthetic**: Clean, modern dashboard (minimal car stereo styling here)
- Table view for station list with inline editing
- Modal forms for add/edit operations
- Success/error toast notifications
- Drag-to-reorder station priority

This interface balances nostalgic car stereo charm with modern web capabilities, creating an immersive, branded radio experience.