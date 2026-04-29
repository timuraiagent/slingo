# Skill Bingo Slots — MVP Asset List

> **Purpose**: Identify the minimum set of assets required to build and test the MVP.  
> **Principle**: Anything Phaser can draw with `Graphics`, `Text`, or `Tween` does not need an art file. Only commission assets when the code equivalent would either (a) look unacceptably bad, or (b) take longer to build than sourcing the asset.  
> **Result**: 13 graphic files + 10 audio files instead of ~70 graphic files.

---

## Decision Framework

| Can be replaced by code | Needs a real asset |
|---|---|
| Solid/gradient rectangles and panels | Illustrated symbols (jackpot, wild, multiplier) |
| Rounded rect borders and cell backgrounds | Particle sprite sheets |
| Text labels (zone names, button labels) | The game logo |
| Meter bar segments (just colored rects) | Buttons (SPIN, JACKPOT) — feel critical |
| HUD badges (text + Graphics background) | BINGO announcement (styled display text) |
| Screen backgrounds (dark flat fills) | All audio — no code replacement exists |
| Trophy text (🥇🥈🥉 emoji in Text) | |
| Column headers (colored Text objects) | |
| Overlays (Graphics alpha tween) | |
| Loading bar (Graphics crop) | |

---

## REQUIRED — Graphic Assets (13 files)

---

### G-01 — Game Logo

| Property | Value |
|---|---|
| File | `logo-main.png` |
| Dimensions | 800 × 200 px |
| Format | PNG with alpha |
| Used in | MenuScene |

**Why it needs to be an asset**: The logo is the game's first visual impression and sets the art direction for everything else. Phaser `Text` alone cannot produce a styled multi-word logo with custom typographic treatment.

**Description**: "Skill Bingo Slots" — "BINGO" large and dominant in gold (`#FFD700`), "SKILL" small-caps above in white, "SLOTS" small below. Bold display font. A bingo ball or slot reel motif as a design element. White outer glow on "BINGO." See `ASSETS.md §10.1` for full description.

---

### G-02 — SPIN Button

| Property | Value |
|---|---|
| File | `btn-spin.png` (2-frame horizontal strip) |
| Frame dimensions | 320 × 120 px |
| Total dimensions | 640 × 120 px |
| Format | PNG with alpha |
| Frames | Frame 0: Normal · Frame 1: Pressed |
| Used in | MatchScene → ControlZone |

**Why it needs to be an asset**: The SPIN button is tapped dozens of times per match. A plain Phaser `Graphics` rounded rect will look and feel cheap. The button's visual polish directly communicates "this is the primary action."

**Disabled state**: Handled in code — Phaser sets `alpha = 0.4` on the Normal frame. No separate asset needed.

**Description**: Pill-shaped button. Normal: blue-to-purple gradient, white bold "SPIN" text baked in, subtle top highlight. Pressed: same shape, all colors 20% darker, text shifted 2px down. See `ASSETS.md §6.1` for full description.

---

### G-03 — JACKPOT Button

| Property | Value |
|---|---|
| File | `btn-jackpot.png` (2-frame horizontal strip) |
| Frame dimensions | 220 × 100 px |
| Total dimensions | 440 × 100 px |
| Format | PNG with alpha |
| Frames | Frame 0: Empty (no ball) · Frame 1: Charged (ball available) |
| Used in | MatchScene → ControlZone |

**Why it needs to be an asset**: The visual difference between "empty" and "charged" is a core gameplay signal — the player must immediately notice when a jackpot ball is available. A coded version risks this transition being unclear or unexciting.

**Description**: Empty: dark fill, greyed star, subdued border. Charged: dark bg with gold radial glow, full gold star, gold border. Phaser adds a pulsing border alpha tween on the Charged frame in code. See `ASSETS.md §6.2`.

---

### G-04 — Speed Toggle Button

| Property | Value |
|---|---|
| File | `btn-speed.png` (2-frame horizontal strip) |
| Frame dimensions | 100 × 80 px |
| Total dimensions | 200 × 80 px |
| Format | PNG with alpha |
| Frames | Frame 0: Normal speed · Frame 1: Fast speed |
| Used in | MatchScene → ControlZone |

