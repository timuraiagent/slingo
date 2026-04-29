# Skill Bingo Slots — MVP Specification

> **Scope**: Playable prototype proving the core loop.  
> **Target**: One complete match from start to finish — fun, juicy, self-explanatory.  
> **Engine**: Phaser 3 (HTML/JS, portrait, mobile-first)  
> **Base resolution**: 1080×2340 (19.5:9, modern phone)  
> **Timeline estimate**: 4–6 weeks solo dev / 2–3 weeks with small team  
> **Document version**: 1.1  
> **Last updated**: 2026-04-28

### Changelog

- **1.1 (2026-04-28)** — Resolved cross-doc contradictions found in expert review: fixed slot dimensions (5×3), unified jackpot meter charge table, removed duplicate bias representation, fixed pity logic threshold, switched to 19.5:9 base resolution, defined wild ball behavior, added bot grace period, opened Open Questions and Glossary sections.
- **1.0** — Initial MVP scope.

---

## What the MVP Must Prove

1. Spinning the slot + timing feels satisfying and reactive.
2. Watching the bingo card fill toward a goal is clear and exciting.
3. The jackpot ball decision feels meaningful.
4. Competing against opponents in real time (even bots) creates tension.
5. A complete match fits in under 5 minutes and ends cleanly.

**If all five are true, the core fun is real. Everything else in FULL.md is expansion.**

---

## MVP Scope: Include / Exclude

| Feature | MVP | Reason |
|---|---|---|
| 5×5 bingo card | ✅ | Core visual |
| 5×3 slot machine (5 columns × 3 rows visible) | ✅ | Core mechanic |
| Linear timing bar | ✅ | Core skill element |
| Bias RNG (smart numbers) | ✅ | Makes timing feel meaningful |
| Standard cell close on match | ✅ | Core loop |
| Near-hit (charges meter) | ✅ | Prevents frustration, teaches pity |
| Jackpot meter + 1 jackpot ball | ✅ | Key tactical decision |
| Streak counter (visual only) | ✅ | Feedback loop |
| Single-line win condition | ✅ | Clear, fast match end |
| 4–8 bot opponents | ✅ | Competitive tension |
| Live leaderboard (position) | ✅ | Competitive feedback |
| Pressure phase visual | ✅ | End-match drama |
| Basic win/lose screen | ✅ | Loop closure |
| Match flow (lobby → match → results) | ✅ | Complete loop |
| Coin rewards | ✅ | Basic reward feel |
| **Dual / multi-card** | ❌ | Later |
| **Color combo balls** | ❌ | Later |
| **Heat meter** | ❌ | Later |
| **Boss mode** | ❌ | Later |
| **Ranked system** | ❌ | Later |
| **Events** | ❌ | Later |
| **Meta-progression / skill tree** | ❌ | Later |
| **Collectibles / rarity** | ❌ | Later |
| **PvP interference** | ❌ | Later |
| **Social / clubs** | ❌ | Later |
| **Boosters** | ❌ Later (one pre-match booster slot possible if trivial) |
| **Audio** | ⚠️ Basic SFX only — spin, close, win |
| **Cosmetics** | ❌ | Later |

---

## 1. Screen Layout

**Base resolution: 1080×2340 (19.5:9)** — matches modern phones (iPhone 14, recent Android). Older 16:9 devices are letterboxed; iPad gets pillarboxing. Layout uses `Phaser.Scale.FIT` with `autoCenter: CENTER_BOTH`.

**Vertical anchoring:** HUD anchored to top safe area; Control Zone anchored to bottom safe area. Card stretches to fill the middle band. Avoid absolute Y constants for the middle zones — derive them from `scene.scale.height` minus HUD/control heights.

**Safe areas:** Reserve 80px top inset (notch/dynamic island) and 60px bottom inset (home indicator) on iOS. Use `viewport-fit=cover` + CSS `env(safe-area-inset-*)` on the canvas wrapper.

