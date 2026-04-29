# Mobile Layout & Visual Polish Plan

## Context
User testing on iPhone revealed several visual issues from screenshots:
- Empty jackpot meter segments blend into background and disappear
- JACKPOT label overlaps bingo card bottom edge
- Streak counter (orange "x3" pill) is unrecognizable
- HUD position/time fonts too small on mobile
- Control buttons not evenly distributed across screen width
- Slot machine payline should look like reference image (gold horizontal bars above/below middle row, middle row highlighted)

## Changes

### 1. Fix empty jackpot meter segments (MeterBar.js)
**Problem:** `_drawSegments(0)` uses fill `0x2A2A40` which is nearly invisible against the dark background.
**Fix:** Change unfilled segment fill to `COLOR.BG_LIGHT` (0x1E1E3A) or `0x3A3A5A` for visibility. Keep border as `COLOR.BORDER`.

### 2. Fix JACKPOT label overlapping bingo card (MatchScene.js + BingoCard.js)
**Problem:** Card panel extends to `this.y + cardH + 10`, but meter starts at `cardBottom + 20 = cardY + cardH + 20`. The JACKPOT label at `meterY - 32` lands inside the card panel.
**Fix:** Move meter down by increasing gap: `meterY = cardBottom + 40` (was +20). This gives 30px clearance between card panel bottom and JACKPOT label top.

### 3. Make streak counter recognizable (MeterBar.js)
**Problem:** The orange pill with "x3" has no label. Users don't know what it means.
**Fix:** Add a small "STREAK" label above the streak badge, or replace the fire emoji with "STREAK" text. Simpler approach: change text from `🔥 ×3` to `STREAK x3` with `fontSize: '18px'`, and reduce badge width from 120 to 100px to fit.

### 4. Increase HUD top bar fonts (MatchScene.js)
**Problem:** Position and time text at 26px is too small on mobile.
**Fix:** Increase to `fontSize: '32px'`. Also increase panel height from 64 to 72 and adjust text Y accordingly.

### 5. Evenly distribute control buttons (ControlZone.js + MatchScene.js)
**Problem:** Buttons clustered near center (offsets ±240). User wants them spread across horizontal axis.
**Fix:** Pass scene width to ControlZone and position buttons at:
- JACKPOT: `x - W/2 + 120` (120px from left edge)
- SPIN: center `x`
- SPEED: `x + W/2 - 120` (120px from right edge)
With button sizes 160×80, 280×105, 90×72, this gives ~100px gaps between buttons on 1080px width.

### 6. Redesign slot machine payline like reference (SlotMachine.js)
**Problem:** Current payline is a single thin gold line. Reference shows prominent gold bars above and below the entire middle row, with middle row symbols having darker backgrounds.
**Fix:**
- Replace single `payline` graphics with two horizontal gold bars (top and bottom of middle row)
- Add a `rowHighlight` graphics that fills the middle row area with a subtle gold tint (e.g., `COLOR.GOLD` at alpha 0.15)
- Gold bars: `lineStyle(4, COLOR.GOLD, 1)` spanning full slot width at y positions:
  - Top bar: `this.y + 20 + REEL_H/2 - SYMBOL_H/2 - SYMBOL_GAP/2`
  - Bottom bar: `this.y + 20 + REEL_H/2 + SYMBOL_H/2 + SYMBOL_GAP/2`
- Row highlight: fill rect covering middle row area with gold at low alpha

## Files to modify
- `src/components/MeterBar.js` — segment colors, streak label
- `src/scenes/MatchScene.js` — meterY gap, HUD font sizes
- `src/components/ControlZone.js` — button distribution
- `src/components/SlotMachine.js` — payline redesign
- `src/components/BingoCard.js` — (verify no changes needed, card panel already extended)

## Verification
1. Start dev server, navigate to MatchScene via Chrome DevTools mobile view
2. Check jackpot meter segments are visible when empty (dark but discernible)
3. Verify JACKPOT label has clear space below bingo card
4. Confirm streak badge shows "STREAK xN" text
5. Check HUD fonts are larger and readable
6. Verify buttons are spread across width with even gaps
7. Confirm slot machine shows gold bars above/below middle row with subtle row highlight