**Why it needs to be an asset**: Small but used every match. A coded version is possible but a simple 2-frame sprite is faster to implement correctly and maintains visual consistency with the other buttons.

**Description**: Normal: single chevron `›`, dark fill, white icon. Fast: double chevron `»`, orange fill (`#FF8C00`), white icon. See `ASSETS.md §6.3`.

---

### G-05 — Jackpot Symbol (★)

| Property | Value |
|---|---|
| File | `sym-jackpot.png` |
| Dimensions | 152 × 140 px |
| Format | PNG with alpha |
| Used in | SlotMachine reels |

**Why it needs to be an asset**: The jackpot reel symbol must visually stand apart from number symbols at a glance. A Phaser `Text` star character `★` does not carry the weight and visual excitement this symbol needs.

**Description**: Gold 5-pointed star with inner glow gradient (bright center → deep gold edges), soft outer glow ring. Fills ~75% of the tile. See `ASSETS.md §3.4`.

---

### G-06 — Wild Symbol (🌟)

| Property | Value |
|---|---|
| File | `sym-wild.png` |
| Dimensions | 152 × 140 px |
| Format | PNG with alpha |
| Used in | SlotMachine reels |

**Why it needs to be an asset**: Same reason as jackpot — must be instantly distinguishable from numbers and from the jackpot symbol. The rainbow/multi-color treatment cannot be achieved with a single Phaser `Text` character.

**Description**: Glowing multi-color orb with a 4-pointed sparkle. Soft white center, rainbow halo. See `ASSETS.md §3.4`.

---

### G-07 — Multiplier Symbol (×2)

| Property | Value |
|---|---|
| File | `sym-multiplier.png` |
| Dimensions | 152 × 140 px |
| Format | PNG with alpha |
| Used in | SlotMachine reels |

**Why it needs to be an asset**: The "×2" text needs a custom shaped background (purple diamond shield) to visually distinguish it from all other symbols. A plain styled Text object would look out of place among the illustrated jackpot/wild symbols.

**Description**: Purple (`#9B59B6`) diamond shield shape, white bold "×2" centered, hard clean edges. See `ASSETS.md §3.4`.

---

### G-08 — BINGO Win Overlay Text

| Property | Value |
|---|---|
| File | `overlay-bingo.png` |
| Dimensions | 800 × 280 px |
| Format | PNG with alpha |
| Used in | MatchScene — win state |

**Why it needs to be an asset**: "BINGO!" is the emotional peak of every match. A plain Phaser `Text` object cannot produce the outlined, stroked, glow-treated display typography this moment deserves. This is the game's most important single visual.

**Description**: "BINGO!" in large bold display font, white fill with 6px gold stroke (`#FFD700`), horizontal lens-flare gradient below. Transparent background — Phaser adds a dark vignette in code. See `ASSETS.md §8.1`.

---

### G-09 — Confetti Particle Sheet

| Property | Value |
|---|---|
| File | `confetti-sheet.png` |
| Frame size | 64 × 64 px |
| Total size | 384 × 64 px (6 frames, horizontal strip) |
| Format | PNG with alpha |
| Used in | MatchScene — win celebration |

**Why it needs to be an asset**: Phaser's built-in particle shapes are circles and squares only. The BINGO win celebration needs varied confetti shapes (rectangles, stars, diamonds) to feel festive. Without this, the win feels flat.

**Description**: 6 frames — rectangle, rotated rectangle, circle, small star, diamond, ribbon. No baked colors — Phaser applies random tints from the palette at runtime. See `ASSETS.md §9.4`.

---

### G-10 — Cell Close Sparkle Particle

| Property | Value |
|---|---|
| File | `particle-sparkle.png` |
| Dimensions | 32 × 32 px |
| Format | PNG with alpha |
| Used in | BingoCard — cell close animation |

