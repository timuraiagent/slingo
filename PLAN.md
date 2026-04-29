# Skill Bingo Slots — MVP Implementation Plan

> **Goal**: Build a fully playable MVP matching the scope in MVP.md  
> **Stack**: Phaser 3.60+, plain JavaScript (ES modules), Vite dev server  
> **Base resolution**: 1080×2340 (19.5:9)  
> **Estimate**: 4–6 weeks solo / 2–3 weeks with 2 devs  
> **Approach**: Vertical slice — get one full match working end-to-end before polishing anything  
> **Document version**: 1.1  
> **Last updated**: 2026-04-28

### Changelog

- **1.1 (2026-04-28)** — Aligned with MVP.md v1.1: fixed result extraction logic (Phase 4), pity threshold (Phase 4), confetti frame size (Phase 0), POSITION_REWARDS constant (Phase 0). Added MatchScene state machine section, event bus cleanup convention, debug-tap gating between Phase 1 and Phase 5, and Phase 7.5 (match countdown).
- **1.0** — Initial implementation plan.

---

## Guiding Principles

1. **Working game first, polish second.** Every phase ends with something runnable.
2. **No placeholder stubs.** If a system is in the current phase, it must actually work.
3. **Test the fun after Phase 3.** If spinning + timing + card closing isn't fun yet, fix it before adding bots or UI.
4. **One source of truth per system.** No duplicated state between components.
5. **Mobile from day one.** Test on a real device after every phase.

---

## Project Structure

```
slingo/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js                    ← Phaser game config + boot
│   ├── constants.js               ← All magic numbers in one place
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   ├── MenuScene.js
│   │   ├── MatchScene.js
│   │   └── ResultsScene.js
│   ├── components/                ← Visual components, owned by MatchScene
│   │   ├── BingoCard.js
│   │   ├── SlotMachine.js
│   │   ├── TimingBar.js
│   │   ├── MeterBar.js
│   │   └── ControlZone.js
│   ├── managers/                  ← Pure logic, no Phaser dependency
│   │   ├── RNGManager.js
│   │   ├── BingoCardManager.js
│   │   ├── TimingManager.js
│   │   ├── MeterManager.js
│   │   ├── StreakManager.js
│   │   ├── JackpotManager.js
│   │   ├── BotManager.js
│   │   ├── LeaderboardManager.js
│   │   └── PressureManager.js
│   ├── data/
│   │   ├── cardLayouts.js         ← Card generation logic
│   │   ├── symbolDefinitions.js   ← Reel symbol configs
│   │   └── botProfiles.js         ← Bot difficulty configs
│   └── utils/
│       ├── seededRandom.js        ← Reproducible RNG
│       ├── eventBus.js            ← Simple event emitter
│       └── storage.js             ← localStorage wrapper
├── assets/
│   ├── images/                    ← Only 13 files total (see MVP_ASSETS.md)
│   │   ├── logo-main.png
│   │   ├── btn-spin.png           ← 2-frame horizontal strip
│   │   ├── btn-jackpot.png        ← 2-frame horizontal strip
│   │   ├── btn-speed.png          ← 2-frame horizontal strip
│   │   ├── sym-jackpot.png
│   │   ├── sym-wild.png
│   │   ├── sym-multiplier.png
│   │   ├── overlay-bingo.png
│   │   ├── confetti-sheet.png     ← 6-frame horizontal strip
│   │   ├── particle-sparkle.png
│   │   ├── particle-spark.png
│   │   ├── reel-result-row.png
│   │   └── popup-jackpot-earned.png
│   └── audio/
│       ├── reel-spin.mp3
│       ├── reel-stop.mp3
│       ├── useful-hit.mp3
│       ├── near-hit.mp3
│       ├── jackpot-segment.mp3
│       ├── jackpot-earned.mp3
│       ├── perfect-timing.mp3
│       ├── cell-close.mp3
│       ├── bingo-win.mp3
│       └── pressure-start.mp3
│   (All other visuals are drawn with Phaser Graphics — see Drawing Conventions below)
```

---

## Drawing Conventions

**Rule**: If an element can be drawn with `Phaser.GameObjects.Graphics` + `Text` in under 30 lines, draw it — don't load a sprite. Only load the 13 files in `assets/images/`.

### Shared helper — `drawRoundedPanel(graphics, x, y, w, h, fillColor, borderColor)`

Add this utility to `src/utils/draw.js` and use it everywhere:

```javascript
// src/utils/draw.js
export function drawPanel(gfx, x, y, w, h, radius = 16,
                          fill = 0x161628, border = 0x3A3A60) {
  gfx.fillStyle(fill, 1);
  gfx.lineStyle(2, border, 1);
  gfx.fillRoundedRect(x, y, w, h, radius);
  gfx.strokeRoundedRect(x, y, w, h, radius);
}

export function drawBackground(scene) {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x0D0D1A, 0x0D0D1A, 0x12102A, 0x12102A, 1);
  g.fillRect(0, 0, scene.scale.width, scene.scale.height);
  return g;
}

export function makeTextButton(scene, x, y, w, h, label, style = {}) {
  // A reusable Graphics + Text button for non-critical buttons (PLAY AGAIN, Cancel, etc.)
  const g = scene.add.graphics();
  drawPanel(g, -w / 2, -h / 2, w, h, 20, 0x1E2A3A, 0x3498DB);
  const t = scene.add.text(0, 0, label, {
    fontFamily: 'Nunito', fontSize: '32px', fontStyle: 'bold',
    color: '#F0F0FF', ...style
  }).setOrigin(0.5);
  const container = scene.add.container(x, y, [g, t]);
  container.setSize(w, h);
  container.setInteractive();
  return container;
}
```

### Color constants — `src/constants.js`

```javascript
export const COLOR = {
  BG_DARK:    0x0D0D1A,  BG_MID:     0x161628,  BG_LIGHT:   0x1E1E3A,
  GOLD:       0xFFD700,  GOLD_DARK:  0xB8860B,
  GREEN_HIT:  0x2ECC71,  GREEN_DARK: 0x1A7A44,
  ORANGE_HOT: 0xFF8C00,  RED_PRESS:  0xE74C3C,
  BLUE:       0x3498DB,  PURPLE:     0x9B59B6,
  WHITE:      0xFFFFFF,  GREY:       0x4A4A6A,
  BORDER:     0x3A3A60,
};

export const FONT = {
  NUMBER:  { fontFamily: 'Rajdhani', fontStyle: 'bold' },
  UI:      { fontFamily: 'Nunito',   fontStyle: 'bold' },
  LABEL:   { fontFamily: 'Nunito' },
};
```

---

## MatchScene State Machine

`MatchScene` has multiple states that gate input and drive UI. Without an explicit machine, edge cases collide (e.g., timing bar firing during jackpot selection, pressure phase activating mid-BINGO animation). Implement as a simple enum + transition table.

### States

```
IDLE              — pre-spin; SPIN button enabled; timing bar paused at left
COUNTDOWN         — pre-match 3-2-1 overlay; all input blocked
SPINNING          — timing bar locked, reels animating; SPIN/JACKPOT disabled
RESOLVING         — slot:complete fired; closing cell, updating meters; ~300ms
JACKPOT_SELECTING — player chose to use jackpot; card in selection mode; SPIN disabled
PRESSURE          — overlay state on top of IDLE/SPINNING; visuals only, doesn't gate input
MATCH_END         — winner declared; all input blocked; running win/lose animation
RESULTS_PENDING   — animation done; waiting for transition to ResultsScene
```

