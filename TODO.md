# MVP Gap Analysis — TODO

> Generated 2026-04-29 by comparing implementation against MVP.md v1.1.
> Ordered by severity: critical bugs first, then missing features, then polish/spec compliance.

---

## Critical Bugs (break the playable loop)

### 1. Bot skill values and spin intervals are wrong
**File:** `src/data/botProfiles.js`  
**Spec §8.2:** skill 0.30–0.55, spin interval 1.1–2.5 seconds per bot.  
**Actual:** skill 0.06–0.16, spin interval 4–11 seconds.  
Bots are 5× too slow and 3–5× too inaccurate. Player wins every match by a wide margin, killing competitive tension.

**Fix:**
```js
// botProfiles.js — replace with spec-correct values
// Lobby: 3 Easy (0.30–0.40), 3 Medium (0.40–0.50), 1 Hard (0.50–0.55)
// Spin intervals: 1100–2500 ms
{ name: 'Alex',   skill: 0.32, spinInterval: [1400, 2500] }, // Easy
{ name: 'Jordan', skill: 0.35, spinInterval: [1300, 2400] }, // Easy
{ name: 'Sam',    skill: 0.38, spinInterval: [1200, 2200] }, // Easy
{ name: 'Riley',  skill: 0.42, spinInterval: [1100, 2000] }, // Medium
{ name: 'Casey',  skill: 0.45, spinInterval: [1100, 1900] }, // Medium
{ name: 'Morgan', skill: 0.48, spinInterval: [1100, 1800] }, // Medium
{ name: 'Drew',   skill: 0.52, spinInterval: [1100, 1600] }, // Hard
```

---

### 2. PreloadScene skips MenuScene
**File:** `src/scenes/PreloadScene.js:49`  
**Spec §14.1:** flow is Boot → Preload → **Menu** → Match.  
**Actual:** `create()` calls `this.scene.start('MatchScene')` — MenuScene is never shown.

**Fix:** Change line 49 to `this.scene.start('MenuScene');`

---

### 3. ResultsScene "MAIN MENU" navigates to MatchScene instead of MenuScene
**File:** `src/scenes/ResultsScene.js:157`  
**Spec §11.7:** MAIN MENU button should return to the menu screen.  
**Actual:** Both "PLAY AGAIN" and "MAIN MENU" call `this.scene.start('MatchScene')`.

**Fix:** Change the MAIN MENU handler to `this.scene.start('MenuScene');`

---

## Missing Features (specified in MVP, not implemented)

### 4. Bot progress bars not rendered
**Spec §8.3:** "Each bot has a progress bar in the leaderboard panel. Progress = % of target pattern filled. Updates every 2 seconds."  
`LeaderboardManager.getStandings()` computes standings correctly but nothing renders them.

**Fix:** Add a `LeaderboardPanel` component (or inline in MatchScene) that renders 7 bot name + progress bar rows, subscribes to `leaderboard:update` bus events, and redraws every 2 seconds. Place it between the HUD and bingo card or in a collapsible side strip.

---

### 5. Near-hits do not increment pity counter
**File:** `src/scenes/MatchScene.js:517-533`, `src/managers/RNGManager.js`  
**Spec §5:** "pityCounter increments on every non-useful spin (no cell closed)." A near-hit doesn't close a cell, so it must increment pity.  
**Actual:** Near-hit branch calls neither `recordMiss()` nor `recordUsefulHit()` — pity is frozen during near-hit streaks.

**Fix:** In the near-hit branch of `_onSlotComplete()` (after the near-hit animation), add:
```js
this.rngManager.recordMiss(); // near-hit: no cell closed → pity grows
```

---

### 6. Fast mode does not change slot spin duration
**File:** `src/components/SlotMachine.js:229-265`  
**Spec §3.5:** Normal spin 1.5 s, fast mode 0.8 s.  
**Actual:** Speed toggle only speeds up the timing bar marker; the slot animation always runs at the same duration (~0.8–1.6 s per reel staggered).

**Fix:** Pass `fastMode` flag into `SlotMachine.spin()`. Scale the tween durations:
```js
spin(results, fastMode = false) {
  const baseDur = fastMode ? 240 : 800; // scale all durations proportionally
  const stopBounce = fastMode ? 60 : 120;
  // ...
}
```
`MatchScene._onSpin()` and `_onAutoSpin()` already know `controlZone.fastMode`; pass it to `slotMachine.spin()`.

---