**Why it needs to be an asset**: The cell close sparkle burst fires on every useful hit — the most frequent animation in the game. Phaser's default circular particles look generic. A 4-pointed star sparkle shape makes every cell close feel crisp and intentional.

**Description**: White 4-pointed star, soft feathered edges, transparent background. Phaser tints it green (`#2ECC71`) for normal closes, gold for jackpot closes. See `ASSETS.md §11`.

---

### G-11 — Jackpot Spark Particle

| Property | Value |
|---|---|
| File | `particle-spark.png` |
| Dimensions | 32 × 32 px |
| Format | PNG with alpha |
| Used in | MatchScene — jackpot ball earned + jackpot cell close |

**Why it needs to be an asset**: The jackpot earned moment needs a visually distinct explosion — gold elongated sparks, not green sparkles. Differentiating the two particles makes the jackpot moment feel more prestigious.

**Description**: Thin elongated gold spark shape (like a streak of light), tapered at both ends. Phaser uses with high velocity and gravity for a fireworks-like burst. See `ASSETS.md §11`.

---

### G-12 — Reel Result Row Highlight

| Property | Value |
|---|---|
| File | `reel-result-row.png` |
| Dimensions | 1040 × 152 px |
| Format | PNG with alpha |
| Used in | SlotMachine — overlaid on all reels |

**Why it needs to be an asset**: The result row indicator (the gold lines + triangular markers that frame the active reel row) requires precise visual design to be readable. A Graphics-drawn version would require significant code to replicate the gold edge lines + triangle markers, and would be brittle to layout changes.

**Description**: Horizontal band spanning all 5 reels. Transparent interior, thin gold top/bottom edge lines, small gold triangle markers at each end pointing inward. Faint gold glow at 10% opacity. See `ASSETS.md §3.3`.

---

### G-13 — Jackpot Ball Earned Popup

| Property | Value |
|---|---|
| File | `popup-jackpot-earned.png` |
| Dimensions | 600 × 180 px |
| Format | PNG with alpha |
| Used in | MatchScene — when jackpot meter fills |

**Why it needs to be an asset**: This popup is a key reward moment. The combination of a gold border glow + the baked star icon + the outer glow effect is difficult to make look right with pure Graphics. A pre-designed popup ensures it always looks polished at this important moment.

**Description**: Dark rounded panel, 3px gold border with strong outer glow, large baked star icon on left. Text area on right is empty — Phaser renders "JACKPOT BALL EARNED!" as a `Text` object on top. See `ASSETS.md §8.4`.

---

## REQUIRED — Audio Assets (10 files)

All audio from `ASSETS.md §13` is required without exception. Audio cannot be replaced by code.

Each file delivered as **MP3 + OGG** pair (20 files total, 10 sounds).

| # | File | Duration | Trigger | Priority |
|---|---|---|---|---|
| A-01 | `sfx-reel-spin.mp3/.ogg` | 0.6–0.8s | SPIN tapped, reels begin | Critical |
| A-02 | `sfx-reel-stop.mp3/.ogg` | 0.15–0.2s | Each reel stops (×5 per spin) | Critical |
| A-03 | `sfx-useful-hit.mp3/.ogg` | 0.4–0.6s | Cell closed by matching number | Critical |
| A-04 | `sfx-near-hit.mp3/.ogg` | 0.3s | Good timing, number not on card | Critical |
| A-05 | `sfx-jackpot-segment.mp3/.ogg` | 0.2s | Jackpot meter fills one segment | Critical |
| A-06 | `sfx-jackpot-earned.mp3/.ogg` | 1.0–1.5s | Jackpot meter reaches 100% | Critical |
| A-07 | `sfx-perfect.mp3/.ogg` | 0.2–0.3s | Player taps in PERFECT zone | Critical |
| A-08 | `sfx-cell-close.mp3/.ogg` | 0.3s | Cell close animation starts | Critical |
| A-09 | `sfx-bingo-win.mp3/.ogg` | 2.0–2.5s | Player completes a line and wins | Critical |
| A-10 | `sfx-pressure.mp3/.ogg` | 0.6s | Any player is 1 cell from winning | Critical |

