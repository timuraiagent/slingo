# Skill Bingo Slots — Asset Specification 

> **Scope**: MVP assets only. Post-MVP expansions noted where relevant.  
> **Base resolution**: 1080 × 1920 px (portrait). All dimensions given at 1× (base resolution).  
> **Export format**: PNG for graphics (transparency where needed), MP3 + OGG for audio.  
> **Texture atlas**: Group all UI sprites into a single atlas (`ui-atlas.png` + `ui-atlas.json`) using TexturePacker or similar. Reel symbols get their own atlas (`reel-atlas`).  
> **Scale factor**: Design at 2× (2160 × 3840) for crisp rendering on high-DPI devices, export downscaled to 1× for the atlas.

---

## Art Direction

### Visual Style

**Tone**: Dark, vibrant, casino-adjacent but not sleazy. Think premium mobile gaming — deep space or polished night-club aesthetic rather than Las Vegas kitsch.

**Key words**: Glowing, kinetic, satisfying, clear, celebratory.

**Background treatment**: Deep dark background (near-black or very dark navy/indigo) so that colored elements, glows, and particles pop with maximum contrast.

**Colors**: Neon-bright accents on dark surfaces. Gold for jackpot/reward, green for success, red/orange for pressure/danger, blue for neutral/defensive, purple for special/wild.

**Typography**: Bold, high-contrast, legible at small sizes. Numbers on the bingo card are the most important text in the game — they must be instantly readable with a single glance.

**Animations / effects**: Designed in Phaser (tweens, particles) — static art should leave room for glow/overlay FX applied in code. Sprites should not bake in glow effects that the engine will also add.

### Color Palette Reference

| Name | Hex | Use |
|---|---|---|
| Background Dark | `#0D0D1A` | Game background |
| Background Mid | `#161628` | Card background, panel backgrounds |
| Background Light | `#1E1E3A` | Cell open background |
| Gold | `#FFD700` | Jackpot, rewards, 1st place |
| Gold Dark | `#B8860B` | Jackpot meter border, shadows |
| Green Hit | `#2ECC71` | Useful hit, closed cell fill |
| Green Dark | `#1A7A44` | Closed cell border/shadow |
| Orange Hot | `#FF8C00` | Hot cells, streak fire, GREAT zone |
| Red Pressure | `#E74C3C` | Pressure phase, danger |
| Blue Neutral | `#3498DB` | Neutral UI, progress bars |
| Purple Wild | `#9B59B6` | Wild symbol, special effects |
| White Pure | `#FFFFFF` | PERFECT zone, primary text |
| Grey Inactive | `#4A4A6A` | Empty meter segments, disabled buttons |
| Text Primary | `#F0F0FF` | All main UI text |
| Text Secondary | `#8888AA` | Secondary labels, stat rows |

---

## Section 1 — Backgrounds

### 1.1 Main Game Background

| Property | Value |
|---|---|
| File | `bg-match.png` |
| Dimensions | 1080 × 1920 px |
| Format | PNG (no alpha needed) |
| Usage | Full-screen background behind all game elements |

**Description**: Dark vertical gradient. Top: `#0D0D1A` (near-black). Bottom: `#12102A` (slightly warmer dark indigo). Optional: very subtle hexagonal or circuit-board texture overlay at 4% opacity — should be invisible at a glance, only adds tactile depth. No strong patterns that compete with game content.

---

### 1.2 Menu Background

| Property | Value |
|---|---|
| File | `bg-menu.png` |
| Dimensions | 1080 × 1920 px |
| Format | PNG |

**Description**: Same base as `bg-match.png` but with a faint radial glow in the center (gold-to-transparent, 30% opacity) suggesting a spotlight. The logo will sit inside this glow. Optional: faint bingo grid pattern at 6% opacity in the lower third.

---

### 1.3 Results Screen Background

| Property | Value |
|---|---|
| File | `bg-results.png` |
| Dimensions | 1080 × 1920 px |
| Format | PNG |

**Description**: Same dark base as `bg-match.png`. A centered vertical light shaft (top to bottom, `#FFD700` at 8% opacity) suggests the end-game celebration spotlight. Slightly brighter than the match background to signal "safe zone / resolution."

---

## Section 2 — Bingo Card

### 2.1 Card Frame / Background Panel

| Property | Value |
|---|---|
| File | `card-frame.png` |
| Dimensions | 900 × 900 px |
| Format | PNG with alpha |
| 9-slice margins | 24 px all sides |

**Description**: A rounded rectangle panel (corner radius 20px). Fill: `#161628`. Border: 2px solid `#3A3A60`. Subtle inner shadow on all 4 sides to give depth. The 5×5 cell grid will sit inside this frame. Keep the border understated — it should not compete with the cells.

**9-slice**: Design so that the 24px corner regions stay fixed when the frame is stretched — this allows it to resize cleanly across card format variants (4×4, 6×6) without corner distortion.

---

### 2.2 Cell — Open State

| Property | Value |
|---|---|
| File | `cell-open.png` |
| Dimensions | 152 × 152 px (will render at ~160px with code padding) |
| Format | PNG with alpha |

**Description**: Rounded square (corner radius 12px). Fill: `#1E1E3A`. Border: 1.5px solid `#3A3A60`. Interior is plain — numbers are rendered on top by Phaser `Text` objects, not baked into the sprite. The sprite is purely the background tile.