### 7. Jackpot ball earned popup not shown
**File:** `src/managers/AudioManager.js`, `src/scenes/MatchScene.js:583-585`  
**Spec §6.2:** "player receives 1 jackpot ball (sound + animation)" — the loaded asset `popup-jackpot` (G13.png) is never displayed.  
**Actual:** `_onJackpotEarned()` only calls `controlZone.setJackpotHasBall(true)`.

**Fix:** In `_onJackpotEarned()`, show the `popup-jackpot` image centered on screen, scale-punch in, then fade out after 1.2 s:
```js
_onJackpotEarned() {
  this.controlZone.setJackpotHasBall(true);
  const L = this.L;
  const img = this.add.image(L.cx, L.H * 0.45, 'popup-jackpot')
    .setScale(0).setDepth(35);
  this.tweens.add({
    targets: img, scaleX: L.sf, scaleY: L.sf, duration: 400, ease: 'Back.easeOut',
    onComplete: () => this.tweens.add({ targets: img, alpha: 0, duration: 300, delay: 700,
      onComplete: () => img.destroy() }),
  });
}
```

---

### 8. Wild ball: no "no open cells" warning before consuming
**File:** `src/scenes/MatchScene.js:1032-1039`  
**Spec §3.7:** "If player has no needed cells in the picked column, wild is consumed for nothing (UI warns first: 'No open cells in this column — use anyway?')"  
**Actual:** Wild is silently consumed with no confirmation prompt.

**Fix:** When `openInCol.length === 0`, show a `makeTextButton`-based confirm dialog ("No open cells in this column — use anyway? YES / CANCEL") before consuming.

---

## Spec Compliance Fixes (wrong values / wrong behavior)

### 9. Pressure phase doubles timing bar speed instead of +20%
**File:** `src/scenes/MatchScene.js:779`  
**Spec §10:** "Timing bar marker speed increases by 20%."  
**Actual:** `this.timingBar.setSpeed(true)` triggers fast mode, which halves `baseDuration` (2× speed = +100%).

**Fix:** Add a dedicated pressure multiplier to `TimingBar`:
```js
// TimingBar — add pressureMode flag, apply 1.2× speed on top of base/fast
setPressureMode(active) {
  this._pressureMode = active;
  // recalculate _elapsed to preserve current position
}
// In update(): duration = (this._fastMode ? base/2 : base) / (this._pressureMode ? 1.2 : 1)
```
In `_onPressureStart()`, call `this.timingBar.setPressureMode(true)` instead of `setSpeed(true)`.  
In `_onPressureEnd()`, call `this.timingBar.setPressureMode(false)`.

---

### 10. PERFECT zone is 16% wide; spec requires 10%
**File:** `src/managers/TimingManager.js:6`, `src/components/TimingBar.js:6-13`  
**Spec §4.2:** PERFECT = center 10%, GREAT = 15% each side, GOOD = 20% each side, MISS = 10% each side.  
**Actual:** PERFECT = 42%–58% = 16%, GREAT = 12% each side.

**Fix:**
```js
// TimingManager.getZone()
if (position >= 0.45 && position <= 0.55) return 'PERFECT';  // 10%
if ((position >= 0.30 && position < 0.45) || (position > 0.55 && position <= 0.70)) return 'GREAT'; // 15% each
if ((position >= 0.10 && position < 0.30) || (position > 0.70 && position <= 0.90)) return 'GOOD';  // 20% each
return 'MISS'; // 10% each outer

// TimingBar ZONES array
{ pct: 0.10, color: COLOR.GREY },      // MISS
{ pct: 0.20, color: COLOR.GOLD_DARK }, // GOOD
{ pct: 0.15, color: COLOR.ORANGE_HOT },// GREAT
{ pct: 0.10, color: COLOR.GOLD },      // PERFECT
{ pct: 0.15, color: COLOR.ORANGE_HOT },// GREAT
{ pct: 0.20, color: COLOR.GOLD_DARK }, // GOOD
{ pct: 0.10, color: COLOR.GREY },      // MISS
```

---

### 11. Streak break has no sound
**File:** `src/managers/AudioManager.js:19-33`  
**Spec §7.2:** "On streak break: counter resets to 0 with a small 'pop' sound."  
**Actual:** `streak:broken` bus event is emitted but not wired in `AudioManager.wireEvents()`.

**Fix:** Add to `wireEvents()`:
```js
this._on('streak:broken', () => {
  if (!this.synth) return;
  this.synth.playTone(300, 0.08, 'square', 0.002, 0.05);
});
```

---