For full sound design descriptions (tone, character, reference), see `ASSETS.md §13`.

---

## DEFERRED — Replaced by Phaser Code

Everything below is in `ASSETS.md` but **not needed for MVP**. Each entry notes exactly how to replace it in Phaser.

### Backgrounds (all 3)
```javascript
// bg-match.png → draw in PreloadScene or MatchScene:
const bg = scene.add.graphics();
bg.fillGradientStyle(0x0D0D1A, 0x0D0D1A, 0x12102A, 0x12102A, 1);
bg.fillRect(0, 0, 1080, 1920);
```
Same approach for menu and results backgrounds — swap the gradient colors.

---

### Bingo Card Frame
```javascript
// card-frame.png → draw with Graphics:
const frame = scene.add.graphics();
frame.lineStyle(2, 0x3A3A60, 1);
frame.fillStyle(0x161628, 1);
frame.fillRoundedRect(x, y, 900, 900, 20);
frame.strokeRoundedRect(x, y, 900, 900, 20);
```

---

### Cell Sprites — Open, Closed, Hot, Near-Win (all 5 cell states)
```javascript
// cell-open.png → draw per cell:
const cell = scene.add.graphics();
cell.fillStyle(0x1E1E3A, 1);
cell.lineStyle(1.5, 0x3A3A60, 1);
cell.fillRoundedRect(0, 0, 152, 152, 12);
cell.strokeRoundedRect(0, 0, 152, 152, 12);

// Closed state → recolor fill:
cell.clear();
cell.fillStyle(0x2ECC71, 1);  // green
cell.lineStyle(1.5, 0x1A7A44, 1);
cell.fillRoundedRect(0, 0, 152, 152, 12);

// Hot state → add orange border tween (no separate sprite):
scene.tweens.add({ targets: hotOverlay, alpha: { from: 0.4, to: 1 }, yoyo: true, repeat: -1 });
// hotOverlay = Graphics with orange strokeRoundedRect only (fill: none)

// Near-win → gold pulsing border overlay, same approach as hot
```

---

### FREE Cell
```javascript
// cell-free.png → closed cell bg + Text "FREE" + star Text:
const freeBg = scene.add.graphics(); // same as closed cell
const starText = scene.add.text(cx, cy - 10, '★', { fontSize: '36px', color: '#FFD700' });
const freeText = scene.add.text(cx, cy + 20, 'FREE', { fontSize: '18px', color: '#FFFFFF', fontStyle: 'bold' });
```

---

### Jackpot Target Marker
```javascript
// cell-jackpot-marker.png → Graphics gold border, alpha tweened:
const marker = scene.add.graphics();
marker.lineStyle(3, 0xFFD700, 1);
marker.strokeRoundedRect(0, 0, 152, 152, 12);
scene.tweens.add({ targets: marker, alpha: { from: 0.4, to: 1 }, yoyo: true, repeat: -1, duration: 600 });
```

---

### Column Header Letters (B-I-N-G-O)
```javascript
// card-headers.png → Text objects, one per column:
const HEADERS = ['B','I','N','G','O'];
const COLORS  = ['#3498DB','#9B59B6','#2ECC71','#FF8C00','#E74C3C'];
HEADERS.forEach((letter, i) => {
  scene.add.text(cellX(i), headerY, letter, {
    fontSize: '32px', fontStyle: 'bold', color: COLORS[i]
  }).setOrigin(0.5);
});
```

---