**Important**: Keep the interior completely flat and featureless. No gradients, no textures inside the cell. Numbers need maximum contrast with this background.

---

### 2.3 Cell — Closed State

| Property | Value |
|---|---|
| File | `cell-closed.png` |
| Dimensions | 152 × 152 px |
| Format | PNG with alpha |

**Description**: Same shape as open cell. Fill: `#2ECC71` (Green Hit) with a subtle radial gradient — slightly lighter (`#4EE891`) in the top-center fading to the base green at edges. Border: 1.5px solid `#1A7A44`. A small checkmark or dot pattern subtly pressed into the fill at 15% opacity is acceptable for tactile feel, but not required.

**Number color when closed**: Phaser renders the number in `#FFFFFF` with bold weight on top of this sprite.

---

### 2.4 Cell — Hot State (overlay)

| Property | Value |
|---|---|
| File | `cell-hot-overlay.png` |
| Dimensions | 152 × 152 px |
| Format | PNG with alpha |

**Description**: Transparent interior. Border/glow only — an orange outer glow ring (`#FF8C00` at 80% opacity, 4px spread, soft edge). The glow sits outside the cell border so it doesn't occlude the number. This overlay is layered on top of `cell-open.png` by Phaser when a cell enters the Hot state.

---

### 2.5 Cell — Near-Win Pulse (overlay)

| Property | Value |
|---|---|
| File | `cell-nearwin-overlay.png` |
| Dimensions | 152 × 152 px |
| Format | PNG with alpha |

**Description**: Same concept as Hot overlay but gold (`#FFD700`), thicker glow (6px spread). This is the overlay used when a cell is the last remaining cell in a near-complete line. Phaser will alpha-tween this overlay to create the pulse effect (opacity oscillates 40%–100%).

---

### 2.6 FREE Cell

| Property | Value |
|---|---|
| File | `cell-free.png` |
| Dimensions | 152 × 152 px |
| Format | PNG with alpha |

**Description**: Uses the closed cell shape and color (`#2ECC71`). In the center, render a small star icon (5-pointed, `#FFD700`, 60px) with "FREE" text below it in white, 18px bold. This is a static sprite — baked artwork, not procedural text.

---

### 2.7 Jackpot Target Marker (overlay)

| Property | Value |
|---|---|
| File | `cell-jackpot-marker.png` |
| Dimensions | 152 × 152 px |
| Format | PNG with alpha |

**Description**: A thin pulsing gold diamond border around the cell, transparent interior. Used to show the player's intended jackpot target cell. Border: 3px, `#FFD700`, diamond/rotated-square corner treatment. Phaser tweens its alpha to create a pulse.

---

### 2.8 Column Header Letters (B-I-N-G-O)

| Property | Value |
|---|---|
| File | `card-headers.png` (sprite sheet, 5 frames) |
| Frame size | 152 × 60 px |
| Total size | 760 × 60 px |
| Format | PNG with alpha |

**Description**: Five letter tiles: B, I, N, G, O. Each tile is a rounded rectangle (matching cell width). Each letter in a distinct vibrant color:
- B: `#3498DB` (blue)
- I: `#9B59B6` (purple)
- N: `#2ECC71` (green)
- G: `#FF8C00` (orange)
- O: `#E74C3C` (red)

Letter: white bold, 32px, centered. The color differentiation helps players quickly associate columns.

---

## Section 3 — Slot Machine

### 3.1 Slot Machine Frame

| Property | Value |
|---|---|
| File | `slot-frame.png` |
| Dimensions | 1040 × 420 px |
| Format | PNG with alpha |
| 9-slice margins | 30 px all sides |

**Description**: The outer container for the 5 reels. Rounded rectangle (radius 24px). Border: 3px solid `#3A3A60` with a subtle outer shadow. Fill: `#0D0D18` (slightly darker than background — creates a "deep" inset appearance). The top edge of the frame has a thin highlight line (`#5A5A90` at 50% opacity) to suggest a 3D beveled surface.

The interior is transparent (alpha) — the reels render behind this frame in the Phaser scene depth order, with the frame sitting on top to create the illusion of reels inside a machine cabinet.

---

### 3.2 Individual Reel Background

| Property | Value |
|---|---|
| File | `reel-bg.png` |
| Dimensions | 168 × 380 px |
| Format | PNG with alpha |

**Description**: A thin-bordered strip representing one reel column. Border: 1px solid `#2A2A50`. Fill: `#13131F`. Very subtle vertical scan-line texture at 3% opacity (optional). This is the static background behind the scrolling symbols.

---

### 3.3 Reel Result Highlight Row

| Property | Value |
|---|---|
| File | `reel-result-row.png` |
| Dimensions | 1040 × 152 px |
| Format | PNG with alpha |

**Description**: A horizontal band spanning all 5 reels at the result row position (middle row). Transparent interior with a thin horizontal gold line on the top and bottom edges (`#FFD700` at 40% opacity). Left and right ends: small gold triangle markers pointing inward, indicating "this is the active row." The entire band has a faint gold radial glow overlay at 10% opacity.

This is a static overlay — placed over the slot frame at the correct y-position to frame the result row.

---