```
┌─────────────────────────────┐  ← Top HUD (fixed 120px from safe top)
│  Pos: 2nd / 8   ⏱ 2:34     │
├─────────────────────────────┤
│                             │
│       BINGO CARD (5×5)      │  ← Stretches to fill (≈45% of available height)
│   Numbers, open/closed/hot  │
│                             │
├─────────────────────────────┤
│  JACKPOT ████░░░  STREAK 4  │  ← Meter strip (fixed 80px)
├─────────────────────────────┤
│     [TIMING BAR ----O----]  │  ← Skill zone (fixed 140px)
│   PERFECT  GREAT  GOOD      │
├─────────────────────────────┤
│  ┌──────────────────────┐   │
│  │  [7] [23] [★] [51] [66]  │  ← Slot reels 5×3 (fixed 380px)
│  └──────────────────────┘   │
├─────────────────────────────┤
│  [JACKPOT 🔮]  [ SPIN ]  [ ] │  ← Control zone (fixed 220px from safe bottom)
└─────────────────────────────┘
```

---

## 2. Bingo Card (MVP)

### 2.1 Format
- 5×5 grid, numbers 1–75 (B-I-N-G-O column distribution)
- Center cell: FREE (always closed at start)
- 24 open cells at match start

### 2.2 Cell Visual States

All cell visuals are drawn entirely with Phaser `Graphics` + `Text` — no sprite assets.

| State | How it's drawn |
|---|---|
| Open | `Graphics.fillRoundedRect` `#1E1E3A`, border `#3A3A60`; `Text` number in `#F0F0FF` |
| Closed | `Graphics.fillRoundedRect` `#2ECC71`, border `#1A7A44`; `Text` number in `#FFFFFF`; scale tween 1→1.2→1 |
| FREE center | Closed fill + `Text` "★\nFREE" in gold/white |
| Hot | Open cell + second `Graphics` layer: `strokeRoundedRect` `#FF8C00`, alpha-tweened 0.4→1 loop |
| Near-win highlighted | Open cell + second `Graphics` layer: `strokeRoundedRect` `#FFD700`, alpha-tweened 0.4→1 loop |
| Jackpot selection | Open cell + second `Graphics` layer: `strokeRoundedRect` `#FFD700` dashed-look, scale pulse |

### 2.3 Win Condition (MVP)
- Complete **any single line** (row, column, or diagonal) = BINGO
- First player to complete any line wins

### 2.4 Card Generation
- Random numbers distributed by column range (B=1-15, I=16-30, N=31-45, G=46-60, O=61-75)
- Balanced so each column has exactly 5 unique numbers
- Seeded differently per match so each lobby is fresh

---

## 3. Slot Machine (MVP)

### 3.1 Layout
- 5 visible columns (matching the 5 bingo card columns)
- 3 rows of symbols visible per column
- Middle row = active result row

### 3.2 Symbols (MVP set)

These weights apply to **non-result reels only** (the result reel is locked to the rolled number — see §3.3). On non-result reels, the middle-row symbol is rolled per these weights:

| Symbol | Weight | Effect when landing in middle row of a non-result reel |
|---|---|---|
| Number (display only) | 82% | None — purely visual filler |
| Jackpot ★ | 8% | +30% jackpot meter (stacks across multiple ★ in one spin) |
| Wild 🌟 | 5% | Adds 1 wild ball to inventory (see §3.7) |
| ×2 multiplier | 5% | Sets a `nextSpinMultiplier = 2` flag — next spin's useful-hit jackpot charge is doubled |

### 3.7 Wild Ball Behavior

- Wild ball lives in player inventory (separate from jackpot ball, max 1 wild)
- Indicator: small 🌟 badge appears beside the JACKPOT button when held
- **Use**: player taps the wild badge → card enters wild-selection mode (similar to jackpot selection but limited to ONE column) → player picks a column → next spin guarantees the result reel will be that column AND the rolled number will be a needed number from that column if any are open
- Differs from jackpot ball: wild biases the *next* spin (must still play it) rather than directly closing a cell — preserves the slot animation moment
- If player has no needed cells in the picked column, wild is consumed for nothing (UI warns first: "No open cells in this column — use anyway?")

