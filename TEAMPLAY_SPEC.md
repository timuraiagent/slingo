# Teamplay — Global Feature Specification

> **Feature name:** Teamplay / Multiplayer Rooms  
> **Depends on:** MVP.md v1.1 (single-player game loop must be complete)  
> **Goal:** Add persistent rooms where real players and bots share a leaderboard across multiple rounds.

---

## 1. Mental Model

The unit of play shifts from a single match to a **session** — a persistent room that runs rounds back-to-back. Players stay in the same room between rounds, watch a shared leaderboard fill up, and choose each time whether to keep playing or leave. Bots feel like real players: they have faces and names, they make progress on screen, and they drift away as the session goes long.

```
Session lifecycle
─────────────────
Public room    → auto-filled with bots + queued humans
Private room   → owner shares code; no bots; owner presses START

Within a session
────────────────
LOBBY (waiting) → ROUND (playing) → RESULTS (10 s) ─┐
       ↑                                              │ stay
       └──────────────────────────────────────────────┘
                                     │ leave
                                     ↓
                                  MENU
```

---

## 2. Room Types

### 2.1 Public Room
- Capacity: **8 player slots** (matching MVP §8.1).
- When a human queues for a public match, the server finds an open room (status `waiting`, has free slot) or creates one.
- The room is **provisioned with bots immediately** to fill all empty slots from the **Bot Profile Pool** (§5).
- While the room is `waiting`, additional humans who join **displace a bot** one-for-one (the displaced bot is returned to the pool, not made to "leave").
- **Lobby timer:** a 15-second timer starts when the room is created. The round begins when:
  - the timer reaches 0 (round always starts after 15 s regardless of human count), **or**
  - the room reaches capacity (all 8 slots filled with humans), in which case the timer is cancelled and the round starts after a 3-second countdown.

### 2.2 Private Room
- Owner creates a room, receives a **6-character alphanumeric code** (e.g., `XG9P2K`).
- Share as a URL: `https://app.example.com/room/XG9P2K`
- **No bots are assigned** to private rooms.
- Any human can join via the code at any time while the room is `waiting`.
- Owner sees a **[START]** button that becomes active when ≥ 2 players are present.
- Owner can start at any size (2–8); empty slots are not filled.
- Private rooms have no lobby timer — they wait indefinitely.

---

## 3. Player Types

### 3.1 Human Players
- Authenticated (registered account) or guest (assigned a temp ID for the session).
- Persistent coins tied to account; guest coins reset on browser clear.
- Avatar: account profile picture or generated avatar (initials-based default).

### 3.2 Bots
- Drawn from a pre-generated **Bot Profile Pool** of 50 profiles (§5).
- Each profile has: name, skill rating, spin-interval range, AI-generated portrait image.
- Within a session, a bot's `departureRound` is rolled at room creation (uniform random from range defined per difficulty tier — see §5.2).
- Bots do not authenticate; their state lives entirely on the server.
- Bots do not use Jackpot balls (MVP §8.2 rule preserved).

---

## 4. Round Lifecycle

### 4.1 Phases

| Phase | Duration | What happens |
|---|---|---|
| LOBBY | Until start condition met | Room roster visible; humans can join |
| COUNTDOWN | 3 s | "Match Starting in 3…" overlay (same as MVP) |
| ROUND | Until first BINGO or 5 min | All players play simultaneously |
| RESULTS | 10 s auto-advance | Results screen with Stay/Leave |
| (repeat) | — | Next round begins if ≥ 2 humans remain |

### 4.2 Round Start Synchronization
- Server emits `round:start` to each client **individually** (not room-broadcast) so the card seed is private:
  - `roundNumber` — 1-indexed within session
  - `cardSeed` — integer; only this player's seed (others' seeds remain server-side)
  - `startTimestamp` — epoch ms; all clients start their 3-second countdown at the same wall-clock time
- Clients regenerate their card from `cardSeed` using the seeded RNG already in the codebase (`SeededRandom` + `generateCard()`).
- Bot cards are generated and tracked **server-side only** — clients do not need bot seeds.

### 4.3 Round End
- **BINGO claim**: client emits `game:bingo-claim` with full spin history.
- Server validates claim (see TEAMPLAY_BACKEND.md §4) and broadcasts `round:end` to the room.
- Server computes final positions by sorting all players' cell-close counts + line progress at end time.
- Bot progress at round end is computed server-side from simulation state.

### 4.4 Results Phase
- Results screen (extended MVP ResultsScene) shows:
  - Final rankings for the entire room (all 8 slots)
  - Coins earned per player (humans and bots both shown for authenticity)
  - Player's own stat breakdown (cells closed, best streak, jackpots used)
- **[STAY]** and **[LEAVE]** buttons.
- Default: **STAY** with a visible 10-second countdown bar.
- If player takes no action, they automatically stay.
- Pressing LEAVE returns to MenuScene; pressing STAY waits for next round.

### 4.5 Between-Round Lobby
- After results, staying players see the lobby screen again with updated roster.
- Departed bots are shown as greyed-out with "Left the session" label.
- Round number increments.
- If fewer than 2 humans remain (others left), the session closes: "All players left — session ended."
- A 10-second countdown before next round starts (owner can skip in private rooms).

---

## 5. Bot Profile Pool