### 3.4 Symbol Sprites

Each symbol is a single sprite used in the reel strips. All at the same dimensions.

| File | Dimensions | Description |
|---|---|---|
| `sym-number.png` | 152 × 140 px | Plain background tile for number symbols — a dark rounded rect, numbers rendered on top by Phaser Text |
| `sym-jackpot.png` | 152 × 140 px | Gold star (★) symbol — glowing 5-pointed star, `#FFD700`, strong outer glow |
| `sym-wild.png` | 152 × 140 px | Rainbow/prism star (🌟) — multi-color radial, sparkle feel |
| `sym-multiplier.png` | 152 × 140 px | "×2" text on a purple diamond shield — `#9B59B6` background, white bold "×2" text |

**sym-number.png**: Background only — a dark rounded rect (`#1E1E3A`, radius 10px, 1px border `#3A3A60`). Phaser renders the actual number on top as `Text`. This keeps the number crisp at all sizes and avoids needing a separate sprite per number.

**sym-jackpot.png**: The star should have a visible inner gold gradient (bright center, deeper gold edges) and a soft blur glow ring outside. Size the star so it fills ~75% of the tile with padding.

**sym-wild.png**: A glowing orb shape with a 4-pointed sparkle overlaid. Colors: soft white center, rainbow halo. Suggests "anything can happen."

**sym-multiplier.png**: Purple/violet diamond shield shape. Bold white "×2" in the center. Hard edges — no glow (to contrast with the other glowing symbols).

---

### 3.5 Reel Stop Impact Flash (overlay, single frame)

| Property | Value |
|---|---|
| File | `reel-stop-flash.png` |
| Dimensions | 168 × 152 px |
| Format | PNG with alpha |

**Description**: A pure white rectangle at 60% opacity, same size as one symbol cell. Phaser alpha-tweens this from 0.6 → 0 over 100ms each time a reel stops — the "thunk" visual impact. No detailed art needed; this is a functional flash overlay.

---

## Section 4 — Timing Bar

### 4.1 Timing Bar Background (Zone Map)

| Property | Value |
|---|---|
| File | `timing-bar-bg.png` |
| Dimensions | 960 × 80 px |
| Format | PNG with alpha |
| Corner radius | 40 px (pill shape) |

**Description**: A horizontal pill-shaped bar divided into color zones. The zones are symmetrical around the center.

Zone proportions (left → right, mirrored):
```
[MISS 10%] [GOOD 20%] [GREAT 12%] [PERFECT 16%] [GREAT 12%] [GOOD 20%] [MISS 10%]
```

Zone colors:
- MISS: `#2A2A3A` (near-black, almost invisible)
- GOOD: `#B8860B` (dark gold / amber)
- GREAT: `#FF8C00` (orange)
- PERFECT: `#FFD700` → `#FFFFFF` (gold-to-white radial gradient, brightest at dead center)

Outer border: 2px solid `#4A4A6A`. The perfect zone center should visibly glow slightly brighter than its surroundings.

---

### 4.2 Timing Bar Marker

| Property | Value |
|---|---|
| File | `timing-marker.png` |
| Dimensions | 16 × 96 px |
| Format | PNG with alpha |

**Description**: A vertical white bar — pill-shaped top and bottom (radius 8px). Fill: `#FFFFFF` solid. Subtle outer glow: 3px `#FFFFFF` at 50% opacity. Drop shadow below for depth. Phaser moves this horizontally via tween. The marker extends slightly above and below the bar (96px tall vs 80px bar height) to be clearly visible.

---

### 4.3 Zone Label Sprites

| File | Dimensions | Description |
|---|---|---|
| `label-perfect.png` | 200 × 48 px | "PERFECT!" text — gold (`#FFD700`), bold, outlined |
| `label-great.png` | 160 × 48 px | "GREAT" — orange (`#FF8C00`), bold |
| `label-good.png` | 140 × 48 px | "GOOD" — amber (`#B8860B`), bold |
| `label-miss.png` | 120 × 48 px | "MISS" — grey (`#4A4A6A`), regular weight |

**Description**: Pre-rendered text label sprites that Phaser displays above the marker position for 500ms on each tap. Using sprites instead of Phaser Text avoids font-loading delays and allows pre-designed text styles. All labels: rounded rectangle background at 60% opacity behind the text, color-matched to the zone.

---

## Section 5 — Meters & Streak

### 5.1 Jackpot Meter — Empty Segment

| Property | Value |
|---|---|
| File | `meter-segment-empty.png` |
| Dimensions | 140 × 36 px |
| Format | PNG with alpha |

**Description**: A rounded rectangle (radius 8px). Fill: `#2A2A40`. Border: 1px solid `#3A3A60`. Represents one unfilled jackpot meter segment. 5 of these render in a row.

---

### 5.2 Jackpot Meter — Filled Segment

| Property | Value |
|---|---|
| File | `meter-segment-filled.png` |
| Dimensions | 140 × 36 px |
| Format | PNG with alpha |

**Description**: Same shape as empty segment. Fill: gold gradient (left `#B8860B` → right `#FFD700` → center highlight `#FFF0A0`). Border: 1px solid `#FFD700`. Subtle inner glow. When Phaser transitions a segment from empty to filled, it cross-fades these two sprites.