### Allowed transitions

```
COUNTDOWN  → IDLE
IDLE       → SPINNING            (player taps SPIN)
IDLE       → JACKPOT_SELECTING   (player taps JACKPOT, has ball)
SPINNING   → RESOLVING           (slot:complete)
RESOLVING  → IDLE                (no win)
RESOLVING  → MATCH_END           (player won OR bot won during resolve)
JACKPOT_SELECTING → RESOLVING    (player picked a cell)
JACKPOT_SELECTING → IDLE         (player tapped cancel)
IDLE       → MATCH_END           (bot won via background simulation)
SPINNING   → MATCH_END           (bot won during player's spin animation; defer transition until RESOLVING completes — see below)
MATCH_END  → RESULTS_PENDING     (animation completes)
RESULTS_PENDING → (scene change)
```

`PRESSURE` is **not** in this enum — it's a parallel boolean (`this.pressureActive`) that affects timing bar speed and visuals but does not gate input.

### Implementation rules

- All input handlers check `if (this.state !== EXPECTED) return;`
- A bot win that fires during `SPINNING` or `JACKPOT_SELECTING` queues until the current resolve completes; do NOT cut off a mid-flight player action — bad feel.
- `setState(next)` is a single method that logs the transition (helps debugging) and validates against the table.
- Scene shutdown must transition to a terminal `DESTROYED` state and refuse all further transitions.

### File

`src/managers/MatchStateMachine.js` — tiny class wrapping the enum + transition table + `setState()`. Used by `MatchScene`.

---

## Phases Overview

| Phase | Name | Deliverable | Est. Time |
|---|---|---|---|
| 0 | Setup | Project boots, blank screen | 1 day |
| 1 | Bingo Card | Card renders, cells close manually | 2 days |
| 2 | Slot Machine | Reels spin and stop with a result | 2–3 days |
| 3 | Timing Bar | Bar active during spin, zone detected | 2 days |
| 4 | Connect: Spin → Card | Full spin-to-mark loop working | 2 days |
| 5 | Jackpot System | Meter fills, ball earned, player places it | 2 days |
| 6 | Streak & Meters | Streak counter, meter visual | 1 day |
| 7 | Bots & Leaderboard | 7 bots simulate progress, position shown | 2 days |
| 7.5 | Match Countdown | 3-2-1 pre-match overlay | 0.5 day |
| 8 | Win/Lose & Results | Match ends, results screen | 1–2 days |
| 9 | Pressure Phase | Near-win detection, pressure effects | 1 day |
| 10 | Audio | SFX wired to all events | 1 day |
| 11 | Polish & Mobile QA | Animations, feel tuning, device testing | 3–5 days |

---

## Phase 0 — Project Setup

**Goal**: `npm run dev` opens a black screen with "Slingo" in white text. Game config is correct.

### Tasks

- [ ] `npm init` + install `phaser`, `vite`
- [ ] Create `index.html` with canvas mount point
- [ ] Create `vite.config.js` (port 3000, mobile-friendly HTTPS for device testing)
- [ ] Create `src/main.js` with Phaser game config:
  - WebGL renderer, Canvas fallback
  - `width: 1080, height: 2340` (base resolution — 19.5:9 modern phone aspect)
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
  - `resolution: window.devicePixelRatio` (crisp Graphics on 2× displays)
  - Scene list: `[BootScene, PreloadScene, MenuScene, MatchScene, ResultsScene]`
- [ ] Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to `index.html`
- [ ] Wrap canvas in a div with CSS padding using `env(safe-area-inset-top/bottom)` so the canvas respects iOS notch / home indicator
- [ ] Create `BootScene.js` — just starts PreloadScene
- [ ] Create `PreloadScene.js` — loads all 13 image assets + 10 audio pairs; shows a Graphics-drawn loading bar:
  ```javascript
  // PreloadScene.js
  preload() {
    // Graphics loading bar (no sprite needed)
    const barBg = this.add.graphics();
    barBg.fillStyle(0x1E1E3A, 1); barBg.lineStyle(1, 0x3A3A60, 1);
    barBg.fillRoundedRect(240, 940, 600, 24, 12);
    const barFill = this.add.graphics();
    this.load.on('progress', v => {
      barFill.clear();
      barFill.fillStyle(0xFFD700, 1);
      barFill.fillRoundedRect(240, 940, 600 * v, 24, 12);
    });

    // 13 image assets
    this.load.image('logo', 'assets/images/logo-main.png');
    this.load.spritesheet('btn-spin',     'assets/images/btn-spin.png',     { frameWidth: 320, frameHeight: 120 });
    this.load.spritesheet('btn-jackpot',  'assets/images/btn-jackpot.png',  { frameWidth: 220, frameHeight: 100 });
    this.load.spritesheet('btn-speed',    'assets/images/btn-speed.png',    { frameWidth: 100, frameHeight: 80  });
    this.load.image('sym-jackpot',    'assets/images/sym-jackpot.png');
    this.load.image('sym-wild',       'assets/images/sym-wild.png');
    this.load.image('sym-multiplier', 'assets/images/sym-multiplier.png');
    this.load.image('overlay-bingo',  'assets/images/overlay-bingo.png');
    this.load.spritesheet('confetti', 'assets/images/confetti-sheet.png',   { frameWidth: 64, frameHeight: 64 });
    this.load.image('particle-sparkle', 'assets/images/particle-sparkle.png');
    this.load.image('particle-spark',   'assets/images/particle-spark.png');
    this.load.image('reel-result-row',  'assets/images/reel-result-row.png');
    this.load.image('popup-jackpot',    'assets/images/popup-jackpot-earned.png');

    // 10 audio pairs (mp3 + ogg)
    ['reel-spin','reel-stop','useful-hit','near-hit','jackpot-segment',
     'jackpot-earned','perfect-timing','cell-close','bingo-win','pressure-start']
      .forEach(k => this.load.audio(k, [`assets/audio/${k}.mp3`, `assets/audio/${k}.ogg`]));
  }
  ```
- [ ] Create `MenuScene.js` — background via `drawBackground()`, logo sprite centered, PLAY button via `makeTextButton()` → starts MatchScene
- [ ] Create `constants.js` — define layout constants. **Bottom-anchored Y values are derived from `scene.scale.height` at scene creation, not hardcoded**, so the layout adapts when FIT scaling pads the canvas:
  ```javascript
  // Base resolution
  export const BASE_W = 1080;
  export const BASE_H = 2340;

  // Safe-area insets (in base pixels)
  export const SAFE_TOP = 80;
  export const SAFE_BOTTOM = 60;

  // Top-anchored: count from y = SAFE_TOP downward
  export const HUD_HEIGHT = 120;
  export const CARD_TOP = SAFE_TOP + HUD_HEIGHT + 40;

  // Card geometry
  export const CARD_SIZE = 5;
  export const CELL_SIZE = 180;
  export const CELL_GAP = 14;

  // Bottom-anchored: derive at scene create:
  //   const controlY = scene.scale.height - SAFE_BOTTOM - CONTROL_HEIGHT;
  //   const slotY    = controlY - SLOT_HEIGHT - 24;
  //   const timingY  = slotY    - TIMING_HEIGHT - 24;
  //   const meterY   = timingY  - METER_HEIGHT - 16;
  export const CONTROL_HEIGHT = 220;
  export const SLOT_HEIGHT    = 380;
  export const TIMING_HEIGHT  = 140;
  export const METER_HEIGHT   = 80;

  // Position-based coin rewards (results screen)
  export const POSITION_REWARDS = {
    1: 500, 2: 350, 3: 250,
    4: 150, 5: 150,
    6: 75,  7: 75,  8: 75,
  };
  ```