### Timing Bar Background (zones)
```javascript
// timing-bar-bg.png → draw with Graphics:
// Zones left-to-right: MISS(10%) GOOD(20%) GREAT(12%) PERFECT(16%) GREAT(12%) GOOD(20%) MISS(10%)
const W = 960, H = 80;
const zones = [
  { pct: 0.10, color: 0x2A2A3A }, // MISS
  { pct: 0.20, color: 0xB8860B }, // GOOD
  { pct: 0.12, color: 0xFF8C00 }, // GREAT
  { pct: 0.16, color: 0xFFD700 }, // PERFECT
  { pct: 0.12, color: 0xFF8C00 }, // GREAT
  { pct: 0.20, color: 0xB8860B }, // GOOD
  { pct: 0.10, color: 0x2A2A3A }, // MISS
];
let xCursor = barX;
zones.forEach(z => {
  const zW = W * z.pct;
  bar.fillStyle(z.color, 1);
  bar.fillRect(xCursor, barY, zW, H);
  xCursor += zW;
});
// Outer pill border:
bar.lineStyle(2, 0x4A4A6A, 1);
bar.strokeRoundedRect(barX, barY, W, H, 40);
```

---

### Timing Bar Marker
```javascript
// timing-marker.png → Graphics rectangle:
const marker = scene.add.graphics();
marker.fillStyle(0xFFFFFF, 1);
marker.fillRoundedRect(-8, -48, 16, 96, 8);
```

---

### Zone Label Sprites (PERFECT, GREAT, GOOD, MISS)
```javascript
// label-perfect.png etc. → styled Text + Graphics background:
const label = scene.add.text(markerX, barY - 30, 'PERFECT!', {
  fontSize: '28px', fontStyle: 'bold', color: '#FFD700',
  stroke: '#8B6914', strokeThickness: 3
}).setOrigin(0.5, 1).setAlpha(0);

scene.tweens.add({ targets: label, alpha: 1, duration: 80,
  onComplete: () => scene.tweens.add({ targets: label, alpha: 0, delay: 400, duration: 200 })
});
```

---

### Jackpot Meter (all segments)
```javascript
// meter-segment-empty/filled.png → Graphics:
const SEGMENTS = 5;
const segW = 140, segH = 36, segGap = 8;
for (let i = 0; i < SEGMENTS; i++) {
  const filled = i < currentValue;
  meter.fillStyle(filled ? 0xFFD700 : 0x2A2A40, 1);
  meter.lineStyle(1, filled ? 0xFFD700 : 0x3A3A60, 1);
  meter.fillRoundedRect(meterX + i * (segW + segGap), meterY, segW, segH, 8);
  meter.strokeRoundedRect(meterX + i * (segW + segGap), meterY, segW, segH, 8);
}
```

---

### Streak Badge
```javascript
// streak-badge.png → Graphics pill + Text:
const badge = scene.add.graphics();
badge.fillStyle(0x1E1E3A, 1);
badge.lineStyle(1.5, 0x3A3A60, 1);
badge.fillRoundedRect(0, 0, 160, 56, 28);
const streakText = scene.add.text(80, 28, '🔥 ×0', {
  fontSize: '24px', color: '#FFFFFF'
}).setOrigin(0.5);
// On streak active: scene.tweens.addCounter to tint badge orange
```

---

### HUD Bar Background
```javascript
// hud-bar-bg.png → Graphics:
const hudBg = scene.add.graphics();
hudBg.fillStyle(0x0D0D1A, 0.85);
hudBg.fillRect(0, 0, 1080, 100);
// Bottom border line:
hudBg.lineStyle(1, 0x2A2A50, 0.6);
hudBg.lineBetween(0, 100, 1080, 100);
```

---

### Position Badge, Timer Badge
```javascript
// hud-position-badge.png → Graphics pill + Text:
const posBg = scene.add.graphics();
posBg.fillStyle(0x161628, 1);
posBg.lineStyle(1, 0x3A3A60, 1);
posBg.fillRoundedRect(0, 0, 280, 64, 32);

const posText = scene.add.text(140, 32, '1st / 8', {
  fontSize: '26px', fontStyle: 'bold', color: '#F0F0FF'
}).setOrigin(0.5);
```

---

### Results Panel
```javascript
// results-panel.png → Graphics:
const panel = scene.add.graphics();
panel.fillStyle(0x161628, 1);
panel.lineStyle(2, 0x3A3A60, 1);
panel.fillRoundedRect(panelX, panelY, 900, 1200, 24);
panel.strokeRoundedRect(panelX, panelY, 900, 1200, 24);
```