---

### 5.3 Jackpot Meter — Container Label

| Property | Value |
|---|---|
| File | `meter-jackpot-label.png` |
| Dimensions | 200 × 40 px |
| Format | PNG with alpha |

**Description**: Text label "JACKPOT" in small-caps bold white (`#FFFFFF`), with a small star icon (`★`) on the left. Used as the meter's title above or beside the 5 segments. Subtle text shadow.

---

### 5.4 Streak Counter Background

| Property | Value |
|---|---|
| File | `streak-badge.png` |
| Dimensions | 160 × 56 px |
| Format | PNG with alpha |

**Description**: A dark pill/badge shape. Fill: `#1E1E3A`. Border: 1.5px solid `#3A3A60`. A small flame icon (`🔥`) on the left side baked in (24×24px). The streak number itself is rendered by Phaser Text. When streak is active (> 0), Phaser applies an orange tint to the badge.

---

### 5.5 Streak Milestone Overlay Banner

| Property | Value |
|---|---|
| File | `streak-milestone-banner.png` |
| Dimensions | 700 × 100 px |
| Format | PNG with alpha |

**Description**: A horizontal pill banner. Fill: dark background at 80% opacity with a gold gradient border (2px, `#FFD700`). Contains placeholder space for "STREAK ×5!" text — Phaser renders the actual text as `Text` objects on top. The banner background gives the text a clear readable backdrop regardless of what's behind it.

---

## Section 6 — Buttons

All buttons designed with 3 states: **Normal**, **Pressed** (slightly darker/inset), **Disabled** (heavily desaturated, ~40% opacity).

---

### 6.1 SPIN Button

| Property | Value |
|---|---|
| File | `btn-spin.png` (3-frame spritesheet) |
| Frame dimensions | 320 × 120 px |
| Total dimensions | 960 × 120 px (horizontal strip) |
| Format | PNG with alpha |

**Description**: Large rounded pill button — the primary action in the game.

- **Normal**: Fill: rich blue-to-purple gradient (left `#3498DB` → right `#9B59B6`). Border: 2px solid `#5AB8FF`. Inner glow at top edge (white, 30% opacity) for a raised 3D feel. Bold white "SPIN" text baked in center (48px, high contrast). Drop shadow below: `#000000` 50% opacity, 4px offset.
- **Pressed**: All colors shifted 20% darker. Inner shadow on top edge (dark, 40%) instead of outer glow. "SPIN" text shifts down 2px to simulate physical press.
- **Disabled**: Desaturated fill (grey-blue `#2A3A4A`). Border: `#3A4A5A`. Text: `#5A6A7A`. No shadow.

The SPIN button is the most tapped object in the game — it must be **instantly findable** and communicate "tap here" without any instruction.

---

### 6.2 JACKPOT Button

| Property | Value |
|---|---|
| File | `btn-jackpot.png` (3-frame spritesheet) |
| Frame dimensions | 220 × 100 px |
| Total dimensions | 660 × 100 px |
| Format | PNG with alpha |

**Description**: Smaller than SPIN, left of it. Contains a star icon + "JACKPOT" text.

- **Empty (no ball)**: Fill: `#1E1E2E` (very dark). Border: `#3A3A60`. Star icon greyed out (`#3A3A60`). Text: `#5A5A7A`. Phaser renders ball count "×0" beside it. Overall feeling: dormant.
- **Charged (ball available)**: Fill: dark background with gold radial glow (inner). Border: `#FFD700` with outer glow 4px. Star icon: full gold (`#FFD700`) with particle shimmer added by Phaser. Text: `#FFD700`. Phaser pulses the border alpha to draw attention.
- **Selection mode active**: Fill: brighter gold gradient. Border stronger gold. This state communicates "now choose where to place it."

---

### 6.3 Speed Toggle Button

| Property | Value |
|---|---|
| File | `btn-speed.png` (2-frame spritesheet) |
| Frame dimensions | 100 × 80 px |
| Total dimensions | 200 × 80 px |
| Format | PNG with alpha |

**Description**: A small square/rounded button.

- **Normal speed**: A single chevron/arrow `›` or rabbit icon. Fill: `#1E1E3A`. Border: `#3A3A60`. Icon: white.
- **Fast speed**: Double chevron `»` or running rabbit. Fill: `#FF8C00` (orange). Border: `#FFA040`. Icon: white. Orange fill communicates "active / different mode."

---

### 6.4 Cancel Button (appears during jackpot selection mode)

| Property | Value |
|---|---|
| File | `btn-cancel.png` (2-frame spritesheet) |
| Frame dimensions | 160 × 72 px |
| Total dimensions | 320 × 72 px |
| Format | PNG with alpha |

**Description**: A small dark button with "CANCEL" text and an × icon. Fill: `#2A1A1A`. Border: `#E74C3C`. Text: `#E74C3C`. Pressed state: border and text darken slightly.

---

### 6.5 PLAY Button (Menu Screen)

| Property | Value |
|---|---|
| File | `btn-play.png` (2-frame spritesheet) |
| Frame dimensions | 400 × 140 px |
| Total dimensions | 800 × 140 px |
| Format | PNG with alpha |