- [ ] Create `eventBus.js` — tiny emitter used across managers:
  ```javascript
  import Phaser from 'phaser';
  export const bus = new Phaser.Events.EventEmitter();
  ```

### Event bus cleanup convention (CRITICAL)

The `bus` is a **singleton across scenes**. Every component or manager that subscribes via `bus.on(...)` MUST own a `destroy()` method that removes its listeners. Without this, listeners stack up across matches and old AudioManager / MeterBar instances keep responding to events from new ones — a textbook cause of audio doubling, ghost UI updates, and memory leaks.

**Pattern** (use everywhere):
```javascript
export class FooManager {
  constructor() {
    this._handlers = [];
    this._on('meter:jackpot:earned', this.onEarned, this);
  }
  _on(event, fn, ctx) {
    bus.on(event, fn, ctx);
    this._handlers.push([event, fn, ctx]);
  }
  destroy() {
    this._handlers.forEach(([e, fn, ctx]) => bus.off(e, fn, ctx));
    this._handlers = [];
  }
}
```

**MatchScene rule**: in `MatchScene.shutdown()`, call `destroy()` on every manager and component it owns. Verify in Phase 11 §11.5 (memory leak test) that 5 consecutive matches don't increase listener counts on `bus`.

**Checkpoint**: `npm run dev` shows a black screen with "Slingo" and a PLAY button. Clicking it transitions to a blank MatchScene.

---

## Phase 1 — Bingo Card

**Goal**: A 5×5 bingo card renders with real numbers. Clicking a cell closes it. Line detection works.

### 1.1 Card Generation Logic (`src/data/cardLayouts.js`)

```javascript
// Column ranges per classic B-I-N-G-O
const COLUMN_RANGES = [
  [1, 15],   // B
  [16, 30],  // I
  [31, 45],  // N
  [46, 60],  // G
  [61, 75],  // O
];

export function generateCard(rng) {
  // Returns a 5x5 array of numbers
  // Column c: pick 5 unique random numbers from COLUMN_RANGES[c]
  // Center cell [2][2] = 0 (FREE)
}
```

- [ ] Implement `generateCard(rng)` — returns `number[][]` (5×5)
- [ ] Write unit test (in console or simple assert) — no duplicate numbers, correct column ranges, center = 0

### 1.2 BingoCardManager (`src/managers/BingoCardManager.js`)

State only — no Phaser here.

```javascript
export class BingoCardManager {
  constructor(grid) {
    this.grid = grid;         // number[][]
    this.closed = new Set();  // Set of "col,row" strings
    this.closed.add('2,2');   // FREE center
  }
  
  canClose(number) { ... }    // is this number on the card and open?
  closeNumber(number) { ... } // mark cell, return {col, row} or null
  closeCell(col, row) { ... } // for jackpot use
  getCompletedLines() { ... } // returns array of completed Line objects
  getProgressByLine() { ... } // returns {line, closedCount} for each of 12 lines
  getNearWinLines() { ... }   // lines with 4 of 5 closed
  isWon() { ... }             // any line with 5 closed
}
```

- [ ] Implement all methods
- [ ] `getCompletedLines()` must check all 12 lines (5 rows + 5 cols + 2 diagonals)
- [ ] `getNearWinLines()` returns lines with exactly 4 cells closed

### 1.3 BingoCard Component (`src/components/BingoCard.js`)

Visual layer only — reads from `BingoCardManager`, emits UI events. All drawing done with `Graphics` + `Text`.

- [ ] Constructor takes `scene`, `x`, `y`, `cardManager`
- [ ] Draw card panel background once on create:
  ```javascript
  const panel = scene.add.graphics();
  drawPanel(panel, x - 10, y - 10, CARD_W + 20, CARD_H + 20, 20, COLOR.BG_MID, COLOR.BORDER);
  ```
- [ ] Draw column headers (B I N G O) as styled `Text` objects above each column
- [ ] Create 25 cell objects using `_makeCell(col, row, number)`:
  ```javascript
  _makeCell(col, row, number) {
    const cx = this.x + col * (CELL_SIZE + CELL_GAP);
    const cy = this.y + row * (CELL_SIZE + CELL_GAP);
    const bg = this.scene.add.graphics();
    // Open state
    bg.fillStyle(COLOR.BG_LIGHT, 1);
    bg.lineStyle(1.5, COLOR.BORDER, 1);
    bg.fillRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);
    bg.strokeRoundedRect(0, 0, CELL_SIZE, CELL_SIZE, 12);

    const label = this.scene.add.text(CELL_SIZE / 2, CELL_SIZE / 2,
      number === 0 ? '★\nFREE' : String(number),
      { ...FONT.NUMBER, fontSize: '30px', color: '#F0F0FF', align: 'center' }
    ).setOrigin(0.5);

    // Overlay Graphics for state effects (hot, near-win, jackpot selection)
    const overlay = this.scene.add.graphics();

    const container = this.scene.add.container(cx, cy, [bg, label, overlay]);
    container.setSize(CELL_SIZE, CELL_SIZE);
    return { container, bg, label, overlay, col, row, number };
  }
  ```
- [ ] `_redrawCell(cell, state)` — clears and redraws `bg` based on state (`OPEN` / `CLOSED` / `FREE`):
  - OPEN: `COLOR.BG_LIGHT` fill, `COLOR.BORDER` border, `#F0F0FF` text
  - CLOSED: `COLOR.GREEN_HIT` fill, `COLOR.GREEN_DARK` border, `#FFFFFF` text
- [ ] `closeCell(col, row, isJackpot)`:
  - Redraw bg to CLOSED style
  - Scale tween on container: 1 → 1.2 → 1 over 200ms
  - Spawn `particle-sparkle.png` emitter at cell center (8 particles, tint green or gold if jackpot)
- [ ] `setOverlay(col, row, type)` — draws on the cell's `overlay` Graphics:
  - `'hot'`: `strokeRoundedRect` `COLOR.ORANGE_HOT`, alpha tween 0.4→1 loop
  - `'nearwin'`: `strokeRoundedRect` `COLOR.GOLD`, alpha tween 0.4→1 loop
  - `'jackpot'`: `strokeRoundedRect` `COLOR.GOLD` thicker, scale pulse on container
  - `null`: `overlay.clear()`, stop tweens
- [ ] `flashLineComplete(line)`: draw a `Graphics` line through all 5 cell centers, alpha tween 1→0, 600ms
- [ ] Add to MatchScene, wire to cardManager
- [ ] **Debug-only tap handler** (Phase 1 verification only):
  ```javascript
  if (DEBUG_FLAGS.cellTap) {
    cell.container.on('pointerdown', () => this.closeCell(cell.col, cell.row, false));
  }
  ```
  Add `DEBUG_FLAGS.cellTap = true` to `constants.js` for now. **This must flip to `false` in Phase 5** when jackpot selection mode owns cell-tap input — leaving it on in production lets players close cells by tapping, which breaks the entire game.

**Checkpoint**: Card renders with correct numbers. Clicking cells closes them with animation (debug only). Line complete triggers a line flash. All 12 line directions work correctly.

---

## Phase 2 — Slot Machine