### 3.3 Spin Sequence
1. Player taps SPIN (timing locks at marker position)
2. Bias system rolls a single primary result number (see §5)
3. The reel matching that number's column is designated the **result reel** (B=0, I=1, N=2, G=3, O=4)
4. All 5 reels begin spinning (staggered start, left to right, 80ms delay each)
5. Reels stop left to right (200ms apart). Non-result reels stop on random display symbols (numbers, jackpot, wild, multiplier — weighted per §3.2)
6. The result reel's middle row lands on the primary result number
7. The result row across all 5 columns is then read for special-symbol side effects (jackpot meter charge, ×2 multiplier, wild)
8. Effect applied to card / meters

### 3.4 Reel Stop Logic
- Exactly one reel per spin is the **result reel** — its middle-row number is THE spin result
- Result reel index = column index of the rolled number (e.g., number 23 → I column → reel 1)
- The other 4 reels show display-only symbols at their middle row; if those symbols include `★`, `🌟`, or `×2`, their side effects still apply (see §3.6)
- Timing quality biases which number is rolled BEFORE the reels stop
- Reels visually "land" on their pre-computed targets — no teleportation

### 3.6 Side-Effect Symbols on Non-Result Reels

When a non-result reel lands on a special symbol in the middle row:

| Symbol | Side effect |
|---|---|
| `★` Jackpot | +30% jackpot meter (cumulative across reels) |
| `🌟` Wild | Spawn 1 wild ball into player inventory (max 1 wild + 1 jackpot at a time) |
| `×2` Multiplier | Next spin's useful-hit jackpot charge ×2 |
| Number (display) | No side effect — purely visual |

Multiple special symbols on a single spin stack (e.g., two ★ on different reels = +60% meter).

### 3.5 Spin Duration
- Normal: 1.5 seconds total (0.3s ramp up + 0.8s spin + 0.4s stop sequence)
- Fast mode: 0.8 seconds — toggled via the speed button in the Control Zone; available from match 1 (no tutorial gate in MVP, since MVP has no tutorial)

---

## 4. Timing Bar (MVP)

### 4.1 Design
- Horizontal bar, full width of screen
- Color zones from left to right: `[MISS | GOOD | GREAT | PERFECT | GREAT | GOOD | MISS]`
- Perfect zone is center 10% of bar
- Marker starts at left edge and moves right at constant speed (3s traversal at Normal)
- Player taps SPIN to lock in timing at current marker position

### 4.2 Zones & Bar Coverage

| Zone | Bar coverage | Effect |
|---|---|---|
| PERFECT | Center 10% | Best bias toward needed numbers, full meter charges, perfect-timing SFX |
| GREAT | 15% each side of PERFECT | High bias, strong meter charges |
| GOOD | 20% each side of GREAT | Moderate bias |
| MISS | Outer 10% each side | Base RNG only (no bias), minimal meter charges |

The exact probability of rolling a needed number per zone is defined in §5 (RNG / Bias System) — this section defines only bar geometry and qualitative effect. Bar percentages sum to 100% (10+20+15+10+15+20+10).

### 4.3 Visual Feedback
- On tap: marker freezes, zone lights up with label ("GREAT!") for 0.5s
- Perfect: brief screen flash + distinct sound
- Miss: subtle grey flash

### 4.4 Auto-Fire
- If player takes no action for 3 seconds, spin fires automatically at current position (wherever the marker happens to be)
- Prevents game stalling in async mode

---

## 5. RNG / Bias System (MVP)

```javascript
// Simplified bias model for MVP
function resolveSpinNumber(player, timingQuality) {
  const neededNumbers = player.card.getOpenCellNumbers();
  const baseRoll = Math.random();

  const biasTable = {
    PERFECT: 0.55,   // 55% chance of needed number
    GREAT:   0.45,
    GOOD:    0.35,
    MISS:    0.25    // base: ~25% chance (25 cells / ~50 remaining numbers)
  };

  // Pity boost — see "Pity logic" below
  const pityBoost = Math.max(0, player.pityCounter - 3) * 0.10;
  const targetBias = Math.min(biasTable[timingQuality] + pityBoost, 0.60);

  if (baseRoll < targetBias && neededNumbers.length > 0) {
    // Return a random number from player's needed set
    return randomFrom(neededNumbers);
  }

  // Otherwise return a random number in range (may still match by luck)
  return randomInRange(1, 75);
}
```