---

### Trophy Icons
```javascript
// trophy-gold/silver/bronze.png → emoji Text (acceptable for MVP):
const trophyMap = { 1: '🥇', 2: '🥈', 3: '🥉' };
const trophy = scene.add.text(cx, cy, trophyMap[position] ?? '', {
  fontSize: '96px'
}).setOrigin(0.5);
// For positions 4+: render numeric badge with Graphics pill
```

---

### Stat Row Icons
```javascript
// icon-coins/cells/streak/jackpot.png → emoji or Unicode Text:
const icons = { coins: '💰', cells: '⬜', streak: '🔥', jackpots: '★' };
// All rendered as scene.add.text() — fully adequate for MVP
```

---

### Reel Slot Frame & Reel Background
```javascript
// slot-frame.png, reel-bg.png → Graphics:
const slotFrame = scene.add.graphics();
slotFrame.lineStyle(3, 0x3A3A60, 1);
slotFrame.fillStyle(0x0D0D18, 1);
slotFrame.fillRoundedRect(slotX, slotY, 1040, 420, 24);
slotFrame.strokeRoundedRect(slotX, slotY, 1040, 420, 24);

// Per reel background:
const reelBg = scene.add.graphics();
reelBg.fillStyle(0x13131F, 1);
reelBg.lineStyle(1, 0x2A2A50, 1);
reelBg.fillRect(reelX, reelY, 168, 380);
```

---

### Reel Stop Flash
```javascript
// reel-stop-flash.png → Graphics alpha tween:
const flash = scene.add.graphics();
flash.fillStyle(0xFFFFFF, 1);
flash.fillRect(reelX, resultRowY, 168, 152);
flash.setAlpha(0);
// On reel stop: tween alpha 0.6 → 0 over 100ms
scene.tweens.add({ targets: flash, alpha: 0.6, duration: 30,
  onComplete: () => scene.tweens.add({ targets: flash, alpha: 0, duration: 80 })
});
```

---

### Number Symbol Background (for reel number cells)
```javascript
// sym-number.png → Graphics:
const numBg = scene.add.graphics();
numBg.fillStyle(0x1E1E3A, 1);
numBg.lineStyle(1, 0x3A3A60, 1);
numBg.fillRoundedRect(0, 0, 152, 140, 10);
// Number text rendered on top by Phaser Text
```

---

### Bot Win Banner
```javascript
// overlay-bot-win.png → Graphics + Text:
const banner = scene.add.graphics();
banner.fillStyle(0x1A0A0A, 0.9);
banner.lineStyle(2, 0xE74C3C, 1);
banner.fillRoundedRect(bannerX, bannerY, 800, 100, 12);

const bannerText = scene.add.text(bannerX + 400, bannerY + 50, `${botName} got BINGO!`, {
  fontSize: '30px', color: '#FF6B6B', fontStyle: 'bold'
}).setOrigin(0.5);
```

---

### Countdown Overlay
```javascript
// overlay-countdown-bg.png → Graphics:
const countdownBg = scene.add.graphics();
countdownBg.fillStyle(0x0D0D1A, 0.7);
countdownBg.fillRect(0, 0, 1080, 1920);
// Countdown numbers rendered as large Phaser Text, tweened scale
```

---

### Loading Bar
```javascript
// loading-bar-bg/fill → Graphics:
const barBg = scene.add.graphics();
barBg.fillStyle(0x1E1E3A, 1);
barBg.lineStyle(1, 0x3A3A60, 1);
barBg.fillRoundedRect(barX, barY, 600, 24, 12);

const barFill = scene.add.graphics();
// Updated in progress callback:
scene.load.on('progress', (value) => {
  barFill.clear();
  barFill.fillStyle(0xFFD700, 1);
  barFill.fillRoundedRect(barX, barY, 600 * value, 24, 12);
});
```

---