**Goal**: 5 reels spin when triggered, stop one-by-one, and a result symbol is readable from the result row.

### 2.1 Symbol Definitions (`src/data/symbolDefinitions.js`)

```javascript
export const SYMBOLS = [
  { id: 'number',     weight: 82, label: null },   // label = actual number, assigned at spin time
  { id: 'jackpot',    weight: 8,  label: '★' },
  { id: 'wild',       weight: 5,  label: '🌟' },
  { id: 'multiplier', weight: 5,  label: '×2' },
];
```

- [ ] Define symbol list with weights
- [ ] `rollSymbolType(rng)` — weighted random selection of symbol id

### 2.2 SlotMachine Component (`src/components/SlotMachine.js`)

All slot chrome is drawn with `Graphics`. Special symbols use loaded sprites.

- [ ] Draw outer slot frame once on create:
  ```javascript
  const frame = scene.add.graphics();
  frame.fillStyle(COLOR.BG_DARK, 1);
  frame.lineStyle(3, COLOR.BORDER, 1);
  frame.fillRoundedRect(slotX, slotY, SLOT_W, SLOT_H, 24);
  frame.strokeRoundedRect(slotX, slotY, SLOT_W, SLOT_H, 24);
  ```
- [ ] Draw per-reel background (5×):
  ```javascript
  const reelBg = scene.add.graphics();
  reelBg.fillStyle(0x13131F, 1);
  reelBg.lineStyle(1, 0x2A2A50, 1);
  reelBg.fillRect(reelX, reelY, REEL_W, REEL_H);
  ```
- [ ] Add `reel-result-row` image overlaid at result-row y-position (the only loaded graphic here)
- [ ] Each reel is a masked `Container` with a scrolling strip:
  - `_makeSymbol(symbolDef, number)` — returns a `Container`:
    - For `'number'`: `Graphics` rounded rect bg (`COLOR.BG_LIGHT`, `COLOR.BORDER`) + `Text` number
    - For `'jackpot'`: `scene.add.image(0, 0, 'sym-jackpot')` (loaded sprite)
    - For `'wild'`: `scene.add.image(0, 0, 'sym-wild')` (loaded sprite)
    - For `'multiplier'`: `scene.add.image(0, 0, 'sym-multiplier')` (loaded sprite)
  - Strip = 16 symbols; result symbol placed at correct position before spin starts
- [ ] `spin(results)`:
  - Starts all reels scrolling simultaneously (fast y-scroll tween)
  - Stops reels left-to-right, 200ms apart
  - Each stop: tween slows over 400ms, overshoots by 8px, settles back (bounce feel)
  - Fires `bus.emit('reel:stopped', { reelIndex, symbol })` per reel
  - Fires `bus.emit('slot:complete', { results })` when all 5 stop
- [ ] On each reel stop: briefly flash a white `Graphics` rect at result row (`alpha: 0.5 → 0`, 100ms)

### 2.3 Integration test

- [ ] MatchScene: add a "TEST SPIN" button that calls `slotMachine.spin([...5 random results...])`
- [ ] Verify each reel stops in sequence, result symbol is in middle row

**Checkpoint**: Pressing TEST SPIN triggers all 5 reels. They spin, decelerate, and stop cleanly left to right. The middle row shows the expected symbol on each reel.

---

## Phase 3 — Timing Bar

**Goal**: Timing bar runs during a spin. Player tap locks in a zone. Zone name and quality are returned.

### 3.1 TimingManager (`src/managers/TimingManager.js`)

Pure logic — no Phaser.

```javascript
export class TimingManager {
  // Zone boundaries (as fraction 0.0–1.0 of bar width)
  // MISS: 0.0–0.10, GOOD: 0.10–0.30, GREAT: 0.30–0.42, PERFECT: 0.42–0.58
  //                                                               (center)
  // Mirror on right side: GREAT: 0.58–0.70, GOOD: 0.70–0.90, MISS: 0.90–1.0

  getZone(position) { ... }         // position 0.0–1.0 → 'PERFECT'|'GREAT'|'GOOD'|'MISS'
  getBiasMultiplier(zone) { ... }   // zone → number (see MVP.md §4.2)
}
```

### 3.2 TimingBar Component (`src/components/TimingBar.js`)

Entirely drawn with `Graphics` + `Text` — no image assets.

- [ ] Draw bar zones once on create (static, never redrawn):
  ```javascript
  // Zone widths as fractions of BAR_W (960px)
  // MISS 10% | GOOD 20% | GREAT 12% | PERFECT 16% | GREAT 12% | GOOD 20% | MISS 10%
  const zones = [
    { pct: 0.10, color: COLOR.GREY },
    { pct: 0.20, color: COLOR.GOLD_DARK },
    { pct: 0.12, color: COLOR.ORANGE_HOT },
    { pct: 0.16, color: COLOR.GOLD },      // PERFECT — center
    { pct: 0.12, color: COLOR.ORANGE_HOT },
    { pct: 0.20, color: COLOR.GOLD_DARK },
    { pct: 0.10, color: COLOR.GREY },
  ];
  let xCursor = BAR_X;
  const barGfx = scene.add.graphics();
  zones.forEach(z => {
    const zW = BAR_W * z.pct;
    barGfx.fillStyle(z.color, 1);
    barGfx.fillRect(xCursor, BAR_Y, zW, BAR_H);
    xCursor += zW;
  });
  // Pill border over the top
  barGfx.lineStyle(2, COLOR.BORDER, 1);
  barGfx.strokeRoundedRect(BAR_X, BAR_Y, BAR_W, BAR_H, 40);
  ```
- [ ] Marker: a `Graphics` rounded rect (16×96px, `COLOR.WHITE`), positioned and moved via tween:
  ```javascript
  this.marker = scene.add.graphics();
  this.marker.fillStyle(COLOR.WHITE, 1);
  this.marker.fillRoundedRect(-8, -48, 16, 96, 8);
  ```
  - Tween: `{ targets: this.marker, x: BAR_X + BAR_W, duration: 3000, ease: 'Linear', repeat: -1 }`
  - `activate()` — starts tween, resets marker x to `BAR_X`
  - `lock()` — pauses tween, returns `{ position: (marker.x - BAR_X) / BAR_W, zone, bias }`
  - `reset()` — stops tween, marker x returns to `BAR_X`
- [ ] Zone label: a single `Text` object, repositioned and shown/hidden on each lock:
  ```javascript
  const LABELS = { PERFECT: ['PERFECT!', '#FFD700'], GREAT: ['GREAT', '#FF8C00'],
                   GOOD: ['GOOD', '#B8860B'],         MISS: ['MISS', '#4A4A6A'] };
  // On lock: set text + color, position above marker, alpha tween 1→0 over 500ms
  ```

### 3.3 Fast Mode

- [ ] Speed toggle button in ControlZone
- [ ] When fast mode active: marker tween duration = 1500ms (instead of 3000ms)
- [ ] Store `speedMode` state in MatchScene, pass to TimingBar on activate

**Checkpoint**: Timing bar runs. Tapping SPIN at different positions shows correct zone labels. PERFECT is clearly distinguishable and only in the center ~10% of the bar. Fast mode visibly speeds the marker up.

---

## Phase 4 — Connect: Spin → Card

**Goal**: Full loop — tap SPIN → timing bar runs → reel spins → result determined by bias → card updates.

### 4.1 RNGManager (`src/managers/RNGManager.js`)