**Pity logic:**
```javascript
// pityCounter increments on every non-useful spin (no cell closed).
// Reset to 0 on any useful hit.
//
// Pity boost = max(0, pityCounter - 3) * 0.10
//   spins 0–3 of a dry streak: no boost (game feels fair)
//   spin 4: +0.10 to bias
//   spin 5: +0.20
//   spin 6: +0.30 (with PERFECT base 0.55, this hits the 0.60 cap)
//
// Final bias = min(biasTable[zone] + pityBoost, 0.60)
```

---

## 6. Jackpot System (MVP)

### 6.1 Jackpot Meter
- Shown as a segmented bar (5 segments, 0–100%)
- Charge values are **per-zone** (timing quality determines the charge directly — not split into base + bonus):

| Event | PERFECT | GREAT | GOOD | MISS |
|---|---|---|---|---|
| Useful hit (cell closed) | +25% | +18% | +12% | +8% |
| Near-hit (number close to needed) | +10% | +7% | +4% | +2% |
| Full miss (no hit, no near) | — | — | — | +3% (pity drip, only after 4+ consecutive non-useful spins) |

- Side-effect symbols (independent of timing):
  - `★` Jackpot symbol on any reel: +30% (stacks if multiple)
  - `×2` Multiplier symbol: doubles the NEXT spin's useful-hit charge
- Charges cap at 100% per ball; overflow rolls into the next ball after meter reset.

### 6.2 Jackpot Ball
- When meter reaches 100%: player receives 1 jackpot ball (sound + animation)
- Meter resets to 0
- Jackpot ball indicator glows in Control Zone
- **Inventory limit**: 1 ball at a time (MVP simplicity)

### 6.3 Using Jackpot Ball
1. Player taps JACKPOT button
2. Card enters selection mode: open cells highlighted with gold glow
3. Player taps any open cell
4. Cell closes (with enhanced animation — larger burst effect)
5. Line check runs
6. Jackpot button returns to "empty" state

### 6.4 Jackpot UX Rules
- Jackpot ball is NEVER used automatically — always player choice
- Player can hold indefinitely (no expiry in MVP)
- If player has ball available, a pulsing indicator on the JACKPOT button draws attention without forcing action

---

## 7. Streak Counter (MVP)

### 7.1 What Counts as a Streak
- Consecutive spins that produce a **useful hit** (closes a cell)
- Near-hits do NOT extend streak but do NOT break it either
- Only fully useless spins (no cell closed, no near-hit) break the streak

### 7.2 Visual
- Small counter "🔥 x4" shown in meter strip
- At streak 3: counter glows orange
- At streak 5+: counter pulses; brief particle burst on each new streak hit
- On streak break: counter resets to 0 with a small "pop" sound

### 7.3 Streak Effect (MVP — simplified)
- Streak 5+: jackpot meter charges +20% for the duration
- Streak 10: one free jackpot charge (meter +50% instantly, once)

---

## 8. Bot Opponents (MVP)

### 8.1 Bot Count
- 7 bots per match (total lobby: 8 players including the player)

### 8.2 Bot Behavior
- Each bot has a skill rating in 0.30–0.55 (mapped roughly to Easy / Medium / Hard tiers)
- Lobby composition: 3 Easy (skill ≈0.30–0.40), 3 Medium (≈0.40–0.50), 1 Hard (≈0.50–0.55) — exact per-bot values in `botProfiles.js`
- Aggregate intent: across many matches, the player should win ≈35–45% (varies with their actual skill)
- Bots simulate spins at a realistic interval (1.1–2.5 seconds per spin, randomized per bot)
- Bots close cells at a rate consistent with their skill rating
- **30-second grace period**: no bot may declare BINGO in the first 30 seconds of a match — gives the player time to orient before pressure begins
- Bots do NOT interact with the player directly in MVP (no PvP effects)
- Bots do NOT use jackpot balls in MVP (their progress is pure number-rolling)

### 8.3 Bot Progress Display
- Each bot has a progress bar in the leaderboard panel
- Progress = percentage of target pattern filled
- Updates every 2 seconds (not real-time per spin — too noisy)