**Description**: Large prominent pill button for the main menu.
- **Normal**: Gold gradient fill (left `#B8860B` → center `#FFD700` → right `#B8860B`). Border: 3px solid `#FFFFFF` at 60% opacity. Bold white "PLAY" text, 56px. Strong drop shadow. Optional subtle shimmer gradient animation (handled by Phaser tween on alpha).
- **Pressed**: Darkened gold. Text shifts down 2px.

---

### 6.6 PLAY AGAIN / MAIN MENU Buttons (Results Screen)

| Property | Value |
|---|---|
| File | `btn-secondary.png` (2-frame spritesheet) |
| Frame dimensions | 480 × 110 px |
| Total dimensions | 960 × 110 px |
| Format | PNG with alpha |

**Description**: Generic secondary action button. Fill: `#1E2A3A`. Border: `#3498DB`. Text placeholder (Phaser renders the label). Used for both PLAY AGAIN and MAIN MENU with different labels.

---

## Section 7 — HUD Elements

### 7.1 Position Badge

| Property | Value |
|---|---|
| File | `hud-position-badge.png` |
| Dimensions | 280 × 64 px |
| Format | PNG with alpha |

**Description**: A dark pill badge (fill `#161628`, border `#3A3A60`) with placeholder space for dynamic text "3rd / 8". Phaser renders the text. Left side: small podium icon or medal icon (24×24px) baked into the sprite. Badge has a subtle gradient at left edge for depth.

---

### 7.2 Timer Badge

| Property | Value |
|---|---|
| File | `hud-timer-badge.png` |
| Dimensions | 200 × 64 px |
| Format | PNG with alpha |

**Description**: Same style as position badge. Left side: small clock icon baked in. Phaser renders the time text ("2:34").

---

### 7.3 Top HUD Bar Background

| Property | Value |
|---|---|
| File | `hud-bar-bg.png` |
| Dimensions | 1080 × 100 px |
| Format | PNG with alpha |

**Description**: A full-width dark strip at the top of the screen. Fill: `#0D0D1A` at 85% opacity. Bottom edge: 1px border `#2A2A50` at 60% opacity. A very subtle gradient — slightly more opaque at top. This gives HUD badges a consistent background that doesn't compete with the card beneath.

---

## Section 8 — Overlays & Announcements

### 8.1 BINGO Win Overlay

| Property | Value |
|---|---|
| File | `overlay-bingo.png` |
| Dimensions | 800 × 280 px |
| Format | PNG with alpha |

**Description**: A large dramatic text treatment for "BINGO!". Not plain text — this is designed artwork:
- "BINGO!" in very large bold display font (120px+), white with a thick gold stroke (6px `#FFD700`)
- Under the text: a soft horizontal lens-flare gradient (gold-to-transparent) spanning the width
- Background: none (transparent) — Phaser adds a full-screen dark vignette behind this sprite in code
- Exclamation mark should be a different weight or color (gold star instead of ! for flair)

Phaser scales this in from 0.3 to 1.1 then settles at 1.0 (bounce-in).

---

### 8.2 Bot Win Announcement Banner

| Property | Value |
|---|---|
| File | `overlay-bot-win.png` |
| Dimensions | 800 × 100 px |
| Format | PNG with alpha |

**Description**: A horizontal banner that slides in from the top. Fill: `#1A0A0A` at 90% opacity. Border top and bottom: 2px `#E74C3C`. Left side: small warning/siren icon baked in. Right area left empty for Phaser text ("[Name] got BINGO!"). Text color: `#FF6B6B`.

---

### 8.3 Pressure Phase — Screen Edge Pulse

No sprite needed. Implemented entirely in Phaser `Graphics`:

```
Graphics.lineStyle(60, 0xE74C3C, 0.5)
Graphics.strokeRect(0, 0, 1080, 1920)
// Alpha tweened 0 → 0.5 → 0, looping, period: 1500ms
```

Reference only — document for developer. No art file required.

---

### 8.4 Jackpot Ball Earned — Popup

| Property | Value |
|---|---|
| File | `popup-jackpot-earned.png` |
| Dimensions | 600 × 180 px |
| Format | PNG with alpha |

**Description**: A rectangular popup panel that appears briefly. Fill: dark background (`#1A1A2E`) with a gold border (3px, `#FFD700`) and a very strong outer glow (`#FFD700` at 40% opacity, 12px spread). Left side: large star icon baked in (60×60px, full gold). Right area: placeholder for "JACKPOT BALL EARNED!" text (Phaser text rendered on top). Bottom: thin gold shimmer line.

Phaser scales in from center with a bounce, holds for 1.5s, then fades out upward.

---

### 8.5 Streak Milestone — Popup Banner

*(See 5.5 above — re-used with different text content)*

---

### 8.6 Countdown Overlay (3… 2… 1… GO!)

| Property | Value |
|---|---|
| File | `overlay-countdown-bg.png` |
| Dimensions | 1080 × 1920 px |
| Format | PNG with alpha |

**Description**: A full-screen semi-transparent overlay (`#0D0D1A` at 70% opacity). Used as the backdrop while the countdown numbers display. The countdown numbers themselves are rendered by Phaser Text (large, white, animated). The overlay fades out as "GO!" appears.

---

## Section 9 — Results Screen Elements

### 9.1 Results Panel