```javascript
import { SeededRandom } from '../utils/seededRandom.js';

export class RNGManager {
  constructor(seed) {
    this.rng = new SeededRandom(seed);
    this.pityCounter = 0;
  }

  getSpinNumber(cardManager, timingZone) {
    const neededNumbers = cardManager.getOpenNumbers();
    const base = this.rng.next(); // 0.0–1.0

    // Bias table from MVP.md §5
    const biasTable = { PERFECT: 0.55, GREAT: 0.45, GOOD: 0.35, MISS: 0.25 };
    // Pity ramp: no boost for first 3 dry spins; from spin 4 onward, +10% per extra dry spin.
    const pityBoost = Math.max(0, this.pityCounter - 3) * 0.10;
    const targetBias = Math.min(biasTable[timingZone] + pityBoost, 0.60);

    if (base < targetBias && neededNumbers.length > 0) {
      return this.rng.pickFrom(neededNumbers);
    }
    return this.rng.intBetween(1, 75);
  }

  recordUsefulHit()  { this.pityCounter = 0; }
  recordMiss()       { this.pityCounter++; }
}
```

- [ ] Implement `SeededRandom` in `src/utils/seededRandom.js` (mulberry32 algorithm is sufficient)
- [ ] Implement `RNGManager` with `getSpinNumber()`, pity tracking
- [ ] `BingoCardManager.getOpenNumbers()` — returns flat array of all open cell numbers

### 4.2 Spin → Result Flow in MatchScene

Wire everything together:

```
Player taps SPIN
  → TimingBar.lock() → { zone, bias }
  → RNGManager.getSpinNumber(cardManager, zone) → number
  → SlotMachine.spin(buildResults(number))    ← reels animate
  → On slot:complete event:
      → BingoCardManager.closeNumber(number)
      → If hit: BingoCard.closeCell(col, row) + MeterManager.onUsefulHit()
      → If miss: MeterManager.onMiss()
      → Check win: BingoCardManager.isWon() → trigger match end
  → TimingBar.reset()
  → SPIN button re-enabled
```

- [ ] `buildResults(primaryNumber)`: constructs the 5-reel result array per MVP §3.3–§3.4:
  - Determine `resultReelIndex` from the column range of `primaryNumber` (1–15→0, 16–30→1, 31–45→2, 46–60→3, 61–75→4)
  - Reel `resultReelIndex`: middle-row symbol = `{ id: 'number', label: primaryNumber }`
  - Other 4 reels: middle-row symbol picked via weighted `rollSymbolType(rng)` (per `symbolDefinitions.js`); if `'number'`, label is a random display number from that reel's column range
  - Returns `Array<{ id, label }>` of length 5, indexed by reel
- [ ] After `slot:complete`, MatchScene resolves side effects from non-result reels (per MVP §3.6):
  - For each non-result reel symbol: jackpot symbol → `meterManager.onJackpotSymbol()`; wild → spawn wild ball; multiplier → set `nextSpinMultiplier = 2` flag
- [ ] SPIN button disabled during reel animation, re-enabled on `slot:complete`
- [ ] Near-hit detection: if `closeNumber(primaryNumber)` returns null, check if `primaryNumber` is "close" (within ±5 of any needed number) for near-hit visual feedback
- [ ] Near-hit visual: brief cell border flash on the closest open cell

**Checkpoint**: Full spin loop works. Tap SPIN → bar runs → reel spins → matching number closes the correct cell. Try 20 spins — verify bias is clearly working (PERFECT timing produces more hits than MISS-zone taps). Win condition fires correctly.

---

## Phase 5 — Jackpot System

**Goal**: Jackpot meter fills across spins. At 100%, player earns a ball and can place it on any cell.

### 5.1 MeterManager (`src/managers/MeterManager.js`)

```javascript
export class MeterManager {
  constructor() {
    this.jackpotValue = 0;   // 0–100
    this.jackpotBalls = 0;   // inventory
  }

  onUsefulHit(timingZone) {
    const charge = { PERFECT: 25, GREAT: 18, GOOD: 12, MISS: 8 }[timingZone];
    this.addJackpot(charge);
  }

  onNearHit(timingZone) {
    const charge = { PERFECT: 10, GREAT: 7, GOOD: 4, MISS: 2 }[timingZone];
    this.addJackpot(charge);
  }

  onMiss() {
    this.addJackpot(3); // pity drip
  }

  onJackpotSymbol() {
    this.addJackpot(30);
  }

  addJackpot(amount) {
    this.jackpotValue = Math.min(100, this.jackpotValue + amount);
    bus.emit('meter:jackpot:updated', this.jackpotValue);
    if (this.jackpotValue >= 100) {
      this.jackpotValue = 0;
      this.jackpotBalls++;
      bus.emit('meter:jackpot:earned');
    }
  }

  useJackpotBall() {
    if (this.jackpotBalls > 0) {
      this.jackpotBalls--;
      bus.emit('meter:jackpot:used');
      return true;
    }
    return false;
  }
}
```

### 5.2 MeterBar Component (`src/components/MeterBar.js`)

Entirely drawn with `Graphics` + `Text` — no image assets.

- [ ] Jackpot meter — 5 `Graphics` objects (one per segment), redrawn on value change:
  ```javascript
  _drawSegments(filledCount) {
    this.segments.forEach((gfx, i) => {
      gfx.clear();
      const filled = i < filledCount;
      gfx.fillStyle(filled ? COLOR.GOLD : COLOR.GREY, 1);
      gfx.lineStyle(1, filled ? COLOR.GOLD : COLOR.BORDER, 1);
      gfx.fillRoundedRect(0, 0, SEG_W, SEG_H, 8);
      gfx.strokeRoundedRect(0, 0, SEG_W, SEG_H, 8);
    });
  }
  ```
  - On `meter:jackpot:updated`: call `_drawSegments(Math.floor(value / 20))`
  - On `meter:jackpot:earned`: tween all segments to alpha 0→1 three times (flash), then `_drawSegments(0)`
- [ ] "JACKPOT" label: `Text` object above segments — `COLOR.GOLD`, small Nunito font
- [ ] Jackpot ball count badge: `Graphics` pill + `Text` — shown beside JACKPOT button when `jackpotBalls > 0`
  - On earn: scale tween 0→1.2→1 on the badge container
- [ ] Streak badge: `Graphics` pill (`COLOR.BG_LIGHT`, `COLOR.BORDER`) + `Text` "🔥 ×0":
  - On `streak:updated`: update text label
  - At streak ≥ 3: tint pill graphics to `COLOR.ORANGE_HOT` with `setTint()`
  - At streak 0: clear tint

### 5.3 Jackpot Ball Placement Flow in MatchScene

```
Player taps JACKPOT button (only enabled when jackpotBalls > 0)
  → BingoCard enters "selection mode"
      → All open cells get gold highlight + scale pulse
      → SPIN button disabled
      → Cancel button appears
  → Player taps any highlighted cell
      → BingoCard.closeCell(col, row) with enhanced animation (bigger burst)
      → MeterManager.useJackpotBall()
      → BingoCardManager.closeCell(col, row)
      → Line check → win condition check
      → Exit selection mode
  → Or player taps Cancel → exit selection mode without using ball
```