### 8.4 Bot Names
- Random names from a localized name pool (e.g., "Alex", "Taylor", "Player_4892")
- No avatars in MVP — just name + progress bar

---

## 9. Leaderboard & Position (MVP)

### 9.1 Position Display
- Top HUD: "2nd / 8" — updates every 3 seconds
- No persistent leaderboard panel in MVP (adds screen complexity)
- Pressure phase triggers a temporary leaderboard flash (see §10)

### 9.2 Position Calculation
- Based on: number of cells closed + line progress (cells in a near-complete line count extra)
- Tie-break: total cells closed

---

## 10. Pressure Phase (MVP)

**Trigger**: Any player (bot or human) reaches 80% of win condition (4 of 5 cells in a line).

**Effects:**
- Screen edge pulses red/amber (ambient glow, non-intrusive)
- Small popup: "⚡ [PlayerName] is one cell away!" — 2 seconds, then fades
- Timing bar marker speed increases by 20%
- If it's a bot, this creates urgency without confusion

**End**: Pressure phase ends when either (a) that player wins, or (b) they lose their near-win cell to an event (not in MVP — just ends on win).

---

## 11. Match Flow (MVP)

### 11.1 States

```
LOBBY → COUNTDOWN → MATCH_ACTIVE → MATCH_END → RESULTS
```

### 11.2 Lobby (MVP — instant)
- No pre-match lobby screen in MVP
- Game goes directly to match with "Match Starting in 3…" countdown

### 11.3 Match Start
- 3-second countdown overlay
- Card revealed and animated in (cells flip in from blank)
- "GO!" animation plays
- Timing bar activates
- SPIN button becomes active

### 11.4 During Match
- Player spins as described
- Bots progress in background
- Meters update
- Near-win highlights activate when player is 1 cell from a line

### 11.5 Match End — Win
- All cells in a line glow
- "BINGO!" fullscreen announcement (1.5 seconds)
- Confetti particle effect
- Transition to results screen

### 11.6 Match End — Lose
- When a bot wins: "{Bot name} got BINGO!" announcement (0.8 seconds)
- Player's card remains shown with current state
- Transition to results screen

### 11.7 Results Screen
- Final position: "You placed 3rd out of 8"
- Coins earned: based on position
- Cells closed: X / 24
- Best streak: X
- Jackpot balls used: X
- [PLAY AGAIN] button
- [MAIN MENU] button

---

## 12. Economy (MVP — minimal)

No real currency sinks or purchases in MVP. Just reward feedback.

| Position | Coin Reward |
|---|---|
| 1st | 500 |
| 2nd | 350 |
| 3rd | 250 |
| 4th–5th | 150 |
| 6th–8th | 75 |

Coins displayed on results screen. Stored in localStorage. No spend mechanic in MVP.

---

## 13. Audio (MVP — minimal)

All sounds are short, punchy SFX. No music required for MVP (optional ambient loop acceptable).

| Event | Sound |
|---|---|
| Spin start | Reel whir (0.5s) |
| Reel stop | Mechanical thunk |
| Useful hit | Bright chime |
| Near-hit | Soft ping |
| Jackpot meter segment | Rising tone tick |
| Jackpot ball earned | Fanfare sting (1s) |
| Perfect timing | Sharp clean tap |
| Cell close | Pop + sparkle |
| Line complete / BINGO | Victory sting |
| Pressure phase start | Low bass pulse |

Implementation: Phaser `SoundManager`; all SFX as short .mp3 or .ogg, loaded in Preload scene.

---

## 14. Technical Spec (MVP)

### 14.1 Scene List

```
BootScene      — Phaser config, plugin init
PreloadScene   — Load all MVP assets
MenuScene      — Title + PLAY button
MatchScene     — Full game screen (all components below)
ResultsScene   — End screen
```

### 14.2 Component List (within MatchScene)

```
HUDComponent          — position, timer display
BingoCardComponent    — 5x5 grid, cell state management, line check
SlotMachineComponent  — 5 reels, symbol strip, spin animation
TimingBarComponent    — bar render, marker tween, zone detection
MeterBarComponent     — jackpot meter + streak counter
ControlZoneComponent  — SPIN button, JACKPOT button, speed toggle
BotManager            — 7 bot state machines
LeaderboardManager    — position tracking
PressureManager       — pressure phase detection + effects
AudioManager          — SFX wrapper
```