| Property | Value |
|---|---|
| File | `results-panel.png` |
| Dimensions | 900 × 1200 px |
| Format | PNG with alpha |
| 9-slice margins | 30 px all sides |

**Description**: A tall rounded rectangle panel (radius 24px). Fill: `#161628`. Border: 2px solid `#3A3A60`. Inner shadow on all edges. This panel contains all result stats. Designed to be centered on screen with padding.

---

### 9.2 Trophy Icons

Three separate sprites:

| File | Dimensions | Description |
|---|---|---|
| `trophy-gold.png` | 120 × 140 px | Gold trophy — `#FFD700` main color, shiny highlight, "1st" engraved |
| `trophy-silver.png` | 100 × 120 px | Silver trophy — `#C0C0C0`, slightly smaller than gold |
| `trophy-bronze.png` | 90 × 110 px | Bronze trophy — `#CD7F32`, smallest |

**Description**: Classic trophy shapes. The gold trophy should have a distinct sparkle/shimmer quality. Silver and bronze are slightly more muted. No text baked in — Phaser adds "1st", "2nd", "3rd" as text overlays.

For positions 4–8: no trophy sprite. Phaser renders a plain position number badge using the HUD badge background.

---

### 9.3 Stat Row Icons

Small icon set for the stats on the results screen. All icons: 48 × 48 px, PNG with alpha.

| File | Icon | Stat |
|---|---|---|
| `icon-coins.png` | Gold coin stack | Coins earned |
| `icon-cells.png` | Bingo cell grid (2×2) | Cells closed |
| `icon-streak.png` | Flame | Best streak |
| `icon-jackpot.png` | Small star | Jackpots used |

**Style**: Flat icon design, single-color fills matching the color palette. White outline (1.5px) on dark background for contrast. Simple and readable at 48px.

---

### 9.4 Confetti Particles

| Property | Value |
|---|---|
| File | `confetti-sheet.png` |
| Frame size | 20 × 20 px |
| Frames | 6 different shapes |
| Total size | 120 × 20 px |
| Format | PNG with alpha |

**Description**: Six small confetti piece shapes:
1. Small rectangle (horizontal)
2. Small rectangle (diagonal)
3. Circle/dot
4. Star
5. Diamond
6. Zigzag ribbon

Each frame is transparent except the shape. Phaser `ParticleEmitter` uses this sheet with random frame selection, random tints, and physics to create the celebration confetti effect on win. Do not bake colors in — tinting is done in code using the palette colors.

---

## Section 10 — Logo & Menu

### 10.1 Game Logo

| Property | Value |
|---|---|
| File | `logo-main.png` |
| Dimensions | 800 × 200 px |
| Format | PNG with alpha |

**Description**: The game's working title "Skill Bingo Slots" styled as a logo. Design suggestions:
- "SKILL" in smaller caps above
- "BINGO" in very large bold display font, center — this is the visual anchor
- "SLOTS" in smaller text below "BINGO"
- Incorporate a bingo ball icon or slot reel motif into the letterforms or as a flanking element
- Color: "BINGO" in gold (`#FFD700`) with a white glow; supporting text in white
- The logo should read at half this size when placed on the menu screen

---

### 10.2 Loading Bar

| Property | Value |
|---|---|
| File | `loading-bar-bg.png` | 
| Dimensions | 600 × 24 px |
| Format | PNG with alpha |

| File | `loading-bar-fill.png` |
|---|---|
| Dimensions | 600 × 24 px |
| Format | PNG with alpha |

**Description**: Two horizontal pill shapes (matching width). Background: dark `#1E1E3A` with border `#3A3A60`. Fill: blue-to-gold gradient, used as a mask/crop target as Phaser updates load progress. Phaser crops the fill sprite from left based on load percentage.

---

## Section 11 — Particle FX (Atlases)

These are small sprites used as Phaser particle emitter sources. All at 32 × 32 px unless noted.

| File | Description | Use |
|---|---|---|
| `particle-sparkle.png` | 4-pointed star, white, soft edge | Cell close burst |
| `particle-spark.png` | Thin elongated spark, gold | Jackpot explosion |
| `particle-dot.png` | Soft circle, white | General purpose |
| `particle-star.png` | 5-pointed star, gold | Jackpot celebration |
| `particle-ring.png` | Thin circle ring, white | Line complete pulse |

All particles: single shape on transparent background. Tinting and scaling handled entirely in Phaser. Keep them simple — complex particle sprites are wasted when they're 4px on screen.

---

## Section 12 — Fonts

Fonts are loaded as web fonts or bitmap fonts, not embedded in sprites.

| Role | Suggested Font | Fallback | Size Range |
|---|---|---|---|
| Card numbers | **Rajdhani Bold** or **Barlow Condensed Bold** | Impact, Arial Narrow | 28–36px |
| UI labels (buttons, HUD) | **Nunito Bold** or **Poppins Bold** | Arial Bold | 24–48px |
| Stats / secondary text | **Nunito Regular** | Arial | 22–28px |
| Logo / display | **Bebas Neue** or custom display font | Impact | 80–120px |

**Card number legibility is paramount.** The number font must be:
- Clearly distinguishable for all digits 0–9 (especially 6 vs 9, 1 vs 7)
- Bold enough to read at 28px on a phone screen
- Comfortable for 1 and 2-digit numbers (numbers 1–75)