- [ ] JACKPOT button: uses loaded `btn-jackpot.png` spritesheet — switch to frame 0 (empty) or frame 1 (charged) via `setFrame()`
- [ ] Selection mode: add a semi-transparent `Graphics` rect over the entire card (`COLOR.BG_DARK` at 50% alpha), then call `setOverlay(col, row, 'jackpot')` on each open cell to make them glow through it
- [ ] Cancel button: drawn with `makeTextButton()` — no sprite needed
- [ ] Jackpot close animation: same as normal close but scale tween goes 1→1.4→1, particle tint is gold (`COLOR.GOLD`), uses `particle-spark.png` emitter instead of sparkle

- [ ] **Disable Phase 1 debug tap handler.** Set `DEBUG_FLAGS.cellTap = false` in `constants.js` and confirm cells respond ONLY to (a) spin-driven closes and (b) jackpot selection mode taps. A stray production tap-to-close trivializes the game.

**Checkpoint**: Play through until jackpot earned. Tap jackpot button. Card cells highlight. Tap a cell — it closes with enhanced animation. Verify the ball is consumed. Verify win triggers if it was the last needed cell. Verify tapping a cell when not in jackpot mode does nothing.

---

## Phase 6 — Streak & Meters Polish

**Goal**: Streak counter visible and reactive. Milestone reward fires at streak 5 and 10.

### 6.1 StreakManager (`src/managers/StreakManager.js`)

```javascript
export class StreakManager {
  constructor(meterManager) {
    this.current = 0;
    this.best = 0;
    this.meterManager = meterManager;
  }

  onUsefulHit() {
    this.current++;
    this.best = Math.max(this.best, this.current);
    bus.emit('streak:updated', this.current);
    this.checkMilestone();
  }

  onMiss() {
    // Near-hits don't break streak — only full misses do
  }

  onFullMiss() {
    if (this.current > 0) {
      bus.emit('streak:broken', this.current);
      this.current = 0;
      bus.emit('streak:updated', 0);
    }
  }

  checkMilestone() {
    if (this.current === 5) {
      this.meterManager.addJackpot(20); // bonus charge
      bus.emit('streak:milestone', 5);
    }
    if (this.current === 10) {
      this.meterManager.addJackpot(50);
      bus.emit('streak:milestone', 10);
    }
  }
}
```

- [ ] Determine "full miss" vs "near-hit miss" in spin resolution:
  - If the rolled number doesn't match ANY open cell AND timing was MISS zone → full miss
  - If timing was GOOD+ but number just wasn't on card → near-hit (partial credit)
- [ ] Wire to MeterBar component: streak counter text updates on `streak:updated`
- [ ] Streak milestone visual: brief flash + "STREAK x5!" overlay text (1s, then fades)
- [ ] Streak break visual: counter resets with a small "pop" + grey flash

**Checkpoint**: Play 15+ spins. Streak counter increments on useful hits, resets on full misses. At streak 5 and 10, the milestone fires and jackpot meter visibly jumps.

---

## Phase 7 — Bots & Leaderboard

**Goal**: 7 bots simulate progress independently. Player position is shown and updates realistically.

### 7.1 Bot Profiles (`src/data/botProfiles.js`)

```javascript
export const BOT_PROFILES = [
  { name: 'Alex',   skill: 0.30, spinInterval: [1800, 2500] }, // easy
  { name: 'Jordan', skill: 0.35, spinInterval: [1600, 2200] },
  { name: 'Sam',    skill: 0.40, spinInterval: [1500, 2000] },
  { name: 'Riley',  skill: 0.42, spinInterval: [1400, 1900] }, // medium
  { name: 'Casey',  skill: 0.45, spinInterval: [1300, 1800] },
  { name: 'Morgan', skill: 0.48, spinInterval: [1200, 1700] },
  { name: 'Drew',   skill: 0.55, spinInterval: [1100, 1600] }, // hard
];
```

### 7.2 BotManager (`src/managers/BotManager.js`)

Each bot has its own `BingoCardManager` instance (same generation logic, different seed).

```javascript
export class BotManager {
  constructor(scene, rngSeed) { ... }

  start() {
    // For each bot: set a random interval timer using scene.time.addEvent
    // On each tick: simulate one spin
  }

  simulateSpin(bot) {
    // Roll a number with bot.skill as the bias (same RNG logic, simplified)
    const number = simpleRoll(bot.skill, bot.cardManager.getOpenNumbers());
    const hit = bot.cardManager.closeNumber(number);
    if (bot.cardManager.isWon()) {
      bus.emit('bot:won', bot);
    }
    bus.emit('leaderboard:update');
  }

  getStandings() {
    // Returns array of {name, closedCount, lineProgress} for all bots
  }
}
```

- [ ] Each bot gets a unique card (different RNG seed per bot)
- [ ] Bot timers fire independently (no synchronization)
- [ ] Bots never win in the first 30 seconds (grace period for player to orient)
- [ ] `getStandings()` includes the player as one entry

### 7.3 LeaderboardManager (`src/managers/LeaderboardManager.js`)

```javascript
export class LeaderboardManager {
  constructor(playerCardManager, botManager) { ... }

  getPosition() {
    // Returns player's rank (1-indexed) among all 8 participants
    // Ranking metric: cells closed + (0.5 * cells in best near-win line)
  }

  getAllSorted() {
    // Returns array of {name, score} sorted by rank
  }
}
```

### 7.4 HUD Display

All HUD chrome is drawn with `Graphics` — no sprites.

- [ ] Draw HUD bar background once on create:
  ```javascript
  const hudBar = scene.add.graphics();
  hudBar.fillStyle(COLOR.BG_DARK, 0.85);
  hudBar.fillRect(0, 0, scene.scale.width, SAFE_TOP + HUD_HEIGHT);
  hudBar.lineStyle(1, 0x2A2A50, 0.6);
  hudBar.lineBetween(0, SAFE_TOP + HUD_HEIGHT, scene.scale.width, SAFE_TOP + HUD_HEIGHT);
  ```
- [ ] Position badge: `Graphics` pill + `Text` "2nd / 8" — drawn with `drawPanel()`, top-left of HUD
- [ ] Timer badge: `Graphics` pill + `Text` "2:34" — top-right of HUD
- [ ] Both update every 3 seconds via `scene.time.addEvent` — only `setText()` called, no redraw
- [ ] Position change: brief `scaleX/scaleY` tween on the Text when rank changes

**Checkpoint**: Run a match. 7 bots progress at different speeds. Player position in HUD updates. One of the bots wins before the player occasionally. Bot victory fires the match-end flow.

---

## Phase 7.5 — Match Countdown

**Goal**: 3-second pre-match countdown overlay before SPIN becomes active (per MVP.md §11.2/§11.3).

- [ ] On `MatchScene.create()`: state machine starts in `COUNTDOWN`
- [ ] Add a full-screen `Graphics` overlay (`COLOR.BG_DARK` at 70% alpha) with a centered `Text` that ticks "3" → "2" → "1" → "GO!" at 1-second intervals (use `scene.time.addEvent` with `repeat: 3`)
- [ ] Each tick: scale tween 1.4 → 1.0 on the digit; fade-out the previous text
- [ ] After "GO!" displays for 400ms, fade overlay out (200ms) and call `stateMachine.setState('IDLE')`
- [ ] Card cells animate in from blank during the countdown (cells flip in column-by-column, 60ms stagger) so the first thing the player sees as the overlay clears is a fully populated card
- [ ] No SFX yet (or a low-key tick on each digit if budget allows; not in the 10-SFX list)

**Checkpoint**: Match boots → 3-2-1-GO countdown plays → card visible → SPIN enabled. Tapping during countdown does nothing.

---

## Phase 8 — Win / Lose & Results Screen