### 14.3 Key Implementation Notes

**Drawing convention — Graphics-first:**
Almost all UI chrome is drawn with `Phaser.GameObjects.Graphics` at scene creation, not loaded as sprites. The only loaded graphic assets are the 13 files listed in §14.4. Everything else (backgrounds, cards, cells, meter bars, HUD badges, overlays, buttons for non-critical paths) is drawn in code using the shared color palette from `constants.js`.

```javascript
// constants.js — shared colors used by all Graphics draw calls
export const COLOR = {
  BG_DARK:    0x0D0D1A,
  BG_MID:     0x161628,
  BG_LIGHT:   0x1E1E3A,
  GOLD:       0xFFD700,
  GOLD_DARK:  0xB8860B,
  GREEN_HIT:  0x2ECC71,
  GREEN_DARK: 0x1A7A44,
  ORANGE_HOT: 0xFF8C00,
  RED_PRESS:  0xE74C3C,
  BLUE:       0x3498DB,
  PURPLE:     0x9B59B6,
  WHITE:      0xFFFFFF,
  GREY:       0x4A4A6A,
  BORDER:     0x3A3A60,
};
```

**Background:**
```javascript
// Any scene background — one Graphics object, drawn once
const bg = scene.add.graphics();
bg.fillGradientStyle(COLOR.BG_DARK, COLOR.BG_DARK, 0x12102A, 0x12102A, 1);
bg.fillRect(0, 0, scene.scale.width, scene.scale.height);
```

**Bingo card:**
- 25 `Container` objects (cells) in manual 5×5 grid layout
- Each cell container: `Graphics` (background, redrawn on state change) + `Text` (number)
- Overlay `Graphics` added per cell for hot/near-win/jackpot states — alpha tweened by Phaser
- Particle emitter (using loaded `particle-sparkle.png`) fires on cell close
- Line flash: thin `Graphics` line drawn along completed cells, alpha tweened 1→0 over 600ms

**Slot reels:**
- Frame and reel backgrounds drawn with `Graphics`
- Each reel is a `Container` with a mask — scrolling strip of symbol items inside
- Symbol items: `Graphics` rounded rect bg + `Text` label for number symbols; loaded sprite for ★/🌟/×2
- Result row highlight: loaded `reel-result-row.png` overlaid at correct y-position
- Tween controls y-scroll; result computed before spin, animation just reveals it

**Timing bar:**
- Drawn once with `Graphics` at scene create — static zone colors, pill border
- Marker: a `Graphics` rounded rect, moved with a looping `Tween` on its x position
- Zone label: a `Text` object shown/hidden with alpha tween at marker position on tap

**Meter bar:**
- 5 `Graphics` rounded rects drawn/redrawn as value changes — no sprite atlas needed
- Streak badge: `Graphics` pill + `Text` — tinted orange when active

**Buttons:**
- SPIN and JACKPOT buttons: loaded sprites (see §14.4) — these are the primary interaction objects
- All other buttons (PLAY AGAIN, MAIN MENU, Cancel, Speed toggle): `Graphics` rounded rect + `Text`
- Disabled state on all buttons: `setAlpha(0.4)` on the container

**Results screen:**
- All panels, borders, and stat rows drawn with `Graphics`
- Trophy: emoji `Text` (`🥇`, `🥈`, `🥉`) — sufficient for MVP
- Stat icons: emoji `Text` (`💰`, `⬜`, `🔥`, `★`)

**RNG:**
- All randomness through a seeded RNG (`seedrandom` or equivalent) — enables Daily Challenge mode later
- Bias function is pure (no side effects) — easy to test

**Bot simulation:**
- Each bot has a `BotProfile` (speed, accuracy) and a `BingoCard` (generated same way as player)
- `BotManager.update()` runs on a timer, advancing each bot independently
- Bots do not spin the slot visually — their progress is purely simulated

