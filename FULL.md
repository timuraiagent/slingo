# Skill Bingo Slots — Full Game Design Document v1.0

> **Working title:** Skill Bingo Slots  
> **Alternate titles:** Spin & Mark · Reel Bingo Clash · Reel Race Bingo · Lucky Line Arena  
> **Platform:** iOS / Android (HTML5/Phaser port-ready)  
> **Orientation:** Portrait only  
> **Engine:** Phaser 3 (WebGL renderer, mobile-first)  
> **Document status:** Vision / Full GDD  
> **Last updated:** 2026-04-28

---

## Table of Contents

1. [Vision & High Concept](#1-vision--high-concept)
2. [Genre & Positioning](#2-genre--positioning)
3. [Player Fantasy](#3-player-fantasy)
4. [Core Pillars](#4-core-pillars)
5. [Game Loops](#5-game-loops)
6. [Screen Architecture](#6-screen-architecture)
7. [Bingo Card System](#7-bingo-card-system)
8. [Win Patterns](#8-win-patterns)
9. [Number System](#9-number-system)
10. [Slot Machine System](#10-slot-machine-system)
11. [Timing Mechanic](#11-timing-mechanic)
12. [Ball System](#12-ball-system)
13. [Meters & Bonus Systems](#13-meters--bonus-systems)
14. [Streak & Combo System](#14-streak--combo-system)
15. [Jackpot System](#15-jackpot-system)
16. [Player Abilities](#16-player-abilities)
17. [Card Special Mechanics](#17-card-special-mechanics)
18. [Anti-Frustration Systems](#18-anti-frustration-systems)
19. [Tournament Systems](#19-tournament-systems)
20. [PvP Interaction Systems](#20-pvp-interaction-systems)
21. [Pressure & Comeback Systems](#21-pressure--comeback-systems)
22. [Game Modes](#22-game-modes)
23. [Boss System](#23-boss-system)
24. [Event Systems](#24-event-systems)
25. [Rarity & Collectibles](#25-rarity--collectibles)
26. [Meta-Progression](#26-meta-progression)
27. [Economy](#27-economy)
28. [Boosters](#28-boosters)
29. [Social Systems](#29-social-systems)
30. [Retention Systems](#30-retention-systems)
31. [Difficulty Layers](#31-difficulty-layers)
32. [UX / UI Principles](#32-ux--ui-principles)
33. [Audio Design](#33-audio-design)
34. [RNG & Balance Philosophy](#34-rng--balance-philosophy)
35. [AI / Bot / Async Support](#35-ai--bot--async-support)
36. [Accessibility](#36-accessibility)
37. [Tutorial System](#37-tutorial-system)
38. [Content Scalability](#38-content-scalability)
39. [Design Risks](#39-design-risks)
40. [Feature Ladder & Roadmap](#40-feature-ladder--roadmap)
41. [Technical Architecture (Phaser 3)](#41-technical-architecture-phaser-3)

---

## 1. Vision & High Concept

### One-sentence pitch

> A vertical mobile tournament game where players spin a slot machine, catch numbers through a timing skill, close bingo cells, chain combos, deploy jackpot balls tactically, and race rivals to complete patterns first.

### What this is NOT

- Not a passive slot game with a bingo skin.
- Not a traditional bingo caller game.
- Not a pure skill game that eliminates luck.

### What this IS

**The slot provides the engine. The bingo card provides the goal. The timing mechanic provides the agency. The tournament provides the tension.**

Players do not just wait for lucky numbers — they actively steer the RNG with timing skill, accumulate tactical resources (jackpot balls, shields, combos), and make meaningful decisions that separate skilled play from passive play.

### Core loop summary

```
Spin → Timing window → Number result → Mark cell / Miss → 
Charge meters → Use jackpot/special balls → Close lines → 
Win pattern → End match → Earn rewards → Meta progression
```

---

## 2. Genre & Positioning

### Primary genre
Mobile hybrid casual/midcore

### Sub-genres
- Skill bingo
- Tournament race
- Slot-powered board progression
- Reactive number-chasing
- Live competition casual strategy

### Market positioning

| Axis | Position |
|---|---|
| Skill vs Luck | 60% luck / 40% skill feel (actual: 70/30 with heavy bias assist) |
| Session length | Short (3–6 min), medium (8–12 min) depending on mode |
| Social | Async-first with optional real-time |
| Monetization model | F2P with premium pass + cosmetics + entry tickets |
| Complexity | Simple to start, deep to master |

---

## 3. Player Fantasy

The player must feel:

- **The thrill of the spin** — anticipation before the reel stops.
- **Visual progress clarity** — the card visibly closes toward the goal.
- **Moments of control** — "I timed that perfectly."
- **The emotion of a needed number** — "YES, that's exactly what I needed."
- **Race tension** — someone else is close, the pressure is real.
- **Tactical weight** — jackpot ball decisions feel meaningful, not automatic.
- **Skill rewarded** — good timing produces better outcomes on average.
- **Clutch moments** — a perfect play at the last second changes the outcome.

---

## 4. Core Pillars

### 4.1 Slot Juiciness
The slot machine must deliver:
- Kinetic energy during spin
- Anticipation as reels slow
- Dopamine burst on good results
- Clear visual reward differentiation (useful vs near-miss vs blank)

### 4.2 Bingo Clarity
The bingo card must remain:
- Immediately readable at a glance
- Visually dominant as the strategic goal
- Animated clearly on every mark
- Never cluttered by overlapping system noise

### 4.3 Skill Agency
Players must genuinely feel:
- Timing improves their outcomes
- Jackpot decisions have consequence
- Streak maintenance has value
- Even near-misses feel productive (meters filled, combos built)

### 4.4 Competitive Tension
Every match must produce:
- A live leaderboard race
- Pre-finish tension ("I'm one cell away")
- "Almost caught up" moments
- End-match drama

### 4.5 Layered Depth
The game must be:
- Instantly learnable (first session onboarding)
- Strategically rich by session 10+
- Expandable via modes, events, and meta without breaking the core

---

## 5. Game Loops

### 5.1 Macro Loop

```
Login
  → Claim daily rewards
  → Check events / season progress
  → Choose mode / enter lobby
  → Pre-match: select card + boosters
  → Play match
  → Post-match: rewards screen
  → Progress updated (XP, rank, currency, collections)
  → Return to hub
  → Repeat / deeper meta engagement
```

### 5.2 Match Loop

```
Card analysis phase (see numbers needed)
  → Timing bar active
  → Player taps SPIN
  → Reels animate
  → Reel result extracted
  → Number matched / special ball triggered
  → Cell marked / near-miss logged
  → Meters updated (jackpot, streak, heat, combo)
  → Player decision: use jackpot? use booster?
  → Leaderboard position updates
  → Repeat until win condition or spin limit
```

### 5.3 Session Loop (micro)

```
~20–40 spins per match
~3–6 minutes Classic
~90 seconds Blitz
~10–12 minutes Marathon
```

---

## 6. Screen Architecture

All screens designed for **portrait / 9:16 minimum**, safe areas respected for notch/island devices.

### 6.1 Top HUD Bar
- Player position in match (1st / 4th / 8th etc.)
- Total players / players remaining
- Match goal indicator (pattern thumbnail)
- Match timer (if timed mode)
- Settings / pause button

### 6.2 Bingo Zone (top 45% of screen)
- One or more bingo cards
- Per-cell: number, open/closed state, special state (charged, hot, frozen, etc.)
- Line progress highlights
- Pattern overlay showing current objective
- Near-win visual callout (last cell in a line glows)
- Jackpot-targeted cell marker

### 6.3 Skill Zone (middle band)
- Timing bar (horizontal or arc)
- Moving marker / cursor
- Precision zones: PERFECT / GREAT / GOOD / MISS
- Active timing modifiers (wider zone, faster, slower)
- Streak counter
- Jackpot meter
- Heat meter (optional, mid-game unlock)
- Combo meter

### 6.4 Slot Zone (lower-middle)
- Reel display (3×3 default, expandable)
- Symbols: numbers, special icons, bonus tags
- Stop animations per reel
- Result highlight
- Special result overlays (jackpot, wild, scatter-like events)
- Reel state indicators (hot, frozen, cursed, overdrive)

### 6.5 Control Zone (bottom, thumb-reachable)
- **SPIN** (primary, large button)
- Speed selector: Normal / Fast / Turbo
- Jackpot ball deploy button (active when available)
- Booster tray (1–3 visible slots)
- Contextual action buttons (appear situationally)

### 6.6 Overlay Layer
- Leaderboard panel (slide-in or persistent mini)
- Pressure phase announcement
- Event phase takeover
- Near-win warnings
- Tutorial hints
- End-match results overlay

---

## 7. Bingo Card System

### 7.1 Card Formats

| Format | Use Case |
|---|---|
| 5×5 | Standard, all modes |
| 4×4 | Blitz / beginner |
| 6×6 | Marathon / advanced |
| 7×7 | Boss modes / endgame |
| Mini cards | Secondary objectives |
| Asymmetric / figure-shaped | Special events |

### 7.2 Card Count Per Match

- **Single card** — default, beginner-friendly
- **Dual cards** — mid-game unlock, side-by-side
- **Triple cards** — advanced mode
- **Stacked cards** — layered depth mode
- **Rotating pool** — game assigns new card when one is completed

### 7.3 Cell Types

| Type | Description |
|---|---|
| Standard | Normal numbered cell |
| Closed | Marked/filled |
| Blocked | Cannot be marked this turn |
| Charged | Provides bonus effect when marked |
| Hot | Easier to hit; timing zone shows as target |
| Frozen | Temporarily locked by enemy or event |
| Cursed | Counts as marked for opponent if hit |
| Wildcard | Any ball can close it |
| Event | Triggers special effect when closed |
| Boss | Requires multiple hits |
| Jackpot-marked | Player intends to use jackpot here |
| Hidden | Number not visible until revealed |
| Shielded | Protected from negative effects |
| Trap | Triggers negative effect on close |

### 7.4 Free Cell

Options available per mode:
- No free cell (purist mode)
- Center free cell (classic bingo)
- Random free cells (1–3)
- Earnable free cells (rewards for streak/combo)
- Conditional free cell (unlocks at pressure phase)

### 7.5 Card Generation

Cards can be:
- **Random fair** — numbers distributed evenly across columns
- **Balanced for mode** — weighted to fit match duration
- **Archetype-based** — see 7.6
- **Collectible** — earned cards with fixed layouts and traits
- **Draft-selected** — player picks from options pre-match
- **Event-adapted** — special seasonal layouts

### 7.6 Card Archetypes

| Archetype | Trait |
|---|---|
| Balanced | Even number spread |
| Cluster | Numbers grouped, good for blackout |
| Corner-heavy | Rewards corner patterns |
| Center-heavy | Rewards center/cross patterns |
| Line-friendly | Numbers aligned for rows/columns |
| High-risk spread | Numbers sparse — harder but bonus rewards |
| Combo-synergy | Enhanced combo ball interactions |
| Jackpot-focused | More cells that reward jackpot investment |
| Defensive | More shielded cells, fewer traps |
| Explosive | Fragile but chain-reaction potential |

---

## 8. Win Patterns

### 8.1 Linear Patterns
- Single row (any of 5)
- Single column (any of 5)
- Main diagonal
- Anti-diagonal
- Two lines
- Three lines
- Any four lines
- All five rows / all five columns

### 8.2 Classic Bingo Patterns
- Four corners
- X shape
- Plus / cross
- Box (outer ring)
- Outer ring only
- Center 3×3 square
- Zigzag / ladder
- Letter patterns (T, L, U, H, O)

### 8.3 Advanced Patterns
- Full blackout (all cells)
- Custom asymmetric figure
- Dynamic event figure (revealed during match)
- Race checkpoints (multi-stage sequential targets)
- Multi-card cross-pattern
- Spiral

### 8.4 Multi-Phase Patterns
Matches can require sequential pattern completion:
- Phase 1: complete any line → Phase 2: complete corners → Phase 3: blackout
- Escalating targets with intermediate rewards
- Secondary objectives running in parallel
- Tie-breaker pattern for draws

---

## 9. Number System

### 9.1 Number Ranges

| Range | Use |
|---|---|
| 1–30 | Blitz / mini-card modes |
| 1–50 | Standard balanced |
| 1–60 | 5×5 default |
| 1–75 | Classic bingo standard |
| 1–90 | UK-style / marathon |
| Custom | Event-specific pools |

### 9.2 Column Distribution (5×5 default)

Following classic B-I-N-G-O column rules:
- Column 1 (B): 1–15
- Column 2 (I): 16–30
- Column 3 (N): 31–45
- Column 4 (G): 46–60
- Column 5 (O): 61–75

### 9.3 Smart Number Weighting (Bias System)

The output number is not pure random — it runs through a bias layer:

```
base_rng_result
  → filter through needed_numbers (player's remaining cells)
  → apply timing_quality_modifier (perfect = higher bias)
  → apply streak_modifier (active streak = higher useful chance)
  → apply mode_rules (catchup assist for last-place player)
  → apply fairness_cap (prevent guaranteed targeting)
  → apply pity_logic (if X consecutive useless spins, raise bias)
  → final_output_number
```

**Bias caps:** At maximum, no more than 60% chance of targeting a needed number. This preserves the feel of randomness while meaningfully rewarding good timing.

---

## 10. Slot Machine System

### 10.1 Core Structure

```
Reels (visual) → Symbol definitions → Spin logic → 
Stop sequence → Result extraction → Event layer → 
Output: {number, modifier, bonus_ball_type, special_event}
```

### 10.2 Reel Configurations

| Config | Description |
|---|---|
| 3×3 | Compact, fast-read |
| 5×3 | Standard — 5 columns, 3 visible rows |
| 5×4 | Extended view |
| Dynamic expanding | Reels add rows during special phases |
| Event reels | Themed visual takeover |
| Boss reels | Modified symbols during boss fight |

### 10.3 Symbol Types

| Symbol | Effect |
|---|---|
| Number | Direct number output |
| Numbered + bonus tag | Number + small bonus (meter charge, coin) |
| Jackpot symbol | Charges jackpot meter significantly |
| Wild symbol | Can substitute for a needed number |
| Scatter-type | Triggers bonus event (free spin, mini-game) |
| Multiplier | Doubles next useful hit value |
| Meter symbol | Charges streak / heat / combo meter |
| Color symbol | Part of color combo system |
| Trap symbol | Negative event (slow reel, block cell) |
| Event token | Spawns event-specific effect |
| Boss token | Boss phase trigger |

### 10.4 Spin Output Logic

A spin can produce:
- **Standard**: one number
- **Number + modifier**: number + meter charge or effect
- **Number + bonus ball**: number + special ball added to inventory
- **Multi-ball**: 2–3 numbers (special phase)
- **Wild result**: player chooses column target
- **Special event**: no number, full special effect
- **Chain result**: triggers next spin at bonus odds

### 10.5 Spin Speed Modes

| Mode | Duration | Use |
|---|---|---|
| Normal | ~1.5s | Default |
| Fast | ~0.8s | Player unlock |
| Turbo | ~0.4s | Late-game / ranked |
| Instant | ~0.1s | Automation |
| Cinematic | ~3–5s | Jackpot reveals |
| Boss speed | Variable | Boss phase |
| Sudden death | ~0.3s | Endgame |

### 10.6 Reel Special States

| State | Visual | Effect |
|---|---|---|
| Hot | Orange glow | Higher useful output |
| Overdrive | Fire/spark FX | Enhanced multiplier |
| Frozen | Ice tint | Locked to specific symbols |
| Cursed | Dark particle | Risk of negative outputs |
| Bonus | Gold border | Guaranteed bonus ball |
| Mirror | Reflection FX | Copies previous result |
| Echo | Ghost symbols | Replays past hit |
| Split | Divided reel | Two results simultaneously |
| Mutating | Morphing symbols | Symbol types shift mid-spin |

---

## 11. Timing Mechanic

### 11.1 Core Concept

Between the player pressing SPIN and the reel stopping, a **timing bar** is active. A marker moves along the bar. The player can choose when to confirm their spin (or the spin runs automatically if they do nothing). The point of confirmation influences the bias applied to the reel result.

This gives the player **agency without determinism** — better timing improves odds, but doesn't guarantee outcomes.

### 11.2 Timing Bar Types

| Type | Description |
|---|---|
| Linear horizontal | Classic left-to-right bar with color zones |
| Arc / curved | Follows thumb ergonomics at bottom of screen |
| Ring / circular | 360° marker, hardest to master |
| Oscillating | Marker bounces, varying speed |
| Segmented number rail | Bar divided into number groups — aim for needed column |
| Dual bar | Two simultaneous markers, two results |
| Adaptive | Shape changes based on player progression |

### 11.3 Precision Zones

| Zone | Timing Accuracy | Effect |
|---|---|---|
| PERFECT | Dead center ±2% | Maximum bias, meter charge, combo credit |
| GREAT | ±8% | High bias, partial meter charge |
| GOOD | ±18% | Normal bias |
| CLOSE | ±30% | Minimal bias, small meter drip |
| MISS | Outside zones | Base RNG, no bonus |

### 11.4 Timing Effects on Output

Good timing can influence:
- Probability of needed number (bias)
- Probability of adjacent/near-needed number
- Chance of bonus ball spawn
- Chance of multiplier trigger
- Jackpot meter charge rate
- Streak preservation
- Combo activation

### 11.5 Adaptive Timing System

The timing bar dynamically adjusts:

| Trigger | Adjustment |
|---|---|
| New player | Larger perfect zone, slower marker |
| Active streak | Slightly smaller zone (higher skill ceiling reward) |
| Pressure phase | Marker accelerates |
| Booster active | Zone expands |
| Catch-up assist | Zone slightly wider for last-place |
| Boss fight | Marker behavior becomes unpredictable |
| Event modifier | Zone shape can invert or multiply |

### 11.6 Advanced Timing Modes

- **Hold-and-release**: Player holds button, releases at right moment
- **Double-tap**: Two successive taps define a range
- **Combo timing**: Multiple consecutive perfects multiply reward
- **Line target timing**: Bar divided into columns, aim for needed column
- **Phase match timing**: Match the highlighted zone color to a card region
- **Burst timing**: Rapid repeated taps fill a burst meter

---

## 12. Ball System

Balls are the output units from the slot — they connect the slot result to the bingo card.

### 12.1 Standard Ball
- Closes the matching cell on the card
- No special behavior

### 12.2 Near-Hit Ball
- Number doesn't match any open cell
- Charges meters (jackpot, heat, combo)
- Shows as "close" visual cue
- Part of pity logic counter

### 12.3 Jackpot Ball
- Player can place it on **any open cell** on the card
- Spawned from jackpot meter or special reel symbol
- Stays in inventory until used — no expiry (basic version)

### 12.4 Super Jackpot Ball
- Can close **any cell on any active card**
- Has a timer (expires after N spins if unused)
- If expired: placed randomly or discarded
- Rare — spawned from super jackpot meter or special events

### 12.5 Multi-Hit Ball
- Closes 2–3 cells simultaneously
- Player selects target cells (limited time to choose)
- Powerful — rare spawn

### 12.6 Line Ball
- Applies only to cells in one designated line
- Player assigns the target line before it activates
- Particularly effective for near-complete lines

### 12.7 Wild Ball
- Counts as any number within a specific column
- Or counts as any number on the board (ultra-wild variant)

### 12.8 Cluster Ball
- Closes the target cell AND all adjacent orthogonal cells (cross pattern)
- Designed for center-of-board strategies

### 12.9 Echo Ball
- Replays the last successful number result
- Useful if the previous spin closed an important cell

### 12.10 Freeze Ball (Defensive)
- Freezes a specific cell, preventing it from being cursed/blocked
- Or freezes an opponent's advantage cell (PvP mode)

### 12.11 Shield Ball
- Applies a shield to a target line
- While shielded: cells in that line cannot be blocked or corrupted

### 12.12 Steal Ball (PvP)
- Removes one mark from an opponent's card
- Or delays an opponent's jackpot meter by 20%
- Limited use in soft-PvP modes

### 12.13 Spy Ball
- Reveals opponent's card state (hidden card modes)
- Shows opponent's jackpot and meter levels

### 12.14 Curse Ball (PvP / Boss)
- Applied to opponent or triggered by boss
- Temporarily slows their timing bar
- Or blocks a random cell for N spins

### 12.15 Sequence Ball
- Extends current streak by 1 guaranteed
- Useful for preserving streak at risk moments

### 12.16 Color Balls
Used in combo systems — colors have no intrinsic card effect but combine with color timing zones and combo meters:

| Color | Combo Role |
|---|---|
| Red | Aggressive combo — more useful-number bias |
| Blue | Defensive combo — shield/protect buff |
| Green | Healing combo — pity reset, meter drip |
| Gold | Jackpot amplifier |
| Purple | Wildcard — random powerful effect |
| Theme-specific | Event-dependent |

---

## 13. Meters & Bonus Systems

### 13.1 Jackpot Meter

```
Charges from:    useful hits, perfect timing, near-hits, combos, events
Full reward:     jackpot ball added to inventory
Overflow:        excess charge carries forward or converts to super jackpot
Visual:          glowing bar below timing zone
Sound:           rising tone as it fills, fanfare at full
```

### 13.2 Streak Meter

```
Charges from:    consecutive useful hits (not broken by misses yet)
Breaks from:     useless hit (grace period of 1 miss available at upgrade)
Milestones:      3 → small reward, 6 → jackpot charge, 10 → overdrive phase
Visual:          segmented bar with milestone markers
Sound:           escalating tone at each segment
```

### 13.3 Pressure Meter

```
Charges from:    any player getting close to win condition
Activates:       pressure phase effects (see §21)
Drains:          when lead player gets further from win
Visual:          ambient screen pulse, leader avatar highlight
```

### 13.4 Heat Meter (mid-game unlock)

```
Charges from:    skillful play — perfect timings, useful hits in sequence
State:           COLD / WARM / HOT / BURNING
Effects:         HOT = hot zones on card; BURNING = overdrive + enhanced bias
Visual:          temperature gauge with fire/glow particle effects
```

### 13.5 Combo Meter

```
Charges from:    matching color sequences, symbol chains, spatial cell patterns
Fills:           gradually with each combo-contributing spin
Full reward:     combo explosion — random mark + multiplier + meter charge
Visual:          color-coded segmented bar
```

### 13.6 Chaos Meter (roguelike / event modes only)

```
Charges from:    near-misses, consecutive useless spins, boss damage
Full trigger:    random global modifier activates (positive or negative)
Visual:          unstable glitch/distortion aesthetic
```

---

## 14. Streak & Combo System

### 14.1 Streak

**Building streak:**
- Consecutive spins that produce a useful hit, perfect timing, or charged result
- Near-hits with good timing count as half-streak

**Breaking streak:**
- Any useless spin (no useful hit, no near-hit)
- With Sequence Ball: one miss is absorbed

**Streak rewards at milestones:**

| Streak | Reward |
|---|---|
| 3 | Jackpot meter +15% |
| 5 | Bonus ball spawn (random type) |
| 7 | Timing zone widens for 3 spins |
| 10 | Overdrive phase (2 spins) |
| 15 | Super jackpot charge |
| 20+ | Legendary streak — board highlights all needed numbers |

### 14.2 Combo

**Color combo**: Hitting matching color balls in sequence (e.g., 3 gold → jackpot amplify).

**Symbol combo**: Reels showing same symbol type twice in a row.

**Spatial combo**: Closing two adjacent cells in one or two spins triggers proximity bonus.

**Timing combo**: Three consecutive PERFECT timings → combo bonus ball.

**Cross-card combo**: Closing cells on two different cards in one spin (multi-card mode).

**Combo reward examples:**

| Combo | Reward |
|---|---|
| 3× color match | Random free mark on needed cell |
| 3× PERFECT timing | Jackpot meter fill +25% |
| Spatial adjacent close | Combo ball spawn |
| Symbol chain | Multiplier ×2 next spin |
| Cross-card | Both meters charged |

---

## 15. Jackpot System

### 15.1 Basic Jackpot Model (default, early game)

- One jackpot meter
- One jackpot ball type (mark any cell)
- Player taps JACKPOT button → picks target cell → confirm

### 15.2 Tactical Jackpot Model (mid-game)

Player choices on jackpot use:
- **Save** — hold for later (risk: loses super jackpot window)
- **Convert** — spend 2 regular jackpots for 1 super jackpot
- **Use now** — apply to currently highest-value cell (shown by advisor hint)
- **Invest** — place on a locked cell to "pre-load" it (closes instantly when unlocked)

### 15.3 Jackpot Variants

| Variant | Description |
|---|---|
| Standard jackpot ball | Any single cell |
| Line jackpot | Completes an entire targeted line |
| Random triple | Closes 3 random needed cells |
| Delayed jackpot | Schedules a free mark for the next spin's number in needed pool |
| Expiring jackpot | Must be used within 5 spins or lost |
| Shared jackpot (team) | Team shares a pool, any member can use |
| Mirror jackpot | Closes the mirror cell on a second card |
| Chain jackpot | Each use charges the next jackpot 30% faster |

### 15.4 Jackpot Economy (meta-layer)

- Jackpot ball inventory cap: 3 (upgradeable to 5)
- Jackpot efficiency upgrade: reduces meter cost per ball
- Jackpot type unlock: line jackpot and triple jackpot unlock through mastery
- Super jackpot cap: 1 active at a time

---

## 16. Player Abilities

### 16.1 Active Abilities

Abilities cost a resource or have a cooldown. Available abilities expand with progression.

| Ability | Effect | Cost/Cooldown |
|---|---|---|
| Use Jackpot Ball | Place ball on any cell | Jackpot meter |
| Deploy Shield | Protect a line for 5 spins | Shield resource |
| Activate Heat Zones | Highlight 3 needed cells as hot targets | Heat meter |
| Line Target | Focus timing bar on a single column | Cooldown 4 spins |
| Prediction Scan | Reveal next 3 numbers in pool | Resource |
| Card Reshuffle | Randomly reassign unclosed cells | Costly resource |
| Save Ball | Cache the current ball result for later | Cooldown |
| Lock Line | Prevent a nearly-complete line from being corrupted | Resource |
| Reroll Spin | Discard current spin, re-spin once | Cooldown 3 spins |
| Widen Perfect Zone | Temporarily expand PERFECT zone | Heat meter |
| Overdrive Activate | Double meter charges for 3 spins | Streak 10+ |
| Reveal Needed Cluster | Show 5 most likely useful numbers | Event-gated |

### 16.2 Passive Abilities (unlocked through meta-progression)

| Passive | Effect |
|---|---|
| Near-Hit Boost | Near-hits charge meters 50% more |
| Fast Meter Gain | All meters charge 20% faster |
| Timing Forgiveness | GOOD zone behaves like GREAT |
| Streak Safety Net | First miss per streak doesn't break it |
| Improved Comeback | Catch-up assist activates sooner |
| First Blood | Bonus jackpot charge on first completed line |
| Color Sensitivity | Color combos need 1 fewer match |
| Jackpot Efficiency | Jackpot meter costs 15% less |

---

## 17. Card Special Mechanics

### 17.1 Card Shuffle

- **Full shuffle**: All unclosed cells reassigned randomly
- **Partial shuffle**: Reshuffle only selected column/region
- **Targeted shuffle**: Player names a number range to replace
- **Cost**: Special resource or coin cost; cooldown 1 per match

### 17.2 Card Lock

Locks one column or region from negative events:
- Costs shield resource
- Lasts N spins or until the locked region completes

### 17.3 Card Shift

Shifts the number distribution in one column up or down by ±5 range:
- Useful for aligning with currently-hot reel patterns
- Cooldown: once per match

### 17.4 Hidden Card

Some or all cell numbers are face-down at match start:
- Numbers reveal when the slot produces a matching number
- Or via Spy Ball
- Increases tension — adds discovery element

### 17.5 Evolving Card

The card changes during the match:
- Closed cells can "level up" to charged cells if hit again
- New special cells spawn at pressure phase
- Boss attacks modify cell types mid-match

### 17.6 Multi-Layer Cell

Some cells require 2 hits to fully close:
- First hit: cell becomes "activated" (glowing state)
- Second hit: cell closes
- Jackpot ball closes in one action regardless

### 17.7 Card Traits Summary

| Trait | Effect |
|---|---|
| Cluster-friendly | Adjacent closes grant combo credit |
| Corner magnet | Corner closes give extra jackpot charge |
| Center density | Center region has more needed numbers per spin |
| Color-synergy | Color ball combos work at ×1.5 rate |
| Defensive | Cells start with 1 shield each |
| Explosive | Closing 3+ cells in 2 spins triggers chain reaction |
| Jackpot-optimized | Jackpot ball closes 2 cells (pre-loaded pairs) |

---

## 18. Anti-Frustration Systems

### 18.1 Pity Logic

```
if consecutive_useless_spins >= 3:
    useful_bias += 15% per additional miss
    cap: useful_bias cannot exceed 60% total
    reset: on any useful hit
```

### 18.2 Catch-Up Assist

For players in last place or bottom 25%:
- Useful number bias +10%
- Timing GOOD zone acts as GREAT
- Jackpot meter drip: +5% per spin passively
- Activated silently — not visible to player

### 18.3 Soft Fail Reward

Every "useless" spin still gives at minimum:
- +1% jackpot meter
- +1 pity counter
- Sometimes a small coin reward (random, low rate)
- Keeps "dry spins" from feeling completely empty

### 18.4 Near-Win Sensitivity

When player is 1 cell away from completing a line:
- The needed number's column gets +15% bias
- Near-hit from the same column charges meter faster
- Visual: the remaining cell pulses

### 18.5 Bad Luck Insurance

Player accumulates "insurance tokens" passively over long dry streaks:
- After 10+ consecutive non-useful spins: auto-spawn a jackpot ball
- This fires at most once per match

---

## 19. Tournament Systems

### 19.1 Match Lobby (Core Tournament)

```
Players:        4–16 (configurable per mode)
Goal:           First to complete target pattern wins
Duration:       Until first completion (no spin limit in Classic)
Entry:          Coin entry or free tickets
Rewards:        Position-based: 1st > 2nd > 3rd >> rest
Matchmaking:    MMR-based ±200 rating range
```

### 19.2 Ranked Tournaments

- **Leagues**: Bronze → Silver → Gold → Platinum → Diamond → Master
- **MMR**: Win = +25, Loss = -15, Top 3 = +10 for 2nd/3rd
- **Promotion**: Top 20% of league per season advance
- **Demotion**: Bottom 10% drop to previous league
- **Rank protection**: 2 "shield" games per promotion zone before demotion
- **Season length**: 4 weeks; end-of-season exclusive rewards

### 19.3 Tournament Entry Types

| Entry | Cost | Reward Pool |
|---|---|---|
| Free lobby | Free | Small coin + XP |
| Coin entry | 100–5000 coins | Coin pool + XP |
| Ticket entry | 1 ticket | Better rewards |
| Premium tournament | Gem entry | Cosmetics + premium currency |
| Event pass | Special pass | Event rewards |

### 19.4 Async Tournaments

- Player plays against simulated standings based on real player data
- Score is submitted; final standings revealed after N hours
- Low-pressure, high-retention for casual players

### 19.5 Real-Time Tournaments

- Live lobby, live leaderboard
- Player positions update per spin
- Tension from watching others close in

### 19.6 Multi-Round Tournaments

```
Qualifier round:   Top 50% advance
Semi-finals:       Top 4 per group advance
Finals:            8 players, winner takes all
Gauntlet:          Progressive difficulty tower, no lives
```

### 19.7 Elimination Modes

- **Standard**: First to complete pattern wins
- **Bottom drop**: After N spins, last-place player is eliminated, repeat
- **Sudden death**: After 75% of spins, any miss = extra spin cost
- **Zone shrink**: Win condition gets harder each phase (line → corners → blackout)

---

## 20. PvP Interaction Systems

### 20.1 Soft PvP (default for Classic mode)

- Leaderboard race only
- Visual: see opponent progress bars (not their full card)
- Pressure phase triggers when any player is close to win
- No direct interference — all outcomes are indirect

### 20.2 Medium PvP

- Deny mechanics: completing certain patterns locks a shared bonus ball pool
- Limited temporary interference via special reel outcomes
- Shared resource competition: only one "line ball" available per round — first to earn it via timing gets it

### 20.3 Hard PvP (dedicated PvP mode only, optional)

| Action | Effect | Rarity |
|---|---|---|
| Steal Ball | Remove one mark from opponent | Rare reel symbol |
| Jam Reel | Opponent's next spin is forced-slow | Very rare |
| Freeze Cell | Freeze target player's hottest cell for 3 spins | Special mode only |
| Curse Timing | Opponent's perfect zone shrinks for 5 spins | Boss drop |
| Disrupt Jackpot | Drain opponent's jackpot meter by 30% | Hard PvP only |
| Line Corruption | One random cell in opponent's near-complete line gets blocked | Hard PvP only |

### 20.4 Visibility Rules

| Info | Soft PvP | Hard PvP |
|---|---|---|
| Opponent cell count | Shown | Shown |
| Opponent pattern progress | Bar only | Full visibility |
| Opponent meters | Hidden | Visible |
| Opponent active effects | Hidden | Visible |
| Opponent card layout | Hidden | Optional (Spy Ball) |

---

## 21. Pressure & Comeback Systems

### 21.1 Pressure Phase

**Trigger**: Any player reaches 80% of win condition.

**Effects:**
- Visual: ambient screen pulses red/orange, music tempo increases
- Timing bar: marker speed increases by 20%
- All players: useful bias slightly increased (tension reward)
- Near-win player: small advantage (slightly better odds)
- Others: catch-up assist escalates

### 21.2 Comeback Window

**Trigger**: Player has been in last place for 3+ consecutive minutes.

**Effects:**
- Jackpot meter drips +5% per spin
- Timing GOOD zone → GREAT
- One-time spawn of random bonus ball (type based on what would help most)
- Silent — player doesn't see a notification (preserves dignity)

### 21.3 Last Chance Phase

**Trigger**: Match is projected to end within 10 spins.

**Effects:**
- Spin cooldown removed
- All active cooldowns halved
- Bonus odds: useful bias +10% for all players
- Potential sudden-death pattern (if enabled by mode)
- Visual: countdown overlay, dramatic music sting

---

## 22. Game Modes

### 22.1 Classic Tournament
- 5×5 card, any single-line pattern to win
- 8-player lobby, real-time
- Unlimited spins until winner
- Duration: 3–6 minutes

### 22.2 Full Bingo (Blackout)
- Must complete all cells
- Longer match, more tactical resource use
- Duration: 8–14 minutes

### 22.3 Blitz
- 4×4 card, 1-minute timer, spin as fast as possible
- Automatic spins available (turbo mode)
- Winner: most cells closed when time expires
- Duration: 60–90 seconds

### 22.4 Marathon
- Multi-stage: complete 3 patterns sequentially
- New card issued each stage (or pattern resets on same card)
- Duration: 10–15 minutes

### 22.5 Multi-Card Frenzy
- 3 simultaneous cards
- Each spin applies to all cards simultaneously
- Winner: first to complete target pattern on ANY card
- Medium difficulty — cards split attention

### 22.6 Boss Mode
- Solo or co-op 2–4 players vs. AI boss
- Boss inflicts effects per phase
- Win: complete pattern before boss "HP" reaches zero (boss chips away health via effects)
- Duration: 8–12 minutes

### 22.7 Duel Mode (1v1)
- Hard PvP interactions enabled
- Both players see each other's cards (partial)
- Interference mechanics fully active
- Duration: 4–8 minutes

### 22.8 Squad Mode
- Teams of 2v2 or 3v3
- Each player has own card; team wins when any member completes pattern
- Team jackpot pool shared
- Duration: 4–8 minutes

### 22.9 Draft Mode
- Pre-match: players select card archetype, 2 abilities, 1 booster from offered choices
- Others see your picks (or draft is hidden — configurable)
- Adds strategy layer before the match

### 22.10 Roguelike Run
- Chain of 5 matches, each harder
- After each win: choose 1 of 3 random modifiers (stackable)
- Lose 1 match: run ends, rewards based on depth reached
- Duration: 20–40 minutes per run

### 22.11 Daily Challenge
- Fixed seed: all players get same card + same spin sequence
- Pure timing skill determines outcome
- Leaderboard: global ranking for the day
- Duration: one match per day

### 22.12 Event Mode
- Seasonal ruleset overlaid on Classic or special format
- Custom symbols, card themes, bonus rules
- Limited-time rewards

### 22.13 Puzzle Mode
- Pre-set card + pre-set spin sequence
- Player must complete pattern using limited jackpot balls
- Pure optimization puzzle — no luck element

### 22.14 Endless Climb (Gauntlet)
- Progressive difficulty tower
- Each floor: harder pattern, fewer helps
- Leaderboard: how high did you climb?
- Permanent unlocks at floor milestones

---

## 23. Boss System

### 23.1 Boss Concept

Boss fights replace the competitive lobby with a co-op or solo challenge. The boss has HP, phases, and attacks. Players must complete their pattern before the boss defeats them (via effect accumulation).

### 23.2 Boss Attack Types

| Attack | Effect |
|---|---|
| Number Corruption | Replaces 5 random cells on player's card with wrong numbers for 3 spins |
| Reel Infection | Curses all reels — near-hit chance reduced for 4 spins |
| Timing Inversion | Timing bar reverses direction for 3 spins |
| Cell Block | Randomly blocks 2 cells from being marked |
| Jackpot Drain | Empties all players' jackpot meters |
| Freeze Wave | All cards frozen (no marks accepted) for 2 spins |
| Mirror Swap | Player must hit opposite end of timing bar for 3 spins |
| Chaos Surge | Chaos meter fills, triggers random global negative |

### 23.3 Boss Types

| Boss | Specialty |
|---|---|
| Reel Demon | Specializes in reel infection attacks |
| Number Witch | Corrupts numbers and hides cells |
| Freeze Giant | Freeze attacks, slows timing bar |
| Mirror Phantom | Inverts mechanics |
| Chaos Hydra | Stacks multiple chaos effects |
| Time Wraith | Pressure timer attack — extremely fast match end |
| Shield Colossus | Phases with shield immunity between attacks |

### 23.4 Boss HP & Phases

- Boss HP decreases when players successfully close cells
- Phase 1 (HP 100%–60%): mild attacks, learnable patterns
- Phase 2 (60%–30%): increased frequency, new attack types
- Phase 3 (30%–0%): desperate attacks, high chaos — win condition must be reached

### 23.5 Boss Rewards

| Rarity | Reward |
|---|---|
| Common | Coins + XP |
| Uncommon | Booster packs |
| Rare | Collectible card |
| Epic | Relic fragment |
| Legendary | Cosmetic skin |

---

## 24. Event Systems

### 24.1 Limited-Time Events

Scheduled 2–4 week events with:
- Custom visual theme (card skins, reel skins, ball trails)
- Unique ruleset modifications
- Exclusive reward track

**Sample events:**
- **Jackpot Storm**: Double jackpot charge rate; golden reels
- **Frozen Depths**: Ice-themed; freeze balls everywhere; boss = Freeze Giant
- **Color Carnival**: Color combo balls dominate; rainbow card themes
- **Speed Rush**: Blitz-only weekend event
- **Boss Raid Week**: Boss mode featured; co-op leaderboard

### 24.2 Event Modifiers

| Modifier | Effect |
|---|---|
| Double jackpot gain | Jackpot meter fills 2× faster |
| Cursed numbers | Certain numbers trigger a mini-curse |
| Mirror cards | Card numbers horizontally mirrored |
| Hot zones everywhere | All cells start as hot cells |
| Combo balls only | Standard balls replaced with color combo balls |
| Pressure starts early | Pressure phase begins at 50% completion |
| Rotating victory patterns | Target pattern changes every 3 minutes |

### 24.3 Community Events

- **Global milestone**: All players collectively close X billion cells → server-wide unlock
- **Team race**: Guilds compete on total event XP
- **Community boss**: Shared boss with global HP, each win = damage

---

## 25. Rarity & Collectibles

### 25.1 Collectible Cards

| Tier | Drop rate | Benefits |
|---|---|---|
| Common | 60% | Standard archetype |
| Rare | 25% | One enhanced trait |
| Epic | 12% | Two traits + visual theme |
| Legendary | 2.5% | Unique archetype + animated FX |
| Mythic | 0.5% | Season-exclusive; max traits + full custom FX |

### 25.2 Collectible Slot Skins

- **Reel frames**: Border themes (wood, crystal, neon, dragon, etc.)
- **Themes**: Full visual overhaul of slot zone
- **Animated materials**: Particle effects on reel spin
- **Special stop effects**: Custom stop animation per reel

### 25.3 Collectible Ball Skins

- **Trails**: Path behind ball in flight
- **Impact effects**: Explosion/sparkle on cell mark
- **Glow styles**: Aura intensity and color
- **Sound packs**: Custom audio on spin result

### 25.4 Emblems / Avatars / Badges

- Tournament badges (rank, season wins, boss kills)
- Profile emblems (shown in lobby)
- Match-end badges (fastest win, most combos, etc.)

### 25.5 Relics

Equippable passive modifiers, 1–3 slots per player:

| Relic | Effect |
|---|---|
| Jackpot Amulet | Jackpot meter charges 25% faster |
| Streak Stone | Streak safety net: absorbs 1 miss |
| Pity Charm | Pity logic triggers 2 spins earlier |
| Combo Crystal | Color combos need 1 fewer match |
| Speed Rune | All cooldowns reduced by 1 spin |
| Near-Hit Gem | Near-hits charge meters as useful hits |
| Boss Ward | Boss attacks have 15% chance to miss you |
| Comeback Talisman | Catch-up assist is +5% stronger |

---

## 26. Meta-Progression

### 26.1 Account Progression

- **Level**: 1–100+ (XP from matches, quests, events)
- **Prestige**: Reset level for cosmetic badge + permanent small perk
- **Mastery**: Mode-specific mastery tracks (Bingo Master, Slot Master, etc.)
- **Seasonal XP**: Separate track feeding Battle Pass and league rank

### 26.2 Mechanic Unlock Progression

| Level | Unlock |
|---|---|
| 1–5 | Tutorial, Classic Tournament |
| 6–10 | Streak system, jackpot balls |
| 11–15 | Dual card mode, boosters |
| 16–20 | Heat meter, Blitz mode |
| 21–30 | Ranked league, Duel mode |
| 31–40 | Boss mode, color combos |
| 41–50 | Multi-card frenzy, Roguelike |
| 51+ | Draft mode, full relic system |

### 26.3 Skill Tree

Three primary branches, each with 10 nodes:

**Jackpot Branch**: Faster meter fill → larger inventory → better ball types → chain jackpot.

**Timing Branch**: Wider zones → forgiveness modifiers → advanced timing modes → dual-bar.

**Defense Branch**: Shields → streak protection → comeback boost → bad luck insurance.

**Combo Branch**: Faster combo meter → better color ball effects → cross-card combos.

**Tournament Branch**: Better catch-up mechanics → rank protection → entry cost reduction.

### 26.4 Card Mastery

Playing with specific card archetypes accumulates mastery XP:
- Mastery Lv 5: unlock visual upgrade for that archetype
- Mastery Lv 10: unlock trait bonus that's always active with that card

### 26.5 Seasonal Structure

- Season length: 8 weeks
- Ranked reset: soft reset (keep 70% of rank progress)
- Season pass: free + premium tracks
- Season-exclusive: cosmetics, relics, card skins
- End-of-season prestige rewards based on peak rank

---

## 27. Economy

### 27.1 Currencies

| Currency | Source | Spend On |
|---|---|---|
| Coins | Match rewards, quests | Lobby entry, boosters, basic packs |
| Gems | IAP, rare quest, achievement | Premium packs, skip queues, special entries |
| Tickets | Daily reward, event pass, achievement | Entry to ticket lobbies |
| Season Tokens | Season pass track | Season shop |
| Event Tokens | Event quests | Event shop |
| Dust | Duplicate cards | Craft cards |
| Relic Cores | Boss drops, achievement | Craft/upgrade relics |
| Ranked Points | Match results | Rank advancement |

### 27.2 Earn Sources

| Source | Primary Currency |
|---|---|
| Match win/place | Coins + XP |
| Daily login | Coins + Tickets |
| Streak login (7-day) | Gems |
| Daily quests | Coins + XP |
| Weekly quests | Gems + Tickets |
| Event quests | Event Tokens |
| Achievements | Gems + cosmetics |
| Season pass (free) | Coins + Tickets + XP |
| Season pass (premium) | Gems + cosmetics + relics |

### 27.3 Craft System

- Collect card fragments (from packs, event rewards, duplicate conversion)
- N fragments → craft specific card rarity
- Relic cores → craft or upgrade relics
- Cosmetic tokens → craft ball/reel skins

---

## 28. Boosters

### 28.1 Match Boosters (activate at match start)

| Booster | Effect | Rarity |
|---|---|---|
| Jackpot Head Start | Jackpot meter starts at 30% | Common |
| Timing Boost | GOOD zone = GREAT for first 10 spins | Common |
| Near-Hit Amplifier | Near-hits charge meters at 2× | Uncommon |
| Line Lock | One chosen line protected from blocking | Uncommon |
| Extra Spin | Gain +3 free spins after match ends (if needed) | Rare |
| Reroll Reserve | Two free rerolls usable during match | Rare |
| Reveal Pack | Shows 5 needed numbers before match starts | Epic |

### 28.2 In-Match Boosters (activate mid-match)

| Booster | Effect |
|---|---|
| Fast Reel | Current reel spins in turbo for 5 spins |
| Number Scout | Reveals next 3 spin outputs (not biased by this) |
| Shield Drop | Instantly shields current near-complete line |
| Hot Zone Pulse | Activates 3 hot cells instantly |
| Combo Surge | Next 3 spins contribute to combo meter |

### 28.3 Meta Boosters (persistent, expire after N matches)

| Booster | Effect |
|---|---|
| XP Boost × 1.5 | All match XP × 1.5 for 10 matches |
| Coin Boost × 1.25 | Coin rewards boosted for 5 matches |
| Lucky Streak | Streak breaker absorbed once per match for 5 matches |

### 28.4 Booster Rarity

Common (available in basic packs) → Uncommon → Rare → Epic (event/boss drops only)

---

## 29. Social Systems

### 29.1 Friend System
- Friend list (max 100)
- Friend 1v1 challenge (casual, no ranked impact)
- Send daily gifts: 1 free booster or coin pack per friend per day
- View friends' recent match results

### 29.2 Clubs / Guilds
- Create or join clubs (max 30 members)
- Club weekly tournaments: aggregate score competition
- Club boss raids: collective boss fight, HP shared
- Club progression: level up club for member perks (XP bonus, coin bonus)
- Club chat

### 29.3 Spectator / Replay
- Watch a friend's match live (if they've enabled it)
- Replay last 3 of your own matches
- Clip sharing: share a 10-second "jackpot moment" as a gif/video

### 29.4 Emotes & Reactions
- 4 quick emotes per match (thumbs up, shocked, fire, gg)
- Opponent can mute your emotes
- No text chat during match (timing-focused)

---

## 30. Retention Systems

### 30.1 Daily Rewards (7-day rotating cycle)
Day 1–6: Coins / Tickets / Boosters (escalating value)
Day 7: Premium reward (Gem pack / Rare card)
Cycle resets — streak bonus multiplier for unbroken 30 days

### 30.2 Quests

| Quest Type | Example | Reward |
|---|---|---|
| Daily | Close 50 cells today | Coins + XP |
| Daily | Win 1 Classic match | Ticket |
| Weekly | Complete 3 boss fights | Gem pack |
| Weekly | Reach 10-streak | Rare booster |
| Event | Play 5 event matches | Event tokens |
| Mastery | Win 10 Duel matches | Duel badge |

### 30.3 Collection Albums
- Complete card sets unlock album rewards
- Theme albums: complete all Halloween cards → bonus cosmetic
- Season albums reset each season

### 30.4 Battle Pass (8-week season)
- Free track: XP rewards, coins, tickets, boosters
- Premium track: All free rewards + exclusive skins, relics, gem packs, collectible cards
- 50 tiers; approximately 1–2 tiers earned per day of active play

### 30.5 Ranked Season Arc
- Players engage with ranked ladder over 8 weeks
- Weekly rank checkpoints: "hold this rank for 5 days for reward"
- End-of-season: exclusive animated card back based on peak rank

---

## 31. Difficulty Layers

### 31.1 New Player Layer (Sessions 1–10)
- Single card only
- 5×3 slot (simpler)
- Only PERFECT/GOOD/MISS zones (no GREAT split)
- No PvP effects in lobby
- Pattern: single line only
- Jackpot tutorial with guided first use

### 31.2 Mid-Game Layer (Sessions 11–40)
- Dual card unlocked
- Heat meter introduced
- Color combo balls appear
- Ranked mode available
- Booster system active
- Pattern variety expands

### 31.3 High-Skill Layer (Sessions 41+)
- Tighter timing windows
- Full PvP modes available
- Boss fights active
- Draft mode
- Full relic system
- Ranked competitive pressure
- Complex event interactions
- Roguelike run

---

## 32. UX / UI Principles

### 32.1 Information Hierarchy (player must always know)
1. What just happened (spin result)
2. What's my next best action (jackpot available? near-win?)
3. How close am I to winning (line progress)
4. Where am I in the race (position indicator)
5. What's currently active (meters, effects)

### 32.2 Visual Hierarchy Rules
- **Spin result**: fullscreen moment of focus — everything else dims
- **Bingo progress**: always visible, never fully obscured by overlays
- **Position indicator**: persistent, small, non-intrusive top-right
- **Jackpot button**: prominent only when jackpot ball is available
- **Meters**: visible but secondary to card and spin result

### 32.3 Animation Principles

| Type | Rule |
|---|---|
| Reel spin | Fast, kinetic, clear stop frame |
| Cell close | Satisfying pop; scale bounce; color fill |
| Line complete | Bright ray effect; brief fanfare |
| Jackpot activate | Cinematic zoom-out; particle explosion |
| Near-miss | Quick flash; no lingering |
| Pressure phase | Ambient pulse only — no interrupting the player |
| Boss attack | Dramatic but short (<1.5s) |

### 32.4 Thumb Zone Design
- SPIN button: always within bottom 20% of screen
- Jackpot/ability buttons: bottom 30%, left/right of SPIN
- Timing bar: above control zone but below card
- Card: top 45% — thumb never needs to reach it during play

### 32.5 Color Language

| Color | Meaning |
|---|---|
| Gold | Jackpot / high value |
| Green | Useful hit / progress |
| Red | Danger / pressure / boss |
| Blue | Defensive / shield / freeze |
| Purple | Wild / special / chaos |
| White/grey | Inactive / available |
| Orange | Heat / overdrive |

---

## 33. Audio Design

### 33.1 Goals
- The slot must feel alive and kinetic
- Useful hits must feel rewarding and distinct
- Jackpot moments must feel cinematic
- The match end must feel resolved (win or loss both land emotionally)

### 33.2 Audio Layers

| Layer | Sound Design Notes |
|---|---|
| Reel spin start | Rising mechanical whir |
| Reel slowdown | Clicking tick getting slower |
| Reel stop | Hard mechanical thunk |
| Useful hit | Bright ascending chime; unique per reel stop variant |
| Near-hit | Softer ping; slightly muted |
| Combo build | Rising tone sequence |
| Jackpot ready | Pulsing golden chime loop |
| Jackpot activate | Full fanfare; sparks SFX |
| Perfect timing | Sharp clean tap sound |
| Streak milestone | Escalating power chord |
| Pressure phase | Low bass pulse; tempo increase in music |
| Line complete | Short fanfare; card FX |
| Boss attack | Impact SFX + ominous tone |
| Victory | Full music sting; positive resolution |
| Defeat | Descending tone; soft resolution |

### 33.3 Music Architecture
- **Lobby**: Casual upbeat loop
- **Match (low tension)**: Mid-energy rhythmic groove
- **Match (building streak)**: Additional instruments layer in
- **Pressure phase**: Tempo +15%, melodic tension
- **Boss fight**: Dedicated boss theme
- **Event modes**: Themed music (e.g., spooky for Halloween event)

---

## 34. RNG & Balance Philosophy

### 34.1 Core RNG Philosophy

The game must not feel:
- Fully deterministic (removes excitement)
- Fully chaotic (removes agency)

Target player perception: **"I have meaningful influence over outcomes but not full control."**

### 34.2 Bias System Architecture

```javascript
function getSpinResult(player) {
  let base = rollBaseRNG(player.numberRange);
  
  let bias = calculateBias({
    neededNumbers:    player.card.getOpenCells(),
    timingQuality:    player.lastTimingResult,   // PERFECT/GREAT/GOOD/MISS
    streakState:      player.streak,
    pityCounter:      player.consecutiveMisses,
    catchupAssist:    player.isLastPlace(),
    modeRules:        currentMatch.mode.biasRules,
    fairnessCap:      0.60  // max bias toward any needed number
  });
  
  return applyBias(base, bias);
}
```

### 34.3 Fairness Caps

| Cap | Value | Purpose |
|---|---|---|
| Max useful bias | 60% | Preserve luck feeling |
| Max miss streak | 8 (with pity) | Prevent rage-quit frustration |
| Max leader advantage | Catch-up activates at +3 position lead | Prevent runaway wins |
| Snowball limit | Streak bonuses cap at streak 20 | Prevent infinite acceleration |
| Near-hit min rate | ≥15% of spins | Always some meter charging |

### 34.4 Readability of Fairness

Player should think:
- "I could have hit that if my timing was better"
- "Unlucky but not broken"
- "I can still come back"
- "That jackpot decision mattered"

Player should NOT think:
- "This is rigged"
- "Timing does nothing"
- "There's no point trying"
- "The leader always wins"

---

## 35. AI / Bot / Async Support

### 35.1 Bot Design Philosophy

Bots fill lobbies when real-player matchmaking can't fill. They must:
- Look like real players (natural timing, occasional misses)
- Scale in skill to match the player's MMR range
- Not be obviously better or worse than a real player

### 35.2 Bot Behavior Model

```
bot_skill_level = player_mmr_estimate ± random_variance(±15%)

per_spin:
  timing_accuracy = normal_distribution(bot_skill_level, variance=0.2)
  result = simulateMatch(timing_accuracy)
  update_bot_progress(result)
  
# Pacing rules:
  - Bots never win too quickly in early matches
  - Bot win rate vs new players: ~30%
  - Bot win rate vs veterans: ~45%
  - Bots occasionally use jackpots (natural-looking decision timing)
```

### 35.3 Async Ghost System

- Daily Challenge mode uses ghost replays of top players' spin sequences
- Bots in async tournaments use historical player session data
- Ghost progress updates at natural-looking pace (not perfectly smooth)

---

## 36. Accessibility

### 36.1 Visual Accessibility
- All important information conveyed in shape + color (never color alone)
- Colorblind modes: Deuteranopia, Protanopia, Tritanopia presets
- Font size: minimum 14pt for all UI text; numbers on card: 18pt minimum
- High contrast mode: background darkens, text/numbers become white

### 36.2 Motor Accessibility
- All tap targets: minimum 44×44pt (Apple HIG standard)
- SPIN button: minimum 80×80pt
- Optional: auto-spin mode (timing bar still runs; tap to confirm)
- Optional: slow timing mode (marker speed 50%)

### 36.3 Cognitive Accessibility
- Layered tutorials — nothing shown until it's relevant
- All system indicators have tooltip on long-press
- Optional "simplified mode" hides advanced meters until player opts in
- Progressive complexity: new systems are introduced one at a time over sessions

---

## 37. Tutorial System

### 37.1 First Session Tutorial

Guided walkthrough (skippable after session 2):
1. "Here's your bingo card — these are numbers you need to mark"
2. "The slot machine generates numbers for you"
3. "Tap SPIN to start"
4. "See this bar? Tap at the right moment to improve your results"
5. "That number matches your card — it's marked!"
6. "Fill a whole line to win!"
7. "You earned a jackpot ball — tap it to mark any cell you want!"
8. "You're in a race — be first to complete the pattern!"

### 37.2 Layered Feature Tutorials

Each new system gets a short in-context tutorial on first encounter:
- Streak system: "You're on a streak! Keep landing useful numbers for big bonuses"
- Dual cards: "You have two cards now. The ball applies to both!"
- Boss mode: "The boss is attacking! Complete your pattern before it overwhelms you"
- Ranked: "Your rank is on the line. Every match counts"
- Draft: "Pick your card, ability, and booster before the match starts"

### 37.3 Smart Hint System

Context-sensitive hints during play (small popup, 2 seconds):
- Jackpot ball available: "You have a jackpot ball! One cell left in that row…"
- Streak about to break: "Miss here and your streak ends — worth using a booster?"
- Pressure phase: "They're one cell away from winning!"
- Near-win: "One more number closes that line"

---

## 38. Content Scalability

The core systems are designed as plug-in layers — new content never requires redesigning the engine.

| Content Axis | How to Add |
|---|---|
| New mode | New match rule config + optional UI overlay |
| New card type | Add archetype definition + trait list |
| New ball type | Add ball class + visual/audio + activation logic |
| New boss | Boss definition: HP, phases, attack list |
| New event | Event config: duration, modifiers, rewards, theme assets |
| New reel theme | Art-only swap; no logic change |
| New season | Content update: pass rewards, rank skins, event schedule |
| New relic | Add relic definition to pool; balance-check passive |
| New PvP modifier | Add to hard-PvP interaction table |

Year 1 content plan example:
- 4 seasons × 2 events each = 8 themed events
- 3 new game modes (Squad, Roguelike, Endless Climb)
- 2 new boss types per quarter
- Weekly rotating Daily Challenge
- Monthly new card archetype

---

## 39. Design Risks

| Risk | Description | Mitigation |
|---|---|---|
| System overload | Too many meters, balls, effects confuse players | Progressive unlock, "simplified mode", strict onboarding |
| Readability loss | Busy screen — player misses what happened | Animation priority system; result always gets fullscreen moment |
| Skill too weak | Timing feels like decoration | Ensure perfects meaningfully increase useful rate (visible data) |
| Skill too strong | Near-deterministic number targeting | Bias cap at 60%; random elements always present |
| Snowball | Early leader is impossible to catch | Catch-up assist, comeback window, pressure phase equalization |
| Toxic PvP | Interference mechanics make losing feel unfair | Hard PvP is opt-in only; soft PvP is default everywhere |
| Match length creep | Marathon and Blackout modes feel too long | Strict timers or spin limits; endgame speed-up mandatory |
| Bot detection | Players notice bots and disengage | Natural behavior model; bots sometimes lose obviously |
| Economy inflation | Too many currencies confuse players | Audit economy quarterly; consider merging currencies |
| Tutorial abandonment | Players skip tutorial and get confused | Make tutorial optional but gate first match behind card explanation |

---

## 40. Feature Ladder & Roadmap

### Foundation (Sessions 1–10)
- [x] 5×5 card
- [x] 5×3 slot
- [x] Timing bar (linear)
- [x] Useful hit / near-hit / miss
- [x] Jackpot meter + jackpot ball
- [x] Streak meter
- [x] Classic Tournament (8 players)
- [x] Single line win pattern
- [x] Bot opponents

### Tactical Depth (Sessions 11–30)
- [ ] Dual card mode
- [ ] Heat meter + hot zones
- [ ] Line targeting ability
- [ ] Color ball combos
- [ ] Booster system
- [ ] Card archetypes (3 types)
- [ ] Prediction ability
- [ ] Relic system (basic)

### Competitive Depth (Sessions 31–60)
- [ ] Ranked league system
- [ ] Duel mode (1v1 PvP)
- [ ] Draft mode
- [ ] Soft PvP interactions
- [ ] Tournament entry types
- [ ] Season pass

### Content Depth (Sessions 61+)
- [ ] Boss mode (3 boss types)
- [ ] Event system (first seasonal event)
- [ ] Roguelike run
- [ ] Multi-card frenzy
- [ ] Collectible cards (rarity system)
- [ ] Social system (friends, clubs)
- [ ] Hard PvP mode (opt-in)

### Endgame & LiveOps
- [ ] Endless climb gauntlet
- [ ] Guild system
- [ ] Community events
- [ ] Replay / spectate
- [ ] Full skill tree
- [ ] Seasonal ranked arcs

---

## 41. Technical Architecture (Phaser 3)

### 41.1 Scene Structure

```
Boot Scene
  → Preload Scene (assets)
  → Main Menu Scene
      → HubScene (lobby, meta navigation)
          → MatchScene (game session)
              → BingoCardComponent
              → SlotMachineComponent  
              → TimingBarComponent
              → HUDComponent
              → BallInventoryComponent
              → MeterBarComponent
          → ResultsScene
      → CollectionScene
      → ShopScene
      → TournamentLobbyScene
      → SettingsScene
```

### 41.2 Core Managers

```
GameManager          — match state, turn flow, win condition check
RNGManager           — base RNG + bias system
SlotManager          — reel simulation, symbol definitions, spin results
BingoCardManager     — card state, cell operations, pattern validation
TimingManager        — bar mechanics, precision zones, result calculation
BallManager          — ball inventory, ball effect execution
MeterManager         — all meters (jackpot, streak, heat, combo, pressure)
StreakManager        — streak tracking, milestone rewards
TournamentManager    — lobby state, leaderboard, position calculation
PlayerManager        — player profile, progression, currency, inventory
BotManager           — AI behavior simulation
AudioManager         — sound playback, music state machine
UIManager            — overlay system, hint system, popup queue
EventManager         — global game event bus
```

### 41.3 Key Data Structures

```typescript
interface BingoCard {
  id: string;
  archetype: CardArchetype;
  cells: Cell[][];   // 5x5 grid
  traits: CardTrait[];
  completedLines: Line[];
}

interface Cell {
  number: number;
  state: CellState;   // OPEN | CLOSED | BLOCKED | CHARGED | HOT | FROZEN | ...
  specialType?: SpecialCellType;
  markedBy?: MarkSource;   // SPIN | JACKPOT | WILD | etc.
}

interface SpinResult {
  baseNumber: number;
  timingQuality: TimingQuality;
  biasApplied: number;
  output: {
    number: number;
    ballType: BallType;
    modifier?: SpinModifier;
    meterCharges: MeterCharge[];
    specialEvent?: SpecialEvent;
  };
}

interface MatchState {
  mode: GameMode;
  players: PlayerMatchState[];
  spinsElapsed: number;
  phase: MatchPhase;   // NORMAL | PRESSURE | LAST_CHANCE | OVERTIME
  winner?: string;
}
```

### 41.4 Phaser Implementation Notes

- **Renderer**: WebGL (Phaser 3 default) with Canvas fallback for older devices
- **Resolution**: 1080×1920 base; scale to device with `ScaleManager.FULL_SCREEN`
- **Card cells**: Phaser `Container` objects with `Text` + `Rectangle` + tween system
- **Slot reels**: `RenderTexture` based strip for smooth scrolling
- **Timing bar**: Phaser `Graphics` + `Tween` for marker position
- **Particles**: Phaser `ParticleEmitter` for ball trails, cell close FX, jackpot explosions
- **State management**: Custom event bus via `Phaser.Events.EventEmitter`
- **Audio**: Phaser `Sound.WebAudioSoundManager`; separate SFX and music channels
- **Network layer**: WebSocket for real-time; REST for meta/profile; offline-capable with localStorage fallback
- **Physics**: Not required — all game logic is state-based, no physics simulation needed
- **Animation**: All via Phaser `Tween` + `AnimationManager`; no Spine required for MVP

### 41.5 Performance Targets

| Target | Value |
|---|---|
| Startup time | < 4s on mid-range Android (2022) |
| Match FPS | Stable 60fps on iPhone 11+ / equivalent Android |
| Asset bundle size | < 30MB initial; lazy-load cosmetics |
| Memory usage | < 300MB peak in match |
| Network latency tolerance | Match playable up to 400ms ping (async fallback at 800ms+) |

---

*End of FULL.md — Game Design Document v1.0*
*Next revision: add detailed economy spreadsheet, onboarding flow wireframes, localization guide*