**Goal**: Match ends correctly for both win and lose cases. Results screen shows meaningful stats.

### 8.1 Match End Logic (MatchScene)

```javascript
endMatch(winner) {
  this.matchActive = false;
  this.timingBar.deactivate();
  this.controlZone.disableAll();
  
  if (winner === 'player') {
    this.showBingoAnimation(() => {
      this.scene.start('ResultsScene', { ...this.buildResults() });
    });
  } else {
    // Bot won
    this.showBotWinNotice(winner.name, () => {
      this.scene.start('ResultsScene', { ...this.buildResults() });
    });
  }
}

buildResults() {
  return {
    position: this.leaderboard.getPosition(),
    totalPlayers: 8,
    cellsClosed: this.cardManager.getClosedCount(),
    bestStreak: this.streakManager.best,
    jackpotsUsed: this.jackpotUsedCount,
    coinsEarned: POSITION_REWARDS[this.leaderboard.getPosition()],
  };
}
```

- [ ] BINGO win animation:
  - Flash all winning line cells: `setOverlay(col, row, 'nearwin')` → rapid alpha flicker on all 5
  - Dark vignette: `Graphics` full-screen rect `COLOR.BG_DARK` at 60% alpha, tweened 0→0.6
  - "BINGO!" overlay: `scene.add.image(540, 960, 'overlay-bingo')` — scale tween 0.3→1.1→1.0 over 400ms with `Phaser.Math.Easing.Back.Out`
  - Confetti burst: `ParticleEmitter` using `confetti` spritesheet, random frame, random tint from palette, physics gravity, 150 particles fired from top of screen
  - Hold 1.5s then transition
- [ ] Bot win announcement: `Graphics` pill banner (`COLOR.BG_DARK` 90% + `COLOR.RED_PRESS` border) + `Text` "[Name] got BINGO!" — slides in from top, holds 1.5s, fades out
- [ ] Match end prevents any further input (SPIN disabled, jackpot disabled)

### 8.2 ResultsScene (`src/scenes/ResultsScene.js`)

All panels and chrome drawn with `Graphics`. No image assets used in this scene.

Layout:
```
┌─────────────────────────────┐
│      YOU PLACED             │
│       🥈 2nd / 8            │
│                             │
│   💰 Coins earned:  350     │
│   ⬜ Cells closed:  18/24   │
│   🔥 Best streak:   7       │
│   ★  Jackpots used: 2       │
│                             │
│        [ PLAY AGAIN ]       │
│        [ MAIN MENU  ]       │
└─────────────────────────────┘
```

- [ ] Background: `drawBackground(scene)` from `draw.js`
- [ ] Main panel: `drawPanel(gfx, 90, 300, 900, 1300, 24)` — dark rounded rect
- [ ] "YOU PLACED" heading: `Text` with `FONT.UI`, bold, `#F0F0FF`
- [ ] Position display: emoji `Text` (`🥇` / `🥈` / `🥉` based on position, 96px) + `Text` "2nd / 8" below it
  - For positions 4–8: no emoji, just large position `Text`
- [ ] Stat rows: each row is a `Text` with emoji prefix and stat value — sequential alpha tween (0→1, 0.1s stagger):
  ```javascript
  const rows = [
    ['💰', 'Coins earned',  data.coinsEarned],
    ['⬜', 'Cells closed',  `${data.cellsClosed} / 24`],
    ['🔥', 'Best streak',   data.bestStreak],
    ['★',  'Jackpots used', data.jackpotsUsed],
  ];
  ```
- [ ] Coins value: `scene.tweens.addCounter` from 0 → value over 800ms, `setText` each step
- [ ] PLAY AGAIN + MAIN MENU: both built with `makeTextButton()` from `draw.js`
- [ ] Save coins to `localStorage` via `storage.js`

**Checkpoint**: Win a match → BINGO animation plays → ResultsScene shows with correct stats. Lose a match → bot win notice → ResultsScene shows. Both buttons work correctly.

---

## Phase 9 — Pressure Phase

**Goal**: When any player (bot or human) is 1 cell from winning, pressure phase activates.

### 9.1 PressureManager (`src/managers/PressureManager.js`)

```javascript
export class PressureManager {
  constructor(cardManager, botManager) { ... }

  checkPressure() {
    // Called after every spin (player or bot)
    const playerNearWin = cardManager.getNearWinLines().length > 0;
    const botNearWin = botManager.hasAnyBotNearWin();  // any bot with 4-in-a-line

    const newState = playerNearWin || botNearWin;
    if (newState !== this.active) {
      this.active = newState;
      bus.emit(newState ? 'pressure:start' : 'pressure:end', {
        source: playerNearWin ? 'player' : 'bot'
      });
    }
  }
}
```

### 9.2 Pressure Phase Visual Effects

On `pressure:start`:
- [ ] Ambient screen edge pulse: red-orange glow on screen border, 1.5s period loop
  - Implemented as a `Graphics` overlay (full screen rectangle with thick border, alpha tweened)
- [ ] Small popup banner: "⚡ [Name] is one cell away!" — 2 seconds, then auto-dismiss
- [ ] Timing bar marker speed: increase by 20% (update tween duration)
- [ ] Play `pressure-start` SFX once

On `pressure:end`:
- [ ] Remove screen edge pulse
- [ ] Reset timing bar speed

- [ ] `BotManager.hasAnyBotNearWin()` — checks all bot card managers for any line with 4 closed cells
- [ ] Wire `PressureManager.checkPressure()` call into both player spin resolution and bot spin simulation

**Checkpoint**: Play until either you or a bot has 4 cells in a line. Screen edge pulses. Banner appears. Timing bar visibly speeds up. When the line is completed (win) or broken, pressure ends.

---

## Phase 10 — Audio

**Goal**: All 10 SFX wired to their corresponding game events.

### 10.1 AudioManager (`src/managers/AudioManager.js`)

```javascript
export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
  }

  preload() { /* handled in PreloadScene */ }

  init() {
    const keys = [
      'reel-spin', 'reel-stop', 'useful-hit', 'near-hit',
      'jackpot-segment', 'jackpot-earned', 'perfect-timing',
      'cell-close', 'bingo-win', 'pressure-start'
    ];
    keys.forEach(k => {
      this.sounds[k] = this.scene.sound.add(k, { volume: 0.7 });
    });
    this.wireEvents();
  }

  wireEvents() {
    bus.on('slot:spinning',         () => this.play('reel-spin'));
    bus.on('reel:stopped',          () => this.play('reel-stop'));
    bus.on('card:useful-hit',       () => this.play('useful-hit'));
    bus.on('card:near-hit',         () => this.play('near-hit'));
    bus.on('meter:jackpot:updated', () => this.play('jackpot-segment'));
    bus.on('meter:jackpot:earned',  () => this.play('jackpot-earned'));
    bus.on('timing:perfect',        () => this.play('perfect-timing'));
    bus.on('card:cell-closed',      () => this.play('cell-close'));
    bus.on('match:bingo',           () => this.play('bingo-win'));
    bus.on('pressure:start',        () => this.play('pressure-start'));
  }

  play(key) {
    this.sounds[key]?.play();
  }
}
```

- [ ] Audio loading is already in `PreloadScene.js` (wired in Phase 0) — confirm all 10 keys match the `AudioManager.wireEvents()` key list
- [ ] Ensure all event bus emissions are in place (audit each manager for missing emissions)
- [ ] Test on mobile: iOS requires a user gesture before audio can play — SPIN button tap satisfies this
- [ ] Add master volume setting (stored in localStorage) — simple slider on MenuScene