**State persistence:**
- Match state stored in a plain JS object, no external DB needed for MVP
- Results and coins stored in `localStorage`

### 14.4 Asset Requirements (MVP)

Only 13 graphic files + 10 audio files need to be commissioned. Everything else is drawn in code.
See `MVP_ASSETS.md` for full specifications of each file.

**Graphic files (13):**

| File | What it's for | Why not code |
|---|---|---|
| `logo-main.png` | Menu screen title | Styled display typography |
| `btn-spin.png` (2 frames) | Primary SPIN button | Most-tapped element; must look intentional |
| `btn-jackpot.png` (2 frames) | JACKPOT button, empty + charged | Key visual signal for ball availability |
| `btn-speed.png` (2 frames) | Speed toggle | Consistent with other button art |
| `sym-jackpot.png` | Jackpot ★ reel symbol | Illustrated, needs to stand apart from numbers |
| `sym-wild.png` | Wild 🌟 reel symbol | Multi-color treatment, can't do with Text |
| `sym-multiplier.png` | ×2 reel symbol | Shaped background, needs visual distinction |
| `overlay-bingo.png` | "BINGO!" win announcement | Stroked display text — emotional peak of the game |
| `confetti-sheet.png` (6 frames) | Win celebration particles | Varied shapes; Phaser emitter only does circles/rects |
| `particle-sparkle.png` | Cell close burst | Organic 4-point star; adds juice to every hit |
| `particle-spark.png` | Jackpot explosion | Elongated spark shape for jackpot feel |
| `reel-result-row.png` | Active row indicator on slot | Gold edge markers + triangles — fiddly to code |
| `popup-jackpot-earned.png` | Jackpot ball earned popup | Pre-designed glow panel for key reward moment |

**Audio files (10 sounds × 2 formats = 20 files):**

| File | Trigger |
|---|---|
| `sfx-reel-spin.mp3/.ogg` | SPIN tapped, reels begin |
| `sfx-reel-stop.mp3/.ogg` | Each reel stops |
| `sfx-useful-hit.mp3/.ogg` | Cell closed |
| `sfx-near-hit.mp3/.ogg` | Near miss with good timing |
| `sfx-jackpot-segment.mp3/.ogg` | Jackpot meter fills one segment |
| `sfx-jackpot-earned.mp3/.ogg` | Jackpot meter reaches 100% |
| `sfx-perfect.mp3/.ogg` | PERFECT zone tap |
| `sfx-cell-close.mp3/.ogg` | Cell close animation starts |
| `sfx-bingo-win.mp3/.ogg` | Player wins |
| `sfx-pressure.mp3/.ogg` | Pressure phase activates |

**Fonts:** loaded from Google Fonts CDN — no files to commission.
```html
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Nunito:wght@400;700&display=swap" rel="stylesheet">
```

### 14.5 Performance Targets (MVP)

| Metric | Target |
|---|---|
| First interactive | < 3s on 4G mid-range Android |
| Match FPS | 60fps on iPhone 11 / Android 2021 equiv. |
| JS bundle | < 2MB (Phaser ~1MB + game logic ~1MB) |
| Asset bundle | < 3MB initial load (13 small graphics + 10 audio files; no atlas needed) |
| Memory usage | < 120MB in match |

---

## 15. MVP Success Criteria

A successful MVP build achieves all of the following. **Quantitative criteria** are measured by logging spin/result data to localStorage during a 50-spin self-test session.

**Functional**
- [ ] Player can complete a full match from launch to results screen
- [ ] Match ends in under 5 minutes (50-spin or single-line-completion limit, whichever first)
- [ ] No softlocks, infinite loops, or unresponsive states across 10 consecutive matches
- [ ] Playable on iOS Safari and Android Chrome without major layout issues

**Skill agency (measurable)**
- [ ] In a 50-spin session, **PERFECT-timed spins produce ≥40% useful-hit rate**, MISS-timed spins produce **≤20% useful-hit rate** (gap proves bias is working)
- [ ] Average bias over the session does not exceed 0.50 (i.e., the game still feels random, not steered)

**Tactical weight (measurable)**
- [ ] Player earns **1–3 jackpot balls per typical match** (over 10 self-test matches, average is in this band)
- [ ] At least 1 in 3 matches features a "should-I-save-it" decision moment (subjective during playtest)