### Pressure Phase Screen Edge
```javascript
// No asset needed — pure Graphics + Tween:
const pressureEdge = scene.add.graphics();
pressureEdge.lineStyle(60, 0xE74C3C, 1);
pressureEdge.strokeRect(0, 0, 1080, 1920);
pressureEdge.setAlpha(0);
scene.tweens.add({ targets: pressureEdge, alpha: 0.5, yoyo: true, repeat: -1, duration: 750 });
```

---

### Streak Milestone Banner
```javascript
// streak-milestone-banner.png → Graphics + Text:
const mileBg = scene.add.graphics();
mileBg.fillStyle(0x0D0D1A, 0.85);
mileBg.lineStyle(2, 0xFFD700, 1);
mileBg.fillRoundedRect(mileX, mileY, 700, 100, 50);

const mileText = scene.add.text(mileX + 350, mileY + 50, `STREAK ×${count}!`, {
  fontSize: '36px', fontStyle: 'bold', color: '#FFD700'
}).setOrigin(0.5);
```

---

## MVP Asset Summary

### Graphic Files Required

| # | File | Section in ASSETS.md |
|---|---|---|
| G-01 | `logo-main.png` | §10.1 |
| G-02 | `btn-spin.png` (2 frames) | §6.1 |
| G-03 | `btn-jackpot.png` (2 frames) | §6.2 |
| G-04 | `btn-speed.png` (2 frames) | §6.3 |
| G-05 | `sym-jackpot.png` | §3.4 |
| G-06 | `sym-wild.png` | §3.4 |
| G-07 | `sym-multiplier.png` | §3.4 |
| G-08 | `overlay-bingo.png` | §8.1 |
| G-09 | `confetti-sheet.png` (6 frames) | §9.4 |
| G-10 | `particle-sparkle.png` | §11 |
| G-11 | `particle-spark.png` | §11 |
| G-12 | `reel-result-row.png` | §3.3 |
| G-13 | `popup-jackpot-earned.png` | §8.4 |
| **Total** | **13 files** | |

### Audio Files Required

| # | File pair | Section in ASSETS.md |
|---|---|---|
| A-01 | `sfx-reel-spin.mp3/.ogg` | §13 SFX-01 |
| A-02 | `sfx-reel-stop.mp3/.ogg` | §13 SFX-02 |
| A-03 | `sfx-useful-hit.mp3/.ogg` | §13 SFX-03 |
| A-04 | `sfx-near-hit.mp3/.ogg` | §13 SFX-04 |
| A-05 | `sfx-jackpot-segment.mp3/.ogg` | §13 SFX-05 |
| A-06 | `sfx-jackpot-earned.mp3/.ogg` | §13 SFX-06 |
| A-07 | `sfx-perfect.mp3/.ogg` | §13 SFX-07 |
| A-08 | `sfx-cell-close.mp3/.ogg` | §13 SFX-08 |
| A-09 | `sfx-bingo-win.mp3/.ogg` | §13 SFX-09 |
| A-10 | `sfx-pressure.mp3/.ogg` | §13 SFX-10 |
| **Total** | **20 files (10 sounds × 2 formats)** | |

---

### Full vs MVP Comparison

| Category | ASSETS.md (full) | MVP_ASSETS.md |
|---|---|---|
| Graphic files / frames | ~70 | **13** |
| Audio files (sounds) | 16 (10 req + 6 opt) | **10** |
| Texture atlases needed | 2 | **0** (not enough sprites to warrant one) |
| Designer effort | 3–4 weeks | **3–5 days** |
| Developer time to code replacements | — | **~4 hours** (all deferred items above are boilerplate Graphics) |

---

## Fonts

Same as `ASSETS.md §12` — loaded from CDN, no files to commission.

Load in `PreloadScene`:
```javascript
// index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">

// Then use in Phaser Text:
{ fontFamily: 'Rajdhani', fontSize: '32px', fontStyle: 'bold' }  // card numbers
{ fontFamily: 'Nunito', fontSize: '28px', fontStyle: 'bold' }    // UI labels
```

---

*End of MVP_ASSETS.md*  
*Refer to `ASSETS.md` for full post-MVP asset specifications.*