**Checkpoint**: All 10 sounds play at the right moments. No double-plays or missing events. Audio works on iOS Safari after first tap.

---

## Phase 11 — Polish & Mobile QA

**Goal**: The game feels good, reads clearly on a real phone, and has no blocking bugs.

### 11.1 Animation Pass

- [ ] Cell close: review timing, scale, and particle count — should feel "pop-y" not sluggish
- [ ] Reel stop: ensure the settle/bounce feels physical (overshoot by 5% then snap back)
- [ ] Jackpot meter fill: each segment fills with a satisfying left-to-right sweep
- [ ] Jackpot earned: current implementation sufficient? Add brief screen vignette if needed
- [ ] Line complete: ray effect along the completed line — bright, clear, not too long (600ms max)
- [ ] BINGO screen: large text scale-in with bounce easing; confetti must be visible
- [ ] Pressure phase: pulse must not obscure the card or timing bar

### 11.2 Feel Tuning — Timing Bar

- [ ] Play 30+ spins and record timing quality vs result usefulness
- [ ] Verify PERFECT zone is achievable but not trivially easy
- [ ] If bias feels invisible: increase PERFECT multiplier to 0.65 (softcap stays at 0.60 overall but targeting is more aggressive)
- [ ] If bias feels too strong: reduce PERFECT to 0.50
- [ ] Consider: does the bar speed feel right? Too slow = boring wait; too fast = unplayable

### 11.3 Feel Tuning — Jackpot Meter

- [ ] In a typical 20-spin match: player should earn 1–2 jackpot balls on average
- [ ] Verify: does the player feel meaningful tension about when to use the ball?
- [ ] If earning too rarely: bump useful-hit charge from 10% to 15%
- [ ] If earning too often: reduce pity drip from 3% to 1%

### 11.4 Mobile Layout QA

Test on at minimum: iPhone SE (375px wide), iPhone 14 Pro (393px), Android mid-range (360px).

- [ ] Card numbers readable without zooming (min 18pt)
- [ ] SPIN button easily tappable with thumb (min 80×80pt)
- [ ] Timing bar tap target height: min 60pt
- [ ] No content clipped by notch / dynamic island / rounded corners (use Phaser safe area)
- [ ] Landscape orientation: block it with a "Please rotate" overlay
- [ ] Touch events: use `pointer.down` not `pointer.up` for SPIN (faster feel)

### 11.5 Performance QA

- [ ] Run Chrome DevTools performance trace in match
- [ ] Confirm 60fps sustained; no frame drops above 16ms during reel spin
- [ ] Check memory: no leaks between matches (scene destruction test — play 5 matches in a row)
- [ ] Asset sizes: total initial load should be < 3MB (13 small graphics + 10 audio files)
- [ ] `Graphics` objects: verify no `Graphics` objects are being redrawn every frame (should only redraw on state change). Profile with DevTools — `fillRect` calls outside of `create()` should only occur on game events, never in `update()`
- [ ] Pixel ratio: verify all `Graphics`-drawn elements look crisp on a 2× display (no blurry rects). Phaser handles this automatically with `resolution: window.devicePixelRatio` in game config — confirm it's set

### 11.6 Bug Sweep

Critical paths to test manually:

- [ ] Play 10 complete matches (win some, lose some)
- [ ] Use jackpot ball on the last needed cell — verify win triggers
- [ ] Reach streak 10 — verify milestone fires
- [ ] Let a bot win — verify no further input is accepted; results screen is correct
- [ ] Play with fast mode on the entire match — no timing or visual bugs
- [ ] Start match, immediately try to use jackpot ball when none available — button is correctly disabled
- [ ] Let auto-fire trigger (don't tap SPIN for 3+ seconds) — verify correct behavior

---

## Event Bus Reference

All cross-component communication goes through `eventBus.js`. This is the complete list for MVP:

| Event | Emitter | Payload | Listeners |
|---|---|---|---|
| `slot:spinning` | SlotMachine | — | AudioManager |
| `reel:stopped` | SlotMachine | `{reelIndex, symbol}` | AudioManager |
| `slot:complete` | SlotMachine | `{results[]}` | MatchScene |
| `timing:zone` | TimingBar | `{zone, position}` | MatchScene |
| `timing:perfect` | TimingBar | — | AudioManager |
| `card:useful-hit` | MatchScene | `{col, row, number}` | AudioManager, StreakManager |
| `card:near-hit` | MatchScene | `{number}` | AudioManager, MeterManager |
| `card:full-miss` | MatchScene | `{number}` | StreakManager, MeterManager |
| `card:cell-closed` | BingoCard | `{col, row}` | AudioManager |
| `card:line-complete` | BingoCard | `{line}` | MatchScene |
| `meter:jackpot:updated` | MeterManager | `{value: 0–100}` | MeterBar, AudioManager |
| `meter:jackpot:earned` | MeterManager | — | MeterBar, MatchScene, AudioManager |
| `meter:jackpot:used` | MeterManager | — | MeterBar |
| `streak:updated` | StreakManager | `{count}` | MeterBar |
| `streak:broken` | StreakManager | `{count}` | MeterBar |
| `streak:milestone` | StreakManager | `{level: 5\|10}` | MatchScene (overlay) |
| `leaderboard:update` | BotManager | — | LeaderboardManager, HUD |
| `pressure:start` | PressureManager | `{source: 'player'\|'bot'}` | MatchScene |
| `pressure:end` | PressureManager | — | MatchScene |
| `bot:won` | BotManager | `{bot}` | MatchScene |
| `match:bingo` | MatchScene | — | AudioManager |

---

## Definition of Done (MVP)

The MVP is complete when all of the following are true:

- [ ] A full match plays from PLAY button to Results screen with no manual intervention
- [ ] PERFECT timing produces noticeably more useful hits than MISS timing over a 20-spin session
- [ ] Jackpot meter fills naturally; player earns 1–2 balls per average match
- [ ] Streak counter works; milestones at 5 and 10 fire correctly
- [ ] 7 bots simulate progress; one occasionally wins before the player
- [ ] Pressure phase activates when any participant has 4 cells in a line
- [ ] Win path (player wins): BINGO animation → Results screen → correct stats
- [ ] Lose path (bot wins): bot win notice → Results screen → correct position
- [ ] All 10 SFX play at correct moments; no audio on iOS before first tap
- [ ] Layout correct on iPhone SE, iPhone 14, and one Android mid-range device
- [ ] No crashes or softlocks across 10 consecutive matches
- [ ] Total initial asset load < 3MB; match runs at 60fps on iPhone 11
- [ ] All `Graphics`-drawn elements are crisp at 2× pixel ratio — no blurry rectangles or borders

---

## Post-MVP Backlog (ordered)

Once Definition of Done is met, the next features in priority order:

1. Streak milestone overlays (visual polish for existing system)
2. Near-win cell highlighting (1-cell-from-win pulse on card)
3. Fast/Turbo speed toggle (already in plan, ensure it's exposed in UI)
4. Dual card mode (second card, same spin applies to both)
5. 3 card archetypes with visual differentiation
6. Heat meter + hot zones (second skill layer)
7. Color combo balls (introduces combo system)
8. Basic booster slot (1 pre-match booster)
9. Ranked lobby + MMR matchmaking
10. Boss mode (1 boss type)

---

*End of PLAN.md*