**Tension**
- [ ] Pressure phase fires in ≥80% of matches before they end
- [ ] At least 1 in 4 matches is won by a bot (proves bots are real opponents, not setpieces)

**Polish**
- [ ] Timing bar is responsive (input lag <50ms from tap to marker freeze)
- [ ] Completing a line produces a payoff lasting ≥1.2s (BINGO overlay + confetti + win SFX)
- [ ] Results screen shows correct stats matching the match just played
- [ ] All Graphics-drawn elements render crisply at 1× and 2× pixel ratios (no blurry rects)

**Telemetry rule**: a hidden debug overlay (toggled by `?debug=1` URL param) shows the live useful-hit rate per timing zone — this is how the measurable criteria are verified during dev.

---

## 16. Post-MVP Priority Queue

Once MVP success criteria are met, features should be added in this order (based on core loop impact):

1. **Streak milestones** (rewards at 3/5/10) — deepens engagement with existing mechanic
2. **Near-win cell highlighting** — improves clarity, no new systems
3. **Speed mode (Fast/Turbo)** — quality of life, reduces session drag
4. **Dual card mode** — first major complexity step, tests readability
5. **3 card archetypes** — personality differentiation
6. **Heat meter + hot zones** — second major skill layer
7. **Color combo balls** — introduces combo system
8. **Basic booster (1 pre-match slot)** — introduces economy interaction
9. **Ranked lobby + MMR** — competitive retention hook
10. **Boss mode (1 boss)** — content variety, strongest new feature

---

## 17. Open Questions / Deferred Decisions

These are known unknowns at the spec level. Each must be resolved before or during implementation, but the MVP can ship without locking them down here.

| Topic | Question | Default for MVP | Resolved by |
|---|---|---|---|
| Multiplayer | Real-time vs. async-only opponents? | Bots only (async-equivalent); no real-time multiplayer in MVP | Phase 7 |
| Persistence backend | localStorage forever, or remote sync? | localStorage only — no account, no cloud | Post-MVP "Account v1" |
| Daily challenge | Same seed for all players? | Out of scope for MVP, but RNG is seedable to enable later | Post-MVP |
| Tutorial | First-time player guidance? | None in MVP — design relies on screen layout being self-explanatory | Post-MVP |
| Streak rule | Do near-hits count as half-streak (FULL §14.1) or neither extend nor break (MVP §7.1)? | MVP §7.1 wins for now; FULL.md must be updated to match | Pre-build |
| Player progression | XP / level system? | Out of scope; coins are the only feedback signal | Post-MVP |
| Coin sinks | What can coins buy in MVP? | Nothing — coins display only, never spent | Post-MVP "Account v1" |
| Bot jackpots | Do bots earn/use jackpot balls? | No — pure number-rolling simulation | Post-MVP |
| Error/network handling | What if assets fail to load? | Browser default error overlay (no custom retry UI) | Post-MVP |
| Telemetry | Do we collect any analytics? | Local-only spin/result log to localStorage for tuning; no remote send | Post-MVP |

**How to resolve**: when one of these decisions becomes load-bearing for a piece of work, lock the answer in the relevant spec section AND remove the row from this table. Don't let this list rot.

---

## 18. Glossary

| Term | Definition |
|---|---|
| Useful hit | A spin that closes a cell on the player's card |
| Near-hit | A spin whose number didn't match any open cell, but is within ±5 of one (charges meters partially) |
| Full miss | A spin whose number is neither a useful hit nor a near-hit (breaks streak, accrues pity) |
| Result reel | The single reel whose middle-row number is THE primary spin result (chosen by column of the rolled number) |
| Bias | The probability that the rolled number is one of the player's needed numbers (0.25–0.60 range) |
| Pity | Bias boost that accumulates after consecutive non-useful spins |
| Streak | Count of consecutive useful hits (broken only by full miss) |
| Pressure phase | Audio/visual state activated when any participant is 1 cell from winning |
| Useless / dead spin | Same as full miss; used colloquially in design discussion |

---

*End of MVP.md*
