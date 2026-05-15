# Teamplay — Frontend Specification & Implementation Plan

> **Depends on:** MVP game loop complete (TODO.md fixes done)  
> **Stack additions:** socket.io-client, no other new dependencies  
> **Key constraint:** The Phaser canvas is not suitable for the leaderboard sidebar — the sidebar is built in HTML/CSS alongside the canvas, not inside Phaser.

---

## 1. Layout Architecture

### 1.1 The Problem

The current game uses `Phaser.Scale.RESIZE` filling 100% of the viewport. The leaderboard sidebar must coexist with it. Embedding a scrollable list of DOM elements inside a Phaser canvas is painful; building it in HTML next to the canvas is clean.

### 1.2 Solution: Side-by-Side DOM + Canvas

The `#game-wrapper` div is restructured into two panels:

```html
<div id="game-wrapper">
  <aside id="leaderboard-panel">
    <!-- DOM leaderboard — rendered by LeaderboardUI.js (vanilla JS) -->
  </aside>
  <div id="canvas-wrapper">
    <!-- Phaser mounts here -->
  </div>
</div>
```

```css
#game-wrapper {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #0D0D1A;
}

#leaderboard-panel {
  width: 260px;
  min-width: 260px;
  height: 100%;
  background: #11112A;
  border-right: 1px solid #2A2A50;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  gap: 8px;
}

#canvas-wrapper {
  flex: 1;
  height: 100%;
  position: relative;
}
```

On mobile (< 600px screen width), `#leaderboard-panel` is hidden by default and replaced with a compact avatar strip inside the Phaser HUD (see §2.3).

```css
@media (max-width: 599px) {
  #leaderboard-panel { display: none; }
  #canvas-wrapper { width: 100%; }
}
```

### 1.3 Phaser Config Change