### 5.1 Pool Spec
- 50 pre-generated profiles stored as JSON on the server.
- Each profile:
  ```json
  {
    "id": "bot_023",
    "name": "Mia",
    "avatarUrl": "/bots/bot_023.jpg",
    "tier": "medium",
    "skill": 0.44,
    "spinInterval": [1200, 2000],
    "departureRoundRange": [10, 18]
  }
  ```
- Pool split: 20 Easy (skill 0.30–0.40, departs rounds 8–14), 22 Medium (0.40–0.50, rounds 12–20), 8 Hard (0.50–0.55, rounds 16–30+).
- Bot portraits: 512×512 px JPEG, photorealistic or illustrated — commissioned once (see TEAMPLAY_BACKEND.md §7).

### 5.2 Bot Departure
- At room creation, each assigned bot rolls a random `departureRound` from its tier's `departureRoundRange`.
- The bot **plays through** their `departureRound`-th round normally (so they appear in that round's results).
- After that round's `round:end` is emitted, the server marks the bot `departed` and emits `bot:departed`.
- From that point onwards:
  - Their leaderboard row is greyed out and shows "left".
  - They do not participate in any subsequent round.
  - Their slot is **not refilled** in public rooms (the room thins out naturally over a long session).
- Hard bots linger longest, preserving competitive tension deep into a session.

---

## 6. Leaderboard Sidebar

### 6.1 Layout
The leaderboard is a **fixed left panel** visible at all times during LOBBY, ROUND, and RESULTS phases.

```
[Session: Round 4]

#1  [👤] You          ████░░ 9
#2  [🤖] Mia          ███░░░ 7
#3  [🤖] Drew  ⚡      ██████ — BINGO!
#4  [👤] Carlos       ███░░░ 6
#5  [🤖] Alex         ██░░░░ 4
#6  [🤖] Jordan       █░░░░░ 3
#7  [🤖] Sam    left  ░░░░░░ —
#8  [🤖] Riley        ░░░░░░ 2
```

Each row contains:
- Rank number
- Avatar circle (48 px, with thin colored ring: blue = human, grey = bot)
- Name (truncated to 12 chars)
- Status badge:
  - ⚡ pulsing amber = ONE AWAY (4/5 cells in a line)
  - ✓ = won this round
  - `left` = departed bot (greyed entire row)
- Mini progress bar (cells closed / 24)
- Cells closed count

### 6.2 Update Frequency
- Server broadcasts `leaderboard:update` every **2 seconds** during an active round.
- The player's own row updates in real-time from local game state (no wait for server).

### 6.3 Mobile Behavior
On screens narrower than 600 px (most phones in portrait):
- Leaderboard collapses to a **compact avatar strip** at the very top of the HUD (below the safe area).
- One small circle (24 px) per active slot — count starts at 8 and decreases as bots depart.
- Circles ordered by current rank (best → worst).
- ⚡ badge overlaid on circles of near-win players.
- Departed bots' circles are removed from the strip after their `bot:departed` event arrives.
- Tap the strip → full leaderboard slides up as a half-screen overlay.
- Overlay auto-dismisses when player taps the game area.

---

## 7. Private Room Flow

```
MenuScene → [Create Private Room]
         → PrivateRoomScene
              - Shows room code "XG9P2K" + copy button
              - Share URL button (Web Share API)
              - Roster fills as friends join
              - [START] button (active when ≥ 2 players)
              - Owner can cancel → back to menu
```

```
MenuScene → [Join Private Room]
         → Enter 6-char code input
         → Success: join PrivateRoomScene (non-owner view, no START button)
         → Error: "Room not found" or "Room already started"
```

---

## 8. Account System (minimal)

For Teamplay, a lightweight account is needed to persist coins and show a consistent identity in the leaderboard.

| Scenario | What happens |
|---|---|
| New visitor | Prompted to pick a username (guest mode — no password) |
| Returning guest | Token in localStorage re-authenticates them |
| Registered user | Email + password; profile persisted server-side |
| No action | Guest account created automatically with a random name |

Coins earned in each round are written to the server account. Local localStorage remains as a fallback cache.

---

## 9. Coin Economy Changes

### 9.1 Session Bonus
In addition to per-round rewards (MVP §12 table), session bonuses are awarded **at the moment the player leaves the session** (presses LEAVE on results, or is the last to remain when the room closes). Bonuses are summed and shown on the next results screen the player sees, then immediately credited:
- Most rounds won in the session (≥ 1): +500 coins
- Best streak ≥ 5 across any round: +100 coins per 5 streak (e.g., streak 11 → +200)
- Last human standing (room closed because everyone else left): +200 coins

A player who stays through every round of a long session sees session bonuses only when they finally leave.

### 9.2 Bot Payouts
Bots "earn" coins shown on the results screen (for immersion). These are display-only — no real accounting.

---

## 10. Out of Scope for Teamplay v1

| Feature | Reason |
|---|---|
| Spectator mode | Adds complexity, defer |
| Chat / emotes | Moderation burden |
| Ranked MMR | Needs matchmaking pool data first |
| Real-time typing / interference | Post-MVP per original spec |
| In-room purchases | Economy not designed yet |
| Replay | No recording infrastructure |
| Cross-platform push notifications | Mobile app not built |

---

*End of TEAMPLAY_SPEC.md*