Use Google Fonts (Rajdhani, Barlow Condensed) — free, load fast, mobile-safe.

---

## Section 13 — Audio Assets

### Audio Direction

**Overall tone**: Satisfying, clean, casino-light without being cheesy. Prefer punchy electronic sounds with warmth — not overly synthetic, not overly realistic. Each sound must be immediately identifiable by ear alone, even with the screen off.

**Technical specs** (all files):
- Format: MP3 (primary) + OGG (fallback for Safari compatibility)
- Sample rate: 44.1 kHz
- Bit depth: 16-bit minimum
- Channels: Stereo for music, Mono acceptable for short SFX
- No silence at start or end (trim to content precisely)
- Normalize to -3 dBFS peak, -18 LUFS average for SFX

---

### SFX Catalog

#### SFX-01 — Reel Spin Start
| Property | Value |
|---|---|
| File | `sfx-reel-spin.mp3` |
| Duration | 0.6–0.8s (can loop if needed, but match ensures it stops) |
| Trigger | When SPIN is tapped, reels begin |

**Sound description**: A rapid mechanical whirring that ramps up quickly — like a ratchet accelerating. Mid-frequency dominant (500Hz–2kHz). Slight pitch rise over the duration. Should convey speed and mechanical energy without being harsh. Think: spinning reward wheel, but faster and more electronic. Ends abruptly (the reel-stop sounds take over individually).

---

#### SFX-02 — Reel Stop (individual reel)
| Property | Value |
|---|---|
| File | `sfx-reel-stop.mp3` |
| Duration | 0.15–0.20s |
| Trigger | Each time one reel stops (fires 5 times per spin, 200ms apart) |

**Sound description**: A hard mechanical "thunk" or "clack." Short attack, fast decay. Like a physical slot machine's reel stopping. Mid-low punch (200–800Hz). Should be satisfying but brief — it fires 5 times in under 1 second, so it must not be annoying in rapid succession. Slightly different character than a button click — more "mechanical gear catching."

---

#### SFX-03 — Useful Hit (cell closed)
| Property | Value |
|---|---|
| File | `sfx-useful-hit.mp3` |
| Duration | 0.4–0.6s |
| Trigger | When a number matches an open cell and the cell closes |

**Sound description**: The most rewarding sound in the game — plays very frequently (every useful hit). A bright, clean rising chime. Start with a soft attack, bright mid tone (1–3kHz), short tail. Resembles a xylophone or glass bell hit. Warm, not piercing. The player hears this dozens of times per match — it must be pleasant on repeat but still feel like a reward, never background noise.

**Variation**: Consider 2–3 slight pitch variations (same file, different takes at ±2 semitones). Phaser can randomly pitch-shift or pick variation to prevent repetitiveness.

---

#### SFX-04 — Near Hit
| Property | Value |
|---|---|
| File | `sfx-near-hit.mp3` |
| Duration | 0.3s |
| Trigger | Spin result is a number not on card but timing was GOOD or PERFECT |

**Sound description**: A softer, slightly muted version of the useful hit chime. Same character but quieter (-6dB) and slightly lower in pitch (-2 semitones). Should feel like "almost" without being frustrating. A brief swoosh followed by a soft ping. Not negative — just less triumphant than a full hit.

---

#### SFX-05 — Jackpot Meter Segment Fill
| Property | Value |
|---|---|
| File | `sfx-jackpot-segment.mp3` |
| Duration | 0.2s |
| Trigger | Each time the jackpot meter fills one segment (0%, 20%, 40%, 60%, 80%) |

**Sound description**: A short rising tick or ping — distinct from the useful hit chime. Higher in pitch (2–5kHz), very short. Like a coin dropping into a container that's filling up. Each fill should feel like incremental progress toward something bigger. Think: notification ping, but golden/warm in character.

---

#### SFX-06 — Jackpot Ball Earned
| Property | Value |
|---|---|
| File | `sfx-jackpot-earned.mp3` |
| Duration | 1.0–1.5s |
| Trigger | Jackpot meter reaches 100%, ball earned |

**Sound description**: A short fanfare sting — the most dramatic non-win sound in the game. A rising 3-note brass/synth motif (think: classic slot jackpot, but faster and cleaner). Full stereo, wide. Ends on a high sustained note that briefly rings. Should feel genuinely exciting even after hearing it 20 times. Not over-the-top — this isn't the win sound, it's a preview of power.

---

#### SFX-07 — Perfect Timing
| Property | Value |
|---|---|
| File | `sfx-perfect.mp3` |
| Duration | 0.2–0.3s |
| Trigger | Player taps SPIN in the PERFECT zone |

**Sound description**: A crisp, clean tap — like a fingernail on crystal glass, or a high-pitched electronic "ting." High frequency (3–6kHz). Extremely short, attack-heavy. Should be distinctly different from all other sounds. Its purpose is instant confirmation that the player nailed the timing — like a skill shot sound. Satisfying but subtle — it fires often if the player is skilled.

---

#### SFX-08 — Cell Close (animation sync)
| Property | Value |
|---|---|
| File | `sfx-cell-close.mp3` |
| Duration | 0.3s |
| Trigger | Cell visual close animation starts |