Because the canvas wrapper is now narrower than the viewport, Phaser needs to know its actual container. The current `main.js` also passes explicit pixel `width`/`height` derived from `window.innerWidth/innerHeight`; with `Scale.RESIZE` and a flex parent, those are wrong (they'd lock the canvas to viewport size, ignoring the sidebar). Drop them — `RESIZE` reads from the parent.

```javascript
// main.js — multiplayer-aware config
const config = {
  type: Phaser.AUTO,
  parent: 'canvas-wrapper',           // was 'game-wrapper'
  backgroundColor: '#0D0D1A',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // width/height removed — RESIZE reads parent's getBoundingClientRect()
  },
  scene: [BootScene, PreloadScene, MenuScene,
          LobbyScene, PrivateRoomScene, JoinRoomScene,
          MatchScene, ResultsScene],
  input: { activePointers: 3 },
};
```

`computeLayout()` in `constants.js` already derives all positions from `scene.scale.width/height`, so the Phaser layout adapts automatically to the narrower canvas. No coordinate changes needed inside Phaser scenes.

---

## 2. Leaderboard Sidebar (DOM)

### 2.1 Structure per Player Row

```html
<div class="lb-row" data-id="bot_023" data-rank="2">
  <span class="lb-rank">2</span>
  <div class="lb-avatar-wrap">
    <img class="lb-avatar" src="/bots/bot_023.jpg" alt="Mia" />
    <span class="lb-avatar-ring lb-ring--bot"></span>
    <!-- ring color: lb-ring--human (blue) | lb-ring--bot (grey) -->
    <span class="lb-badge lb-badge--nearwin hidden">⚡</span>
    <span class="lb-badge lb-badge--won hidden">✓</span>
  </div>
  <div class="lb-info">
    <span class="lb-name">Mia</span>
    <div class="lb-bar-wrap">
      <div class="lb-bar" style="width: 37%"></div> <!-- closedCount/24 -->
    </div>
    <span class="lb-count">9</span>
  </div>
  <!-- shown only when bot departed -->
  <span class="lb-departed hidden">left</span>
</div>
```

### 2.2 LeaderboardUI.js

New file: `src/ui/LeaderboardUI.js` — pure vanilla JS, no Phaser dependency.

```javascript
export class LeaderboardUI {
  constructor(panelEl) {
    this.panel = panelEl;
    this.rows = new Map(); // id → DOM element
    this._header = null;
  }

  init(members) {
    // Build header ("Session · Round 1") and initial rows from room:state
    this._header = document.createElement('div');
    this._header.className = 'lb-header';
    this.panel.appendChild(this._header);

    members.forEach(m => this._addRow(m));
  }

  setRound(n) {
    if (this._header) this._header.textContent = `Round ${n}`;
  }

  update(standings) {
    // standings[] from leaderboard:update event
    // Re-order rows in DOM to match rank, update bars and badges
    standings.forEach(s => {
      const row = this.rows.get(s.id);
      if (!row) return;

      row.dataset.rank = s.rank;
      row.querySelector('.lb-rank').textContent = s.rank;
      row.querySelector('.lb-bar').style.width = `${(s.closedCount / 24) * 100}%`;
      row.querySelector('.lb-count').textContent = s.closedCount;

      row.querySelector('.lb-badge--nearwin').classList.toggle('hidden', !s.isNearWin);
      row.querySelector('.lb-badge--won').classList.toggle('hidden', s.status !== 'won');

      if (s.status === 'departed') this._markDeparted(row);
    });

    // Re-sort DOM rows by rank
    const sorted = standings.slice().sort((a, b) => a.rank - b.rank);
    sorted.forEach(s => {
      const row = this.rows.get(s.id);
      if (row) this.panel.appendChild(row); // move to end of sorted order
    });
  }

  highlightSelf(playerId) {
    const row = this.rows.get(playerId);
    if (row) row.classList.add('lb-row--self');
  }

  _addRow(member) { /* create DOM structure from §2.1 */ }
  _markDeparted(row) { /* grey out, show "left" label */ }

  destroy() { this.panel.innerHTML = ''; this.rows.clear(); }
}
```

### 2.3 Mobile Compact Strip (Phaser HUD)

When screen width < 600 px, the DOM sidebar is hidden. Instead, `MatchScene._buildHUD()` renders a horizontal strip of avatar circles directly in Phaser using `this.add.image()`:

- 8 circular avatar sprites (24 px each), spaced horizontally below the position/timer pills.
- Each circle has a tiny ⚡ overlay graphic when that player's `isNearWin = true`.
- Circle opacity = 0.4 for departed bots.
- Tapping the strip emits `ui:leaderboard-expand`; `MatchScene` shows a temporary full-overlay list (scrollable container of Graphics + Text).

Avatar images are loaded in `PreloadScene` as regular Phaser textures with keys `player-avatar-{id}`.

---

## 3. Network Layer

### 3.1 SocketClient.js

New file: `src/network/SocketClient.js` — singleton wrapping `socket.io-client`.

> **Note:** Socket.io reserves the literal event name `'error'` for transport-level failures. Application errors from the server are sent as `app:error` (see TEAMPLAY_BACKEND.md §7.4) so they don't collide.

```javascript
import { io } from 'socket.io-client';
import { bus } from '../utils/eventBus.js';

let _socket = null;
let _myPlayerId = null;

export function setPlayerId(id) { _myPlayerId = id; }
export function getPlayerId()    { return _myPlayerId; }

export function connect(token) {
  if (_socket?.connected) return _socket;

  _socket = io(import.meta.env.VITE_SERVER_URL, {
    auth: { token },
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ['websocket'],          // skip long-polling fallback
  });

  // Transport-level
  _socket.on('connect',          () => bus.emit('net:connected'));
  _socket.on('disconnect',       () => bus.emit('net:disconnected'));
  _socket.on('connect_error',    e  => bus.emit('net:connect-error', { message: e.message }));

  // Application events
  _socket.on('room:state',       d => bus.emit('net:room-state',     d));
  _socket.on('round:start',      d => bus.emit('net:round-start',    d));
  _socket.on('leaderboard:update', d => bus.emit('net:leaderboard',  d));
  _socket.on('bot:departed',     d => bus.emit('net:bot-departed',   d));
  _socket.on('player:joined',    d => bus.emit('net:player-joined',  d));
  _socket.on('player:left',      d => bus.emit('net:player-left',    d));
  _socket.on('round:end',        d => bus.emit('net:round-end',      d));
  _socket.on('bingo:rejected',   d => bus.emit('net:bingo-rejected', d));
  _socket.on('room:closed',      d => bus.emit('net:room-closed',    d));
  _socket.on('app:error',        d => bus.emit('net:app-error',      d));   // not 'error'

  return _socket;
}

export function emit(event, data) {
  if (!_socket?.connected) { console.warn('Socket not connected'); return; }
  _socket.emit(event, data);
}

export function disconnect() {
  _socket?.disconnect();
  _socket = null;
}

export function getSocket() { return _socket; }
```

The player's own ID is captured during the auth flow (§7) and stored via `setPlayerId(player.id)` so `MatchScene` can pick its seed out of the per-player payload it receives in `round:start`.

Add `.env.development`:
```
VITE_SERVER_URL=http://localhost:3001
```

In production, the same env var points at the deployed server; the client speaks directly to it (no Vite proxy in prod). For local dev, hitting `http://localhost:3001` directly is fine — CORS is configured on the backend (TEAMPLAY_BACKEND.md §3 + §7).

---

## 4. New Scenes

### 4.1 LobbyScene (new)

Replaces the MenuScene "PLAY" button flow for multiplayer. Shown:
- After joining a public room (while waiting for other players / lobby timer)
- Between rounds (after results, while waiting for next round countdown)

Key elements (all drawn in Phaser using Graphics + Text):
- Room type badge ("Public" / "Private · XG9P2K")
- Round indicator ("Round 3" / "Waiting to start")
- Roster list: 8 slots, each showing avatar + name + "(bot)" or "(you)" + "(joining…)" for empty slots
- Lobby countdown bar (fills 10 s between rounds; owner can skip in private rooms)
- [LEAVE] button always visible
- [START] button: visible only for private room owner

> **Bus listener cleanup is mandatory.** Phaser's `shutdown` event fires when a scene is replaced; if listeners are not removed, they continue firing into a destroyed scene and cause null-deref errors. The pattern below applies to **every** new scene that subscribes to bus events.

```javascript
// src/scenes/LobbyScene.js
import { bus } from '../utils/eventBus.js';
import { emit as socketEmit } from '../network/SocketClient.js';

export class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene'); }

  init(data) {
    // Phaser pattern: store init data here, NOT on this.data (which is the data manager)
    this._roomId   = data.roomId;
    this._roomCode = data.roomCode;
    this._roomType = data.roomType;
    this._isOwner  = data.isOwner;
    this._round    = data.round ?? 1;
  }

  create() {
    this._buildUI();
    this._busHandlers = [];
    this._busOn('net:room-state',    this._onRoomState);
    this._busOn('net:player-joined', this._onPlayerJoined);
    this._busOn('net:player-left',   this._onPlayerLeft);
    this._busOn('net:bot-departed',  this._onBotDeparted);
    this._busOn('net:round-start',   this._onRoundStart);
    this._busOn('net:room-closed',   this._onRoomClosed);

    socketEmit('room:join', { roomId: this._roomId });

    this.events.on('shutdown', this.shutdown, this);
  }

  _busOn(event, fn) {
    bus.on(event, fn, this);
    this._busHandlers.push([event, fn]);
  }

  _onRoundStart(data) {
    // data: { roundNumber, cardSeed, startTimestamp } — for THIS player
    this.scene.start('MatchScene', { ...data, roomId: this._roomId });
  }

  shutdown() {
    if (this._busHandlers) {
      this._busHandlers.forEach(([e, fn]) => bus.off(e, fn, this));
      this._busHandlers = null;
    }
  }

  // _buildUI(), _onRoomState(...), _onPlayerJoined(...), etc.
}
```

### 4.2 PrivateRoomScene (new)

Shown when player creates a private room. Derived from LobbyScene but with share-code UI.

Key elements:
- Large room code display with monospace font: "XG9P2K"
- [COPY CODE] button (writes to clipboard)
- [SHARE] button (calls `navigator.share()` with room URL; falls back to clipboard)
- Roster (same as LobbyScene)
- [START] button (owner only, active when ≥ 2 players)
- [CANCEL] button → closes room via REST DELETE, returns to MenuScene

```javascript
// src/scenes/PrivateRoomScene.js
export class PrivateRoomScene extends Phaser.Scene {
  constructor() { super('PrivateRoomScene'); }
  // Extends LobbyScene behavior; adds _buildShareUI()
}
```

### 4.3 JoinRoomScene (new)

Simple code-entry screen for joining a private room via code.

Key elements:
- Text input for 6-char code (DOM `<input>` overlaid on canvas using absolute positioning)
- [JOIN] button
- Error message area ("Room not found", "Room already in progress")
- [BACK] button → MenuScene

Because Phaser's text input support is weak, use a real DOM `<input type="text" maxlength="6">`:
```javascript
// In JoinRoomScene.create():
this._input = document.createElement('input');
this._input.type = 'text';
this._input.maxLength = 6;
this._input.style.cssText = `
  position: absolute;
  left: 50%; top: 45%;
  transform: translate(-50%, -50%);
  width: 200px; height: 60px;
  font-size: 32px; text-align: center;
  text-transform: uppercase;
  background: #1E1E3A; color: #F0F0FF;
  border: 2px solid #3A3A60; border-radius: 8px;
`;
document.getElementById('canvas-wrapper').appendChild(this._input);
this._input.focus();
```
Remove the input in `shutdown()`.

---

## 5. MatchScene Changes

### 5.1 Initialization with Server Data

`MatchScene.init(data)` receives data forwarded from LobbyScene's `net:round-start` handler:
```javascript
// data:
{
  roomId,         // string — server-issued room id
  roundNumber,    // 1-indexed within session
  cardSeed,       // integer — THIS player's card seed (per TEAMPLAY_SPEC §4.2)
  startTimestamp, // epoch ms — wall-clock countdown anchor
}
```

Store init data in `init()` (not `create()`) and use `cardSeed` to seed the RNG. The wall-clock anchor is used to compute the remaining countdown locally so all clients see the same "Match Starting in N…" number even if they joined the scene at slightly different times.

```javascript
// MatchScene.js
init(data) {
  this._roomId         = data?.roomId ?? null;
  this._roundNumber    = data?.roundNumber ?? 1;
  this._cardSeed       = data?.cardSeed ?? Date.now();
  this._startTimestamp = data?.startTimestamp ?? null;
  this._isMultiplayer  = Boolean(this._roomId);
}

create() {
  // ...
  this.rngManager = new RNGManager(this._cardSeed);
  // ...
}
```

### 5.2 Reporting Spin Results

After each resolved spin, emit to server (fire-and-forget, no await):
```javascript
// In _onSlotComplete(), after resolving hit/miss:
import { emit as socketEmit } from '../network/SocketClient.js';

socketEmit('game:spin-result', {
  roomId: this._roomId,
  spinNumber: number,
  zone,
  hitCell: closeResult ? { col: closeResult.col, row: closeResult.row } : null,
  nearHit: Boolean(nearHit),
});
```

### 5.3 Reporting Jackpot Usage

```javascript
// In _useJackpotBall():
socketEmit('game:jackpot-use', { roomId: this._roomId, col, row });
```

### 5.4 BINGO Claim

The local UI shows BINGO immediately on detection (optimistic), then sends the claim and includes the spinLog. The `net:bingo-rejected` listener is registered **once in `create()`** (alongside the other bus listeners) — never inside `_endMatch()`, otherwise re-runs would stack listeners across rounds.

```javascript
// In _endMatch() when winner === 'player':
import { emit as socketEmit, getPlayerId } from '../network/SocketClient.js';

if (this._isMultiplayer) {
  socketEmit('game:bingo-claim', {
    roomId: this._roomId,
    cardState: this.cardManager.exportState(),
    spinHistory: this.spinLog,
  });
}
```

Listener registered once during scene setup:
```javascript
this._busOn('net:bingo-rejected', ({ reason }) => {
  console.error('BINGO rejected:', reason);
  // Hide BINGO overlay, show non-blocking error toast, resume game
});
```

Add `BingoCardManager.exportState()`:
```javascript
exportState() {
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => this.closed.has(this._key(c, r)))
  );
}
```

The `spinLog` already exists in `MatchScene` (currently used only for the debug overlay). Each entry needs the `hitCell` field for server validation — extend the existing pushes:
```javascript
this.spinLog.push({
  zone, hit: true, spinNumber: number,
  hitCell: { col: closeResult.col, row: closeResult.row },
});
// And for misses / near-misses:
this.spinLog.push({ zone, hit: false, spinNumber: number, hitCell: null, nearHit: true });
```

### 5.5 Handling Round End from Server

The server's `round:end` is the authoritative end signal — for player wins, bot wins, and timeouts. The handler must distinguish "I'm the winner (already showing local BINGO)" from "someone else won (show their notice)":

```javascript
// Registered once in create()
this._busOn('net:round-end', (data) => {
  if (this.stateMachine.isMatchEnd()) {
    // Local end already triggered (we won); just navigate to results
    this._navigateToResults(data);
    return;
  }
  const myId = getPlayerId();
  if (data.winnerId === myId) {
    // We won but somehow haven't ended locally yet — trigger BINGO animation
    this._endMatch('player', data);
  } else {
    // Someone else won
    const winnerEntry = data.results.find(r => r.rank === 1);
    this._endMatch('other', { name: winnerEntry?.name ?? 'A player', data });
  }
});
```

In multiplayer mode, the local `BotManager` is **not constructed** — bots live on the server:
```javascript
// MatchScene.create():
this.botManager = this._isMultiplayer
  ? null
  : new BotManager(this, Date.now() + 999);
```

Guard every `this.botManager.*` call with `if (this.botManager)`. In multiplayer, `_endMatch()` accepts a generic non-player winner via `winner === 'other'` (bot or human) instead of the existing `winner === 'bot'` branch — the result data comes from the server payload, not local state.

### 5.6 Leaderboard Update in Phaser HUD (mobile)

```javascript
// Registered once in create() (mobile path):
if (window.innerWidth < 600) {
  this._busOn('net:leaderboard', ({ standings }) => {
    this._updateMobileAvatarStrip(standings);
  });
}
```

The desktop path is handled by `LeaderboardUI` (DOM), which is mounted by the parent app shell, not by `MatchScene`. See §5.7.

### 5.7 LeaderboardUI Lifecycle

`LeaderboardUI` is a **single instance** owned outside Phaser (created in `main.js` after DOM is ready) so the same DOM rows survive scene transitions Lobby → Match → Results. Each scene that needs to show the leaderboard subscribes to `net:room-state` / `net:leaderboard` to populate it; on shutdown they unsubscribe but do not destroy the UI.

```javascript
// main.js (after Phaser config):
import { LeaderboardUI } from './ui/LeaderboardUI.js';
const lbPanel = document.getElementById('leaderboard-panel');
window._leaderboardUI = new LeaderboardUI(lbPanel);

// SocketClient bus events feed it directly:
bus.on('net:room-state',  d => window._leaderboardUI.init(d.standings ?? []));
bus.on('net:leaderboard', d => window._leaderboardUI.update(d.standings));
bus.on('net:bot-departed', d => window._leaderboardUI.markDeparted(d.botId));
bus.on('net:room-closed', () => window._leaderboardUI.destroy());
```

---

## 6. ResultsScene Changes

### 6.1 Extended Results Data

The server `round:end` event replaces `_buildMatchResults()` for room rankings. The local stats (cells closed, best streak, jackpots used) are still computed client-side. The two are merged before transitioning to ResultsScene.

```javascript
// MatchScene._navigateToResults(serverData):
this.scene.start('ResultsScene', {
  ...serverData,                            // results[], roundNumber, sessionBonuses[], winnerId, winnerBotId
  playerStats: this._buildMatchResults(),   // local stats
  roomId: this._roomId,
  isMultiplayer: this._isMultiplayer,
});
```

### 6.2 Full Room Rankings Panel

In multiplayer ResultsScene, add a room rankings section above the player stat breakdown:

```
┌──────────────────────────────────────┐
│  ROUND 3 RESULTS                     │
│                                      │
│  #1  🥇 Mia (bot)      +150 🪙       │
│  #2  🥈 You            +350 🪙       │
│  #3     Drew (bot)     +150 🪙       │
│  ...                                 │
│  ─────────────────────────────────── │
│  YOUR STATS                          │
│  💰 Coins earned   350               │
│  ⬜ Cells closed   18/24             │
│  🔥 Best streak    6                 │
│  ★  Jackpots used  1                 │
│  ─────────────────────────────────── │
│  SESSION BONUS: Longest Streak +100  │
│  ─────────────────────────────────── │
│  [LEAVE]         [STAY  9s]          │
└──────────────────────────────────────┘
```

### 6.3 Stay / Leave Buttons with Countdown

Use `init(data)` to capture the scene's payload — never `this.data`, which is Phaser's per-scene data manager (a `DataManager` instance, not the init payload).

```javascript
// ResultsScene.js
import { emit as socketEmit, disconnect } from '../network/SocketClient.js';

init(data) {
  this._roomId        = data?.roomId ?? null;
  this._roundNumber   = data?.roundNumber ?? 1;
  this._isMultiplayer = Boolean(data?.isMultiplayer);
  this._roundEndData  = data;
}

create() {
  // ... build panels using this._roundEndData ...
  if (this._isMultiplayer) this._buildStayLeaveCountdown();
}

_buildStayLeaveCountdown() {
  let remaining = 10;
  const stayLabel = this.add.text(/* … */, `STAY  ${remaining}s`, /* … */);

  this._countdown = this.time.addEvent({
    delay: 1000, loop: true,
    callback: () => {
      remaining--;
      if (stayLabel.active) stayLabel.setText(`STAY  ${remaining}s`);
      if (remaining <= 0) { this._countdown.remove(); this._doStay(); }
    },
  });

  // stayBtn.on('pointerdown', () => { this._countdown.remove(); this._doStay(); });
  // leaveBtn.on('pointerdown', () => { this._countdown.remove(); this._doLeave(); });
}

_doStay() {
  socketEmit('round:stay', { roomId: this._roomId });
  this.scene.start('LobbyScene', {
    roomId: this._roomId,
    round: this._roundNumber + 1,
    // roomCode/roomType/isOwner re-supplied via the upcoming room:state
  });
}

_doLeave() {
  socketEmit('round:leave', { roomId: this._roomId });
  disconnect();
  this.scene.start('MenuScene');
}

shutdown() {
  if (this._countdown) this._countdown.remove();
}
```

---

## 7. MenuScene Changes

Add three new buttons below PLAY:

```
[  PLAY  ]              → public room (auto-join)
[  PRIVATE ROOM  ]      → PrivateRoomScene (create)
[  JOIN ROOM  ]         → JoinRoomScene (enter code)
```

Auth gate: clicking any multiplayer button checks for a stored token + player ID. If none exists, show a quick "Choose a username" overlay (DOM), call `POST /api/v1/auth/guest`, persist both the token and the player object, then proceed.

```javascript
// src/auth/AuthGate.js
import { promptUsername } from '../ui/AuthOverlay.js';
import { setPlayerId } from '../network/SocketClient.js';

const TOKEN_KEY  = 'slingo_token';
const PLAYER_KEY = 'slingo_player';

export async function ensureAuth() {
  const token  = localStorage.getItem(TOKEN_KEY);
  const player = JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
  if (token && player) {
    setPlayerId(player.id);
    return { token, player };
  }

  const username = await promptUsername();
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/v1/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Auth failed');
  const { token: newToken, player: newPlayer } = await res.json();
  localStorage.setItem(TOKEN_KEY, newToken);
  localStorage.setItem(PLAYER_KEY, JSON.stringify(newPlayer));
  setPlayerId(newPlayer.id);
  return { token: newToken, player: newPlayer };
}
```

Each multiplayer button calls `ensureAuth()` then `connect(token)` then routes to the appropriate scene:
```javascript
// MenuScene
playPublicBtn.on('pointerdown', async () => {
  const { token } = await ensureAuth();
  connect(token);
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/v1/rooms/public/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { roomId } = await res.json();
  this.scene.start('LobbyScene', { roomId, roomType: 'public', isOwner: false });
});
```

---

## 8. Offline / Solo Fallback

The plain [PLAY] button can still work offline (solo vs bots) using the existing client-side BotManager. If the server is unreachable at connect time, show a toast: "Server unavailable — playing solo" and fall through to the existing MatchScene creation with `data = null`.

Detect: wrap socket `connect` in a 5-second timeout; if not connected, fall back to solo.

---

## 9. New Files Summary

| File | Purpose |
|---|---|
| `src/network/SocketClient.js` | Socket.io singleton, routes events to bus, holds player ID |
| `src/auth/AuthGate.js` | `ensureAuth()` — token + player persistence, guest creation |
| `src/ui/LeaderboardUI.js` | DOM leaderboard sidebar component |
| `src/ui/AuthOverlay.js` | DOM overlay for username picker (`promptUsername()`) |
| `src/scenes/LobbyScene.js` | Waiting room between rounds |
| `src/scenes/PrivateRoomScene.js` | Private room creation + share UI |
| `src/scenes/JoinRoomScene.js` | Enter room code to join |

Modified files:
- `index.html` — restructure `#game-wrapper` into sidebar + canvas-wrapper
- `src/main.js` — Phaser `parent: 'canvas-wrapper'`; register new scenes
- `src/scenes/MenuScene.js` — add 3 buttons, auth gate
- `src/scenes/MatchScene.js` — socket integration, multiplayer guards
- `src/scenes/ResultsScene.js` — full room results, Stay/Leave countdown
- `src/managers/BingoCardManager.js` — add `exportState()`
- `src/constants.js` — no changes needed (layout derives from canvas size)

---

## 10. Implementation Plan

### Phase 1 — Layout restructure (day 1)
- [ ] Update `index.html`: split `#game-wrapper` → `#leaderboard-panel` + `#canvas-wrapper`
- [ ] Add CSS for sidebar (desktop) and `@media (max-width: 599px)` hide rule
- [ ] Change Phaser `parent` to `canvas-wrapper`
- [ ] Verify existing game renders correctly in narrower canvas (no coordinate hardcoding should exist)
- [ ] Add stub `#leaderboard-panel` content ("Leaderboard coming soon") to confirm layout

### Phase 2 — Network layer (days 2–3)
- [ ] `npm install socket.io-client` in client
- [ ] `src/network/SocketClient.js` — connect, emit, bus bridging
- [ ] `.env.development` with `VITE_SERVER_URL`
- [ ] `vite.config.js` proxy for `/socket.io`
- [ ] `src/ui/AuthOverlay.js` — username prompt, guest auth call
- [ ] Test: connect to backend Phase 1 server, receive `room:state`

### Phase 3 — LobbyScene and new menu flow (days 4–6)
- [ ] `src/scenes/LobbyScene.js` — roster display, countdown, leave button
- [ ] `src/scenes/PrivateRoomScene.js` — code display, share, start button
- [ ] `src/scenes/JoinRoomScene.js` — DOM input, join by code
- [ ] Register new scenes in `main.js`
- [ ] MenuScene: add 3 new buttons, auth gate, route to appropriate scene
- [ ] Test: two browser tabs join same public room, see each other in roster

### Phase 4 — MatchScene multiplayer integration (days 7–10)
- [ ] Accept `cardSeed` + `startTimestamp` from server in `create(data)`
- [ ] Guard `BotManager` construction behind `isMultiplayer` flag
- [ ] Emit `game:spin-result` after each resolved spin
- [ ] Emit `game:jackpot-use` on jackpot cell selection
- [ ] Emit `game:bingo-claim` on player win; handle `bingo:rejected`
- [ ] Handle `net:round-end` for bot/other-player BINGO
- [ ] Mobile avatar strip in HUD (Phaser images, `net:leaderboard` updates)
- [ ] Test: full round with 1 human + 7 server bots; both win paths work

### Phase 5 — LeaderboardUI sidebar (days 11–13)
- [ ] `src/ui/LeaderboardUI.js` — init, update, departed, highlight self
- [ ] Mount in `LobbyScene` and `MatchScene` (both phases need the sidebar)
- [ ] Subscribe to `net:leaderboard` bus event
- [ ] CSS polish: avatar rings, near-win pulse animation, departed grey
- [ ] Test: leaderboard updates every 2 s during round; near-win ⚡ appears correctly

### Phase 6 — ResultsScene and multi-round flow (days 14–16)
- [ ] Extended ResultsScene: full room rankings table
- [ ] Stay/Leave buttons with 10-second countdown bar
- [ ] Session bonuses display
- [ ] `_doStay()` → LobbyScene; `_doLeave()` → MenuScene
- [ ] Test: play 3 rounds, stay after each; bot departures reflected in lobby

### Phase 7 — Polish and fallback (days 17–18)
- [ ] Offline solo fallback: detect server unreachable, toast + solo mode
- [ ] Reconnect handling: on socket reconnect, re-emit `room:join` and restore state
- [ ] `room:closed` handling: graceful message + return to menu
- [ ] `net:error` display: non-intrusive toast (DOM overlay, auto-dismiss 3 s)
- [ ] Accessibility: leaderboard has `role="list"`, avatar `alt` text
- [ ] Test on real iOS Safari and Android Chrome with sidebar layout

---

*End of TEAMPLAY_FRONTEND.md*