### 12. Streak 5+ should produce a particle burst on every new hit (not just milestone)
**File:** `src/managers/StreakManager.js:11-22`  
**Spec §7.2:** "At streak 5+: counter pulses; brief particle burst on each new streak hit."  
**Actual:** `streak:milestone` fires only at exactly 5 and exactly 10. No per-hit burst above 5.

**Fix:** In `onUsefulHit()`, after updating `this.current`, emit a separate event for continuous bursts:
```js
if (this.current >= 5) {
  bus.emit('streak:hit-above5', this.current); // MatchScene shows small particle burst
}
```

---

### 13. Pressure phase leaderboard flash not implemented
**Spec §9.1:** "Pressure phase triggers a temporary leaderboard flash."  
**Actual:** `_onPressureStart()` shows only the banner text; no leaderboard rankings are flashed.

**Fix:** In `_onPressureStart()`, after the banner, show a 2-second overlay listing the top 3 standings from `leaderboardManager.getAllSorted()`.

---

### 14. Miss zone grey flash not implemented
**File:** `src/scenes/MatchScene.js` — `_onSpin()` / timing bar lock  
**Spec §4.3:** "Miss: subtle grey flash" on MISS zone tap.  
**Actual:** Only PERFECT triggers a visual effect; MISS has no flash.

**Fix:** In `TimingBar.lock()`, when zone is `'MISS'`, briefly flash the bar background grey:
```js
if (zone === 'MISS') {
  this.scene.tweens.add({ targets: this.barGfx, alpha: 0.5, duration: 80, yoyo: true });
}
```

---

### 15. Streak counter location: HUD instead of meter strip
**File:** `src/scenes/MatchScene.js:145-160`  
**Spec §7.2:** "Small counter '🔥 x4' shown in meter strip" (the 80 px bar between card and timing bar).  
**Actual:** Streak pill is a third pill in the HUD top bar.

**Fix:** Move streak display into `MeterBar` component, rendering it as a right-side label on the same row as the jackpot segments. Remove the center HUD streak pill from `_buildHUD()`.

---

### 16. Card reveal uses fade/scale instead of flip animation
**File:** `src/components/BingoCard.js:248-286`  
**Spec §11.3:** "cells flip in from blank."  
**Actual:** `revealAnimation()` tweens `alpha` and `scaleX/Y` together — a fade-in, not a flip.

**Fix:** Replace with a 3D-ish flip: tween `scaleX` 0→1 with a mid-point texture swap (blank→number), using Phaser's `scaleX: { from: 0, to: 1 }` with `ease: 'Sine.easeInOut'`.

---

### 17. Win: winning line cells should individually glow, not just draw a line
**File:** `src/components/BingoCard.js:227-246`  
**Spec §11.5:** "All cells in a line glow."  
**Actual:** `flashLineComplete()` draws a line graphic between first and last cell; cells don't glow.

**Fix:** In `flashLineComplete()`, also tween each cell in the line with a gold fill overlay:
```js
line.forEach(({ col, row }) => {
  const cell = this.getCell(col, row);
  if (cell) {
    // Briefly tint the cell bg gold
    this.scene.tweens.add({ targets: cell.bg, alpha: 0.5, duration: 150, yoyo: true, repeat: 2,
      onUpdate: () => { cell.bg.clear(); /* draw gold fill */ } });
  }
});
```

---

## Minor / Nice-to-Have

### 18. CSS safe-area-inset-* not applied to canvas wrapper
**File:** `index.html`  
**Spec §1:** "Use `viewport-fit=cover` + CSS `env(safe-area-inset-*)` on the canvas wrapper."  
`viewport-fit=cover` is set. The game uses hardcoded `44*sf` for SAFE_TOP. On real notched devices this may clip the HUD.

**Fix:** Add CSS `padding-top: env(safe-area-inset-top)` to `#game-wrapper`, then read the computed padding in JS to derive `SAFE_TOP` dynamically.

---

## Testing Checklist (MVP §15 Success Criteria)
After all fixes above, verify:
- [ ] Player wins ~35–45% of matches across 10 self-test runs (bot skill tuning)
- [ ] PERFECT-timed spins ≥40% useful-hit rate; MISS ≤20% (enable `?debug=1`)
- [ ] Pressure phase fires in ≥80% of matches before end
- [ ] 1–3 jackpot balls earned per typical match
- [ ] Full match from launch → results screen in under 5 minutes
- [ ] No softlocks across 10 consecutive matches

---

*End of TODO.md*