**Sound description**: A soft "pop" with a short sparkle tail. Low-mid "pop" (200–500Hz) for the initial impact, followed by a brief high-frequency shimmer (sparkle, 4–8kHz, 150ms). The pop confirms the cell filled; the shimmer is the particle FX sound. Warm and satisfying, not harsh.

---

#### SFX-09 — BINGO Win
| Property | Value |
|---|---|
| File | `sfx-bingo-win.mp3` |
| Duration | 2.0–2.5s |
| Trigger | Player completes a line and wins the match |

**Sound description**: The biggest sound in the game. A full celebratory fanfare. Structure: short rising swell (0.3s) → triumphant chord hit (full stereo, brass + bells, 0.5s) → descending sparkle cascade (1.0s). Should feel like the player genuinely won something. Reference: game show winning sting crossed with a slot jackpot. Bright, warm, unambiguously positive. Must not be fatiguing since players will hear it often if they win frequently.

---

#### SFX-10 — Pressure Phase Start
| Property | Value |
|---|---|
| File | `sfx-pressure.mp3` |
| Duration | 0.6s |
| Trigger | Pressure phase activates (any player 1 cell from winning) |

**Sound description**: A low, ominous bass pulse — like a warning signal. Sub-bass hit (60–120Hz) with a mid-frequency "thrum." Should feel tense without being scary. Like a game-show countdown warning. Single hit, no loop (the visual screen pulse handles the ongoing tension). Players should feel urgency, not fear.

---

### Optional / Nice-to-Have SFX (not required for MVP)

| File | Trigger | Description |
|---|---|---|
| `sfx-full-miss.mp3` | Complete useless spin (bad timing, wrong number) | Soft negative tone — quiet "thud" or low buzzer at low volume. Not annoying. |
| `sfx-streak-start.mp3` | Streak counter goes from 0 to 1 | A quiet ascending chime different from useful hit — subtle "beginning" feeling |
| `sfx-streak-break.mp3` | Streak breaks | Descending short tone — "deflation" but not harsh |
| `sfx-streak-milestone-5.mp3` | Streak reaches 5 | Power chord sting, shorter than jackpot earned |
| `sfx-jackpot-place.mp3` | Player places jackpot ball on a cell | Heavy satisfying thud + sparkle — the most powerful single cell action |
| `sfx-line-complete.mp3` | A line is completed (used when there's still more to do — Marathon mode) | Mini-fanfare, shorter than bingo-win |

---

### Audio Accessibility Notes

- All game events are communicated visually in addition to audio — audio is enhancement only
- Volume defaults to 70% with user-accessible slider
- Mute option available on the menu screen
- SFX and music volume controlled independently (for future music addition)
- No sounds that flash or pulse at frequencies above 3Hz (photosensitivity consideration)

---

## Section 14 — Asset Delivery Checklist

### Texture Atlas Layout

Pack all sprites into two atlases to minimize draw calls:

**`ui-atlas`** — contains all UI elements:
- All button states (6.1–6.6)
- All HUD elements (7.1–7.3)
- All overlay sprites (8.1–8.4)
- All meter sprites (5.1–5.5)
- Timing bar elements (4.1–4.3)
- Results screen elements (9.1–9.4)
- Particle sprites (11)
- Icons (9.3)

**`reel-atlas`** — contains all slot machine elements:
- Symbol sprites (3.4)
- Reel frame and backgrounds (3.1–3.3)
- Reel flash overlay (3.5)

**Standalone files** (too large or full-screen, can't be in atlas):
- All backgrounds (1.1–1.3)
- Logo (10.1)
- Bingo card frame (2.1)
- Cell base sprites (2.2–2.6, 2.8) — can be in UI atlas if they fit

---

### Delivery Format Summary

| Type | Files | Format |
|---|---|---|
| Atlas textures | `ui-atlas.png`, `reel-atlas.png` | PNG, power-of-2 dimensions (e.g., 2048×2048) |
| Atlas data | `ui-atlas.json`, `reel-atlas.json` | Phaser-compatible (TexturePacker "Phaser 3" export) |
| Standalone images | Backgrounds, logo, bingo frame | PNG |
| SFX | 10 required files | MP3 + OGG each |
| Fonts | Rajdhani Bold, Nunito Bold/Regular | Loaded from Google Fonts CDN or self-hosted WOFF2 |

---

### MVP Asset Count Summary

| Category | Count | Priority |
|---|---|---|
| Backgrounds | 3 | Required |
| Bingo card sprites | 8 | Required |
| Slot machine sprites | 7 | Required |
| Timing bar sprites | 7 | Required |
| Meter / streak sprites | 5 | Required |
| Buttons | 6 types × ~2–3 states | Required |
| HUD elements | 3 | Required |
| Overlays / popups | 6 | Required |
| Results screen | 7 | Required |
| Logo + loading | 3 | Required |
| Particle sprites | 5 | Required |
| **Total graphic assets** | **~70 sprites / frames** | |
| SFX (required) | 10 | Required |
| SFX (optional) | 6 | Nice-to-have |
| Fonts | 3 weights | Required (CDN load) |

---

*End of ASSETS.md*  
*Next steps: share this document with graphic designer and audio designer; create a shared folder with the project color palette as a `.ase` / `.aco` swatch file for design consistency.*
