# Teamplay — Backend Specification & Implementation Plan

> **Stack:** Python 3.12 · FastAPI · python-socketio (ASGI) · asyncpg · PostgreSQL 16  
> **Note:** The frontend uses `socket.io-client`, so the backend uses `python-socketio` which speaks the Socket.io protocol over WebSocket.  
> **Deployment target:** Single VPS (uvicorn) for v1. Redis pub/sub + multiple workers for v2.

---

## 1. Project Structure

> **Critical naming note:** Python's standard library has a top-level `socket` module. A package named `socket/` in the project root **shadows the stdlib import** and breaks anything that does `import socket` (asyncpg, uvicorn, python-socketio itself, …). The package is therefore named `realtime/`.  
> Likewise, `utils/jwt.py` would shadow the `jwt` namespace from `python-jose`. The token helper lives at `utils/tokens.py`.

```
server/
├── main.py                  ASGI app — mounts FastAPI + Socket.io
├── config.py                Settings via pydantic-settings (reads .env)
├── requirements.txt
├── .env.example
├── db/
│   ├── pool.py              asyncpg connection pool
│   └── migrations/          001_accounts.sql … 005_round_results.sql
├── routes/
│   ├── __init__.py
│   ├── auth.py              /api/v1/auth/*
│   ├── rooms.py             /api/v1/rooms/*
│   └── profile.py           /api/v1/profile/*
├── realtime/                (NOT named 'socket' — would shadow stdlib)
│   ├── __init__.py
│   ├── server.py            socketio.AsyncServer instance
│   ├── auth.py              connect handler — JWT verify
│   ├── room_handlers.py     room:join, room:leave, room:start, round:stay/leave
│   └── game_handlers.py     game:spin-result, game:bingo-claim, game:jackpot-use
├── services/
│   ├── __init__.py
│   ├── room_service.py      Room CRUD, bot assignment, lifecycle
│   ├── bot_service.py       Bot simulation — asyncio tasks per bot
│   ├── game_service.py      BINGO validation, position calculation
│   ├── account_service.py   Coin persistence, guest creation
│   └── leaderboard_service.py  Standings aggregation + broadcast loop
├── data/
│   ├── bot_profiles.json    50 bot profiles (pool)
│   └── bot_avatars/         bot_001.jpg … bot_050.jpg
└── utils/
    ├── __init__.py
    ├── tokens.py            create_token(), decode_token() — uses python-jose
    ├── seeded_random.py     SeededRandom — bit-identical to client mulberry32
    ├── card_layouts.py      generate_card(), get_all_lines(), get_near_win_lines()
    └── room_code.py         generate_code(), validate_code()
```

---

## 2. Dependencies (requirements.txt)

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-socketio==5.11.0
asyncpg==0.29.0
pydantic==2.7.0
pydantic-settings==2.3.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
slowapi==0.1.9            # rate limit on auth routes
```

---

## 3. App Entry Point (main.py)

```python
import socketio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from realtime.server import sio
import realtime.auth          # registers connect/disconnect
import realtime.room_handlers # registers room:* handlers
import realtime.game_handlers # registers game:* handlers
from routes import auth, rooms, profile
from db.pool import init_pool, close_pool
from config import settings

# ----- FastAPI for REST -----
app = FastAPI(title="Slingo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=False,                  # we use Bearer tokens, not cookies
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def _startup():  await init_pool()

@app.on_event("shutdown")
async def _shutdown(): await close_pool()

app.include_router(auth.router,    prefix="/api/v1/auth")
app.include_router(rooms.router,   prefix="/api/v1/rooms")
app.include_router(profile.router, prefix="/api/v1/profile")
app.mount("/bots", StaticFiles(directory="data/bot_avatars"), name="bot_avatars")

# ----- Wrap with Socket.io -----
asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)
# Run with: uvicorn main:asgi_app --host 0.0.0.0 --port 3001
```

---

## 4. Configuration (config.py)

Pydantic v2 + pydantic-settings v2 — `class Config` is the v1 style. Use `model_config = SettingsConfigDict(...)`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url:     str
    jwt_secret:       str
    jwt_expires_days: int  = 7
    cors_origin:      str  = "http://localhost:5173"
    redis_url:        str | None = None
    max_rooms:        int  = 500
    bot_pool_size:    int  = 50

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
```

`.env.example`:
```
DATABASE_URL=postgres://user:pass@localhost:5432/slingo
JWT_SECRET=change-me-in-production
JWT_EXPIRES_DAYS=7
CORS_ORIGIN=http://localhost:5173
```

---

## 5. Database Schema

```sql
-- migrations/001_accounts.sql
CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(32) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  is_guest      BOOLEAN NOT NULL DEFAULT TRUE,
  coins         BIGINT NOT NULL DEFAULT 0,
  avatar_url    VARCHAR(512),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrations/002_rooms.sql
CREATE TABLE rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          CHAR(6) UNIQUE,
  type          VARCHAR(8)  NOT NULL CHECK (type IN ('public','private')),
  status        VARCHAR(16) NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting','in_progress','between_rounds','closed')),
  capacity      SMALLINT NOT NULL DEFAULT 8,
  current_round SMALLINT NOT NULL DEFAULT 0,
  owner_id      UUID REFERENCES players(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ
);
CREATE INDEX idx_rooms_open ON rooms(status) WHERE status <> 'closed';

-- migrations/003_room_members.sql
CREATE TABLE room_members (
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at   TIMESTAMPTZ,
  status    VARCHAR(12) NOT NULL DEFAULT 'active'
              CHECK (status IN ('active','left')),
  PRIMARY KEY (room_id, player_id)
);

-- migrations/004_rounds.sql
CREATE TABLE rounds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES rooms(id),
  round_number  SMALLINT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  winner_id     UUID REFERENCES players(id),
  winner_bot_id VARCHAR(32),
  UNIQUE (room_id, round_number)
);

-- migrations/005_round_results.sql
CREATE TABLE round_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id       UUID NOT NULL REFERENCES rounds(id),
  player_id      UUID REFERENCES players(id),
  bot_profile_id VARCHAR(32),
  position       SMALLINT NOT NULL,
  coins_earned   INTEGER NOT NULL DEFAULT 0,
  cells_closed   SMALLINT NOT NULL DEFAULT 0,
  best_streak    SMALLINT NOT NULL DEFAULT 0,
  jackpots_used  SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT one_subject CHECK (
    (player_id IS NOT NULL) <> (bot_profile_id IS NOT NULL)
  )
);
```

---

## 6. REST API

### 6.1 Auth (routes/auth.py)

The frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on REST calls and via `auth: { token }` on Socket.io handshakes. **Cookies are not used** — `samesite=strict` won't survive cross-origin (Vite dev server on :5173 → API on :3001), and `samesite=none; secure=true` requires HTTPS even in dev. Sticking to header bearer is simpler and consistent.

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from services.account_service import AccountService
from utils.tokens import create_token

router = APIRouter()

class GuestIn(BaseModel):
    username: str | None = None

class RegisterIn(BaseModel):
    username: str
    email:    EmailStr
    password: str

class LoginIn(BaseModel):
    email:    EmailStr
    password: str

@router.post("/guest")
async def guest(body: GuestIn):
    player = await AccountService.create_guest(body.username)
    return {"player": player, "token": create_token(player["id"])}

@router.post("/register")
async def register(body: RegisterIn):
    player = await AccountService.register(body.username, body.email, body.password)
    return {"player": player, "token": create_token(player["id"])}

@router.post("/login")
async def login(body: LoginIn):
    player = await AccountService.authenticate(body.email, body.password)
    if not player:
        raise HTTPException(401, "Invalid credentials")
    return {"player": player, "token": create_token(player["id"])}
```

### 6.2 Auth dependency (used by /rooms/*, /profile/*)

```python
# routes/_deps.py
from fastapi import Header, HTTPException
from utils.tokens import decode_token

async def current_player_id(authorization: str = Header(default="")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    payload = decode_token(authorization.removeprefix("Bearer "))
    if not payload:
        raise HTTPException(401, "Invalid token")
    return payload["sub"]
```

### 6.3 Tokens util (utils/tokens.py)

```python
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from config import settings

def create_token(player_id: str) -> str:
    payload = {
        "sub": str(player_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.jwt_expires_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError:
        return None
```

### 6.4 Rooms (routes/rooms.py)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | /public/join | required | — | `{ roomId }` |
| POST | /private | required | `{ capacity? }` | `{ roomId, code }` |
| POST | /:code/join | required | — | `{ roomId }` |
| GET | /:code | required | — | `{ room, members }` |
| DELETE | /:code | required (owner) | — | `204` |

---

## 7. Realtime Layer

### 7.1 Server instance (realtime/server.py)

`python-socketio` performs its own CORS check on the WebSocket handshake — separate from FastAPI's CORS middleware. Both must be configured.

```python
import socketio
from config import settings

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=[settings.cors_origin],   # NOT empty
    logger=False,
    engineio_logger=False,
)
```

### 7.2 Connection auth (realtime/auth.py)

```python
from realtime.server import sio
from utils.tokens import decode_token

@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get("token")
    if not token:
        raise ConnectionRefusedError("missing-token")
    payload = decode_token(token)
    if not payload:
        raise ConnectionRefusedError("invalid-token")
    await sio.save_session(sid, {"player_id": payload["sub"]})

@sio.event
async def disconnect(sid):
    # Local import avoids circular: realtime → services → realtime
    from services.room_service import RoomService
    try:
        session = await sio.get_session(sid)
    except KeyError:
        return
    await RoomService.on_disconnect(session.get("player_id"), sid)
```

### 7.3 Room handlers (realtime/room_handlers.py)

> **Important:** in `python-socketio`, **`enter_room` and `leave_room` are synchronous** — calling `await sio.enter_room(...)` raises `TypeError` because the return value is `None`, not a coroutine.

```python
from realtime.server import sio
from services.room_service import RoomService

@sio.on("room:join")
async def on_room_join(sid, data):
    session = await sio.get_session(sid)
    player_id = session["player_id"]
    room = RoomService.get_room(data["roomId"])
    if not room:
        await sio.emit("app:error", {"code": "room-not-found"}, to=sid)
        return
    sio.enter_room(sid, room["id"])                   # synchronous
    await RoomService.attach_socket(room["id"], player_id, sid)
    snapshot = RoomService.build_state_snapshot(room["id"])
    await sio.emit("room:state", snapshot, to=sid)

@sio.on("room:leave")
async def on_room_leave(sid, data):
    session = await sio.get_session(sid)
    await RoomService.player_leave(data["roomId"], session["player_id"])
    sio.leave_room(sid, data["roomId"])               # synchronous

@sio.on("room:start")
async def on_room_start(sid, data):
    session = await sio.get_session(sid)
    result = await RoomService.start_private(data["roomId"], session["player_id"])
    if not result["ok"]:
        await sio.emit("app:error", {"code": result["error"]}, to=sid)

@sio.on("round:stay")
async def on_round_stay(sid, data):
    session = await sio.get_session(sid)
    await RoomService.mark_staying(data["roomId"], session["player_id"], staying=True)

@sio.on("round:leave")
async def on_round_leave(sid, data):
    session = await sio.get_session(sid)
    await RoomService.mark_staying(data["roomId"], session["player_id"], staying=False)
    await RoomService.player_leave(data["roomId"], session["player_id"])
    sio.leave_room(sid, data["roomId"])               # synchronous
```

### 7.4 Application errors

The literal event name `error` is reserved by Socket.io for transport failures. Application errors use `app:error`:
```python
await sio.emit("app:error", {"code": "not-owner"}, to=sid)
```
The frontend listens for `app:error` and re-emits as `net:app-error` on the bus.

### 7.5 Game handlers (realtime/game_handlers.py)

```python
from realtime.server import sio
from services.room_service import RoomService
from services.game_service import GameService

@sio.on("game:spin-result")
async def on_spin_result(sid, data):
    session = await sio.get_session(sid)
    await RoomService.record_spin(
        room_id=data["roomId"],
        player_id=session["player_id"],
        spin=data,
    )

@sio.on("game:jackpot-use")
async def on_jackpot_use(sid, data):
    session = await sio.get_session(sid)
    await RoomService.record_jackpot_use(data["roomId"], session["player_id"], data)

@sio.on("game:bingo-claim")
async def on_bingo_claim(sid, data):
    session = await sio.get_session(sid)
    room_id   = data["roomId"]
    player_id = session["player_id"]

    result = await GameService.validate_bingo_claim(
        room_id=room_id,
        player_id=player_id,
        card_state=data["cardState"],
        spin_history=data["spinHistory"],
    )
    if not result["valid"]:
        await sio.emit("bingo:rejected", {"reason": result["reason"]}, to=sid)
        return

    await RoomService.end_round(room_id, winner={"type": "player", "player_id": player_id})
```

---

## 8. Room Service (services/room_service.py)

```python
import asyncio
import json
import random
import time
import uuid
from pathlib import Path

from db.pool import pool
from realtime.server import sio
from services.bot_service import BotService
from services.leaderboard_service import LeaderboardService
from utils.seeded_random import SeededRandom
from utils.card_layouts import generate_card
from utils.room_code import generate_code

# In-memory state — single-process v1. Migrate to Redis for multi-worker.
_rooms: dict[str, dict] = {}

# Per-room asyncio.Lock — prevents race in join_public when two requests
# discover the same waiting room and both append.
_room_locks: dict[str, asyncio.Lock] = {}

# Module-level lock for room creation / public-room search
_global_lock = asyncio.Lock()

_PROFILES_PATH = Path(__file__).parent.parent / "data" / "bot_profiles.json"
BOT_PROFILES: list[dict] = json.loads(_PROFILES_PATH.read_text())


def _make_player_slot(player_id: str) -> dict:
    """Builds an initial player entry. Username/avatar filled in async by attach_player."""
    return {
        "player_id": player_id,
        "username":  "Player",
        "avatar_url": "",
        "sid": None,
        "is_staying": True,    # default to staying; flipped by round:leave
    }


def _fill_bots(room: dict) -> None:
    """Allocates bots into all empty slots. Each bot rolls a departure_round."""
    needed = room["capacity"] - len(room["players"])
    used_ids = {b["id"] for b in room["bots"]}
    pool = [p for p in BOT_PROFILES if p["id"] not in used_ids]
    for p in random.sample(pool, min(needed, len(pool))):
        lo, hi = p["departure_round_range"]
        room["bots"].append({
            "id":              p["id"],
            "name":            p["name"],
            "avatar_url":      p["avatar_url"],
            "skill":           p["skill"],
            "spin_interval":   p["spin_interval"],
            "departure_round": random.randint(lo, hi),
            "card_seed":       None,
            "card":            None,
            "closed":          set(),
            "closed_count":    0,
            "line_progress":   0,
            "is_near_win":     False,
            "status":          "active",
        })


class RoomService:

    # ---- Lookup ----

    @staticmethod
    def get_room(room_id: str) -> dict | None:
        return _rooms.get(room_id)

    @staticmethod
    def get_room_by_code(code: str) -> dict | None:
        for r in _rooms.values():
            if r.get("code") == code:
                return r
        return None

    # ---- Membership ----

    @staticmethod
    async def join_public(player_id: str) -> dict:
        async with _global_lock:
            for room in _rooms.values():
                if room["type"] == "public" and room["status"] == "waiting":
                    if any(p["player_id"] == player_id for p in room["players"]):
                        return room
                    # Displace a bot to make room for the human
                    if room["bots"]:
                        room["bots"].pop()
                    room["players"].append(_make_player_slot(player_id))
                    return room
            return await RoomService._create_room("public", player_id)

    @staticmethod
    async def create_private(owner_id: str, capacity: int = 8) -> dict:
        return await RoomService._create_room("private", owner_id, capacity=capacity)

    @staticmethod
    async def join_by_code(code: str, player_id: str) -> dict | None:
        room = RoomService.get_room_by_code(code)
        if not room or room["status"] != "waiting":
            return None
        if len(room["players"]) >= room["capacity"]:
            return None
        if not any(p["player_id"] == player_id for p in room["players"]):
            room["players"].append(_make_player_slot(player_id))
        return room

    @staticmethod
    async def attach_socket(room_id: str, player_id: str, sid: str) -> None:
        room = _rooms.get(room_id)
        if not room:
            return
        for p in room["players"]:
            if p["player_id"] == player_id:
                p["sid"] = sid
                # Hydrate username/avatar from DB once
                if p["username"] == "Player":
                    async with pool.acquire() as conn:
                        row = await conn.fetchrow(
                            "SELECT username, avatar_url FROM players WHERE id = $1",
                            uuid.UUID(player_id),
                        )
                        if row:
                            p["username"]   = row["username"]
                            p["avatar_url"] = row["avatar_url"] or ""
                await sio.emit("player:joined", {
                    "playerId": player_id,
                    "username": p["username"],
                    "avatarUrl": p["avatar_url"],
                }, room=room_id, skip_sid=sid)
                return

    # ---- Creation ----

    @staticmethod
    async def _create_room(type_: str, owner_id: str, capacity: int = 8) -> dict:
        room_id = str(uuid.uuid4())
        code = generate_code() if type_ == "private" else None

        room = {
            "id":              room_id,
            "code":            code,
            "type":            type_,
            "status":          "waiting",
            "capacity":        capacity,
            "current_round":   0,
            "owner_id":        owner_id if type_ == "private" else None,
            "players":         [_make_player_slot(owner_id)],
            "bots":            [],
            "round_db_id":     None,    # current round's UUID (set in start_round)
            "round_start_time": None,
            "spin_histories":  {},
            "jackpot_logs":    {},
            "card_seeds":      {},
            "wins_per_player": {},      # for session bonus
            "best_streaks":    {},
        }

        if type_ == "public":
            _fill_bots(room)

        _rooms[room_id] = room
        _room_locks[room_id] = asyncio.Lock()

        async with pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO rooms (id, code, type, capacity, owner_id) "
                "VALUES ($1, $2, $3, $4, $5)",
                uuid.UUID(room_id), code, type_, capacity,
                uuid.UUID(owner_id) if type_ == "private" else None,
            )

        if type_ == "public":
            asyncio.create_task(_lobby_timer(room_id))

        return room

    # ---- Round lifecycle ----

    @staticmethod
    async def start_round(room_id: str) -> None:
        room = _rooms.get(room_id)
        if not room or room["status"] not in ("waiting", "between_rounds"):
            return

        room["status"] = "in_progress"
        room["current_round"] += 1
        room["round_start_time"] = time.time()
        room["spin_histories"] = {p["player_id"]: [] for p in room["players"]}

        # 32-bit unsigned range — JS Number-safe and matches mulberry32 width
        seed_max = 2**31 - 1

        # Per-player card seeds — emitted PRIVATELY to each player only
        card_seeds = {p["player_id"]: random.randint(1, seed_max) for p in room["players"]}
        room["card_seeds"] = card_seeds

        # Bot card seeds (server-only)
        for bot in room["bots"]:
            if bot["status"] != "active":
                continue
            seed = random.randint(1, seed_max)
            bot["card_seed"] = seed
            bot["card"] = generate_card(SeededRandom(seed))
            bot["closed"] = {(2, 2)}            # FREE center
            bot["closed_count"] = 0
            bot["line_progress"] = 0
            bot["is_near_win"] = False

        # Persist round
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "INSERT INTO rounds (room_id, round_number) VALUES ($1, $2) RETURNING id",
                uuid.UUID(room_id), room["current_round"],
            )
        room["round_db_id"] = row["id"]

        start_ts = int(time.time() * 1000) + 3000

        # Emit round:start ONLY to each player with their own seed —
        # broadcasting card_seeds to all sockets would leak others' seeds.
        for p in room["players"]:
            if p.get("sid"):
                await sio.emit("round:start", {
                    "roundNumber":    room["current_round"],
                    "startTimestamp": start_ts,
                    "cardSeed":       card_seeds[p["player_id"]],
                }, to=p["sid"])

        BotService.start_bots(room)
        asyncio.create_task(LeaderboardService.broadcast_loop(room_id))

    @staticmethod
    async def end_round(room_id: str, winner: dict) -> None:
        async with _room_locks.setdefault(room_id, asyncio.Lock()):
            room = _rooms.get(room_id)
            if not room or room["status"] != "in_progress":
                return
            room["status"] = "between_rounds"
            BotService.stop_bots(room_id)

        standings = LeaderboardService.build_standings(room)
        results = _build_round_results(standings, room)

        # Persist results, award coins
        async with pool.acquire() as conn, conn.transaction():
            await conn.execute(
                "UPDATE rounds SET ended_at = NOW(), winner_id = $1, winner_bot_id = $2 WHERE id = $3",
                uuid.UUID(winner["player_id"]) if winner.get("player_id") else None,
                winner.get("bot_id"),
                room["round_db_id"],
            )
            for entry in results:
                await conn.execute(
                    "INSERT INTO round_results "
                    "(round_id, player_id, bot_profile_id, position, coins_earned, "
                    " cells_closed, best_streak, jackpots_used) "
                    "VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
                    room["round_db_id"],
                    uuid.UUID(entry["id"]) if not entry["is_bot"] else None,
                    entry["id"] if entry["is_bot"] else None,
                    entry["rank"], entry["coins_earned"],
                    entry["cells_closed"], entry["best_streak"], entry["jackpots_used"],
                )
                if not entry["is_bot"] and entry["coins_earned"] > 0:
                    await conn.execute(
                        "UPDATE players SET coins = coins + $1 WHERE id = $2",
                        entry["coins_earned"], uuid.UUID(entry["id"]),
                    )

        # Track session stats
        if winner.get("player_id"):
            room["wins_per_player"][winner["player_id"]] = \
                room["wins_per_player"].get(winner["player_id"], 0) + 1

        # Depart bots whose departure_round <= current_round
        for bot in room["bots"]:
            if bot["status"] == "active" and bot["departure_round"] <= room["current_round"]:
                bot["status"] = "departed"
                await sio.emit("bot:departed", {
                    "botId":              bot["id"],
                    "botName":             bot["name"],
                    "departedAfterRound": room["current_round"],
                }, room=room_id)

        await sio.emit("round:end", {
            "roundNumber":   room["current_round"],
            "winnerId":      winner.get("player_id"),
            "winnerBotId":   winner.get("bot_id"),
            "winnerName":    _find_winner_name(room, winner),
            "results":       results,
            "sessionBonuses": [],   # awarded on player_leave, not per-round
        }, room=room_id)

        asyncio.create_task(_next_round_timer(room_id))

    # ---- Spin / jackpot recording ----

    @staticmethod
    async def record_spin(room_id: str, player_id: str, spin: dict) -> None:
        room = _rooms.get(room_id)
        if not room:
            return
        room["spin_histories"].setdefault(player_id, []).append(spin)

    @staticmethod
    async def record_jackpot_use(room_id: str, player_id: str, data: dict) -> None:
        room = _rooms.get(room_id)
        if not room:
            return
        room["jackpot_logs"].setdefault(player_id, []).append(data)

    # ---- Leaving ----

    @staticmethod
    async def mark_staying(room_id: str, player_id: str, staying: bool) -> None:
        room = _rooms.get(room_id)
        if not room:
            return
        for p in room["players"]:
            if p["player_id"] == player_id:
                p["is_staying"] = staying
                return

    @staticmethod
    async def player_leave(room_id: str, player_id: str) -> None:
        room = _rooms.get(room_id)
        if not room:
            return
        room["players"] = [p for p in room["players"] if p["player_id"] != player_id]
        await sio.emit("player:left", {"playerId": player_id}, room=room_id)
        # Only close immediately if room is between rounds AND under 2 humans;
        # mid-round disconnects don't kill the round.
        if room["status"] in ("waiting", "between_rounds") and len(room["players"]) < 2:
            await _close_room(room_id, "all-left")

    @staticmethod
    async def on_disconnect(player_id: str | None, sid: str) -> None:
        if not player_id:
            return
        # Find rooms this player is in; mark sid=None but don't remove them
        # (they may reconnect within reconnect window). Hard removal happens
        # on explicit room:leave or stale-cleanup task.
        for room in _rooms.values():
            for p in room["players"]:
                if p["player_id"] == player_id and p["sid"] == sid:
                    p["sid"] = None

    @staticmethod
    async def start_private(room_id: str, requester_id: str) -> dict:
        room = _rooms.get(room_id)
        if not room:
            return {"ok": False, "error": "room-not-found"}
        if room["owner_id"] != requester_id:
            return {"ok": False, "error": "not-owner"}
        if room["status"] != "waiting":
            return {"ok": False, "error": "already-started"}
        if len(room["players"]) < 2:
            return {"ok": False, "error": "not-enough-players"}
        await RoomService.start_round(room_id)
        return {"ok": True}

    # ---- Snapshot ----

    @staticmethod
    def build_state_snapshot(room_id: str) -> dict:
        room = _rooms[room_id]
        return {
            "roomId":   room["id"],
            "code":     room["code"],
            "type":     room["type"],
            "status":   room["status"],
            "capacity": room["capacity"],
            "round":    room["current_round"],
            "ownerId":  room["owner_id"],
            "members":  [{"id": p["player_id"], "name": p["username"],
                          "avatarUrl": p["avatar_url"]} for p in room["players"]],
            "bots":     [{"id": b["id"], "name": b["name"],
                          "avatarUrl": b["avatar_url"], "status": b["status"]}
                         for b in room["bots"]],
            "standings": LeaderboardService.build_standings(room),
        }


# ----- helpers -----

def _build_round_results(standings: list[dict], room: dict) -> list[dict]:
    """Map standings to result rows with coin payouts (MVP §12 table)."""
    REWARD = {1: 500, 2: 350, 3: 250, 4: 150, 5: 150, 6: 75, 7: 75, 8: 75}
    out = []
    for s in standings:
        spins = room["spin_histories"].get(s["id"], [])
        best_streak = _compute_best_streak(spins) if not s["isBot"] else 0
        jackpots = len(room["jackpot_logs"].get(s["id"], [])) if not s["isBot"] else 0
        out.append({
            "id":            s["id"],
            "is_bot":        s["isBot"],
            "name":          s["name"],
            "avatar_url":    s["avatarUrl"],
            "rank":          s["rank"],
            "coins_earned":  REWARD.get(s["rank"], 75),
            "cells_closed":  s["closedCount"],
            "best_streak":   best_streak,
            "jackpots_used": jackpots,
        })
    return out


def _compute_best_streak(spins: list[dict]) -> int:
    best = cur = 0
    for s in spins:
        if s.get("hitCell"):
            cur += 1
            best = max(best, cur)
        elif s.get("nearHit"):
            continue   # near-hits don't extend or break (MVP §7.1)
        else:
            cur = 0
    return best


def _find_winner_name(room: dict, winner: dict) -> str:
    if winner.get("player_id"):
        for p in room["players"]:
            if p["player_id"] == winner["player_id"]:
                return p["username"]
    if winner.get("bot_id"):
        for b in room["bots"]:
            if b["id"] == winner["bot_id"]:
                return b["name"]
    return "Unknown"


async def _close_room(room_id: str, reason: str) -> None:
    room = _rooms.get(room_id)
    if not room:
        return
    room["status"] = "closed"
    await sio.emit("room:closed", {"reason": reason}, room=room_id)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE rooms SET status='closed', closed_at=NOW() WHERE id=$1",
            uuid.UUID(room_id),
        )
    _rooms.pop(room_id, None)
    _room_locks.pop(room_id, None)


async def _lobby_timer(room_id: str) -> None:
    await asyncio.sleep(15)
    room = _rooms.get(room_id)
    if room and room["status"] == "waiting":
        await RoomService.start_round(room_id)


async def _next_round_timer(room_id: str) -> None:
    await asyncio.sleep(10)
    room = _rooms.get(room_id)
    if not room or room["status"] != "between_rounds":
        return
    staying = [p for p in room["players"] if p.get("is_staying", True)]
    # Drop players who chose LEAVE
    room["players"] = staying
    if len(room["players"]) >= 2:
        await RoomService.start_round(room_id)
    else:
        await _close_room(room_id, "all-left")
```

---

## 9. Bot Service (services/bot_service.py)

```python
import asyncio
import random
import time

from realtime.server import sio
from utils.card_layouts import get_all_lines, get_near_win_lines

_tasks: dict[str, list[asyncio.Task]] = {}


class BotService:

    @staticmethod
    def start_bots(room: dict) -> None:
        tasks = []
        for bot in room["bots"]:
            if bot["status"] == "active":
                tasks.append(asyncio.create_task(_bot_loop(room, bot)))
        _tasks[room["id"]] = tasks

    @staticmethod
    def stop_bots(room_id: str) -> None:
        for task in _tasks.pop(room_id, []):
            task.cancel()


async def _bot_loop(room: dict, bot: dict) -> None:
    try:
        while True:
            # Status check at top — exit cleanly if round ended while we slept
            if room["status"] != "in_progress" or bot["status"] != "active":
                return

            lo, hi = bot["spin_interval"]
            await asyncio.sleep((lo + random.random() * (hi - lo)) / 1000)

            if room["status"] != "in_progress" or bot["status"] != "active":
                return

            await _simulate_spin(room, bot)
    except asyncio.CancelledError:
        return


async def _simulate_spin(room: dict, bot: dict) -> None:
    open_numbers = _get_open_numbers(bot)

    # Bots use plain random.random() — they don't share the player RNG.
    # Their cards were generated from a server-side seed (see start_round).
    if random.random() < bot["skill"] and open_numbers:
        number = random.choice(open_numbers)
    else:
        number = random.randint(1, 75)

    cell = _close_number(bot, number)
    if cell:
        bot["closed_count"] = len(bot["closed"]) - 1
        bot["line_progress"] = _best_line_progress(bot)
        bot["is_near_win"] = len(get_near_win_lines(bot["card"], bot["closed"])) > 0

        if _is_won(bot):
            elapsed = time.time() - room["round_start_time"]
            if elapsed >= 30:    # MVP §8.2 30-second grace period
                from services.room_service import RoomService
                asyncio.create_task(
                    RoomService.end_round(room["id"], {"type": "bot", "bot_id": bot["id"]})
                )


def _get_open_numbers(bot: dict) -> list[int]:
    return [bot["card"][r][c]
            for r in range(5) for c in range(5)
            if bot["card"][r][c] != 0 and (c, r) not in bot["closed"]]


def _close_number(bot: dict, number: int):
    for r in range(5):
        for c in range(5):
            if bot["card"][r][c] == number and (c, r) not in bot["closed"]:
                bot["closed"].add((c, r))
                return (c, r)
    return None


def _is_won(bot: dict) -> bool:
    return any(all((c, r) in bot["closed"] for c, r in line) for line in get_all_lines())


def _best_line_progress(bot: dict) -> int:
    return max(
        sum(1 for c, r in line if (c, r) in bot["closed"])
        for line in get_all_lines()
    )
```

---

## 10. BINGO Validation (services/game_service.py)

The validator must verify three things:
1. The `cardState` reports a winning line.
2. Every closed cell (other than FREE) is backed by a spin event with `hitCell == that cell`.
3. Each backing spin's `spinNumber` equals the card's number at that cell (so the player can't claim hits on spins for numbers not on their card).

```python
import uuid
from utils.seeded_random import SeededRandom
from utils.card_layouts import generate_card, get_all_lines


class GameService:

    @staticmethod
    async def validate_bingo_claim(room_id, player_id, card_state, spin_history) -> dict:
        from services.room_service import _rooms
        room = _rooms.get(room_id)
        if not room or room["status"] != "in_progress":
            return {"valid": False, "reason": "not-in-progress"}

        # Grace period (MVP §8.2 — bots only, but applying to humans is harmless)
        # Skip in MVP for human claims to keep responsiveness; bots have their own check.

        seed = room.get("card_seeds", {}).get(player_id)
        if seed is None:
            return {"valid": False, "reason": "no-card-seed"}

        expected_card = generate_card(SeededRandom(seed))

        # 1. Each spin's hitCell must match the card geometry
        spin_index_by_cell: dict[tuple[int, int], int] = {}
        for i, spin in enumerate(spin_history):
            hit = spin.get("hitCell")
            if not hit:
                continue
            c, r = hit["col"], hit["row"]
            if not (0 <= c < 5 and 0 <= r < 5):
                return {"valid": False, "reason": "out-of-range-cell"}
            if expected_card[r][c] != spin.get("spinNumber"):
                return {"valid": False, "reason": "spin-card-mismatch"}
            spin_index_by_cell[(c, r)] = i

        # 2. Every closed cell in cardState must have a backing spin (except FREE)
        if not (isinstance(card_state, list) and len(card_state) == 5):
            return {"valid": False, "reason": "bad-card-state"}
        for r in range(5):
            for c in range(5):
                if (c, r) == (2, 2):
                    continue
                if card_state[r][c] and (c, r) not in spin_index_by_cell:
                    # Could also be a jackpot-ball close — accept those by checking
                    # jackpot_logs (skipped here for v1 brevity; allow if present)
                    if not any(
                        j["col"] == c and j["row"] == r
                        for j in room["jackpot_logs"].get(player_id, [])
                    ):
                        return {"valid": False, "reason": "unbacked-close"}

        # 3. Confirm a winning line exists
        closed_set = {(c, r) for r in range(5) for c in range(5) if card_state[r][c]}
        closed_set.add((2, 2))
        if not any(all(cell in closed_set for cell in line) for line in get_all_lines()):
            return {"valid": False, "reason": "no-win-line"}

        return {"valid": True}
```

---

## 11. Leaderboard Service (services/leaderboard_service.py)

Player line-progress is tracked from `game:spin-result` events. Each spin event already contains `hitCell`, so the service can replay the spin history server-side to compute true line progress without trusting a self-reported value.

```python
import asyncio
from realtime.server import sio
from utils.card_layouts import get_all_lines


class LeaderboardService:

    @staticmethod
    async def broadcast_loop(room_id: str) -> None:
        from services.room_service import _rooms
        while True:
            await asyncio.sleep(2)
            room = _rooms.get(room_id)
            if not room or room["status"] != "in_progress":
                return
            standings = LeaderboardService.build_standings(room)
            await sio.emit("leaderboard:update", {"standings": standings}, room=room_id)

    @staticmethod
    def build_standings(room: dict) -> list[dict]:
        entries: list[dict] = []

        for p in room["players"]:
            spins = room["spin_histories"].get(p["player_id"], [])
            closed_cells = {(s["hitCell"]["col"], s["hitCell"]["row"])
                            for s in spins if s.get("hitCell")}
            closed_cells.add((2, 2))    # FREE
            line_progress = max(
                (sum(1 for cell in line if cell in closed_cells)
                 for line in get_all_lines()),
                default=0,
            )
            entries.append({
                "id":           p["player_id"],
                "isBot":        False,
                "name":         p["username"],
                "avatarUrl":    p["avatar_url"],
                "closedCount":  len(closed_cells) - 1,   # exclude FREE
                "lineProgress": line_progress,
                "isNearWin":    line_progress == 4,
                "status":       "active",
            })

        for bot in room["bots"]:
            entries.append({
                "id":           bot["id"],
                "isBot":        True,
                "name":         bot["name"],
                "avatarUrl":    bot["avatar_url"],
                "closedCount":  bot.get("closed_count", 0),
                "lineProgress": bot.get("line_progress", 0),
                "isNearWin":    bot.get("is_near_win", False),
                "status":       bot.get("status", "active"),
            })

        entries.sort(key=lambda e: (-e["lineProgress"], -e["closedCount"]))
        for i, e in enumerate(entries):
            e["rank"] = i + 1
        return entries
```

---

## 12. Seeded RNG (utils/seeded_random.py)

The Python implementation **must produce bit-identical output to the JS `SeededRandom`** in `src/utils/seededRandom.js`. This is mulberry32 — a tight 32-bit algorithm where every operation must be done in unsigned 32-bit arithmetic. Python's `int` is arbitrary precision, so every operation is masked with `& 0xFFFFFFFF` and `Math.imul` (32-bit signed multiplication) is reproduced explicitly.

```python
_MASK32 = 0xFFFFFFFF
_DIV    = 0x100000000

def _imul32(a: int, b: int) -> int:
    """Mirror JS Math.imul: 32-bit integer multiplication, low bits only."""
    return ((a * b) & _MASK32)

class SeededRandom:
    """Mirrors src/utils/seededRandom.js mulberry32 — must stay in sync."""

    def __init__(self, seed: int):
        self._state = seed & _MASK32

    def next(self) -> float:
        """Returns float in [0, 1)."""
        self._state = (self._state + 0x6D2B79F5) & _MASK32
        t = self._state
        t = _imul32(t ^ (t >> 15), t | 1)
        t = (t ^ (t + _imul32(t ^ (t >> 7), t | 61))) & _MASK32
        return ((t ^ (t >> 14)) & _MASK32) / _DIV

    def int_between(self, lo: int, hi: int) -> int:
        # Mirror JS intBetween: lo + Math.floor(rng() * (hi - lo + 1))
        return lo + int(self.next() * (hi - lo + 1))

    def pick_from(self, items: list):
        return items[int(self.next() * len(items))]
```

> **Required parity test before any game logic depends on this:**  
> Run identical seeds through `seededRandom.js` and `seeded_random.py`, assert the first 100 floats match to at least 9 decimal places. The previous draft's version diverged at line 2 (wrong shift mask + wrong constant) — **do not skip this test.**

---

## 13. Card Layouts (utils/card_layouts.py)

Mirrors `src/data/cardLayouts.js`. Required functions:

```python
from utils.seeded_random import SeededRandom

COLUMN_RANGES = [(1, 15), (16, 30), (31, 45), (46, 60), (61, 75)]

def generate_card(rng: SeededRandom) -> list[list[int]]:
    """Returns a 5x5 grid (row-major). Cell [2][2] is 0 (FREE)."""
    grid = [[0] * 5 for _ in range(5)]
    for c, (lo, hi) in enumerate(COLUMN_RANGES):
        pool = list(range(lo, hi + 1))
        # Shuffle using the same algorithm as JS — Fisher-Yates with rng.next()
        for i in range(len(pool) - 1, 0, -1):
            j = int(rng.next() * (i + 1))
            pool[i], pool[j] = pool[j], pool[i]
        for r in range(5):
            grid[r][c] = pool[r]
    grid[2][2] = 0   # FREE
    return grid


def get_all_lines() -> list[list[tuple[int, int]]]:
    lines = []
    for r in range(5):
        lines.append([(c, r) for c in range(5)])    # rows
    for c in range(5):
        lines.append([(c, r) for r in range(5)])    # cols
    lines.append([(i, i) for i in range(5)])        # diag
    lines.append([(4 - i, i) for i in range(5)])    # anti-diag
    return lines


def get_near_win_lines(card: list[list[int]], closed: set[tuple[int, int]]) -> list[list]:
    return [
        line for line in get_all_lines()
        if sum(1 for cell in line if cell in closed) == 4
    ]
```

> **Cross-check:** the JS shuffle algorithm in `cardLayouts.js` must use the identical Fisher-Yates form. If JS uses a different shuffle, mirror that one, not this one.

---

## 14. Bot Profile Pool

### 14.1 Generation (one-time setup)
Generate 50 AI portraits and save to `server/data/bot_avatars/bot_001.jpg` … `bot_050.jpg`.  
Served as static files: `app.mount("/bots", StaticFiles(directory="data/bot_avatars"))`.

### 14.2 bot_profiles.json (snake_case throughout, matching Python conventions)
```json
[
  {
    "id": "bot_001",
    "name": "Mia",
    "avatar_url": "/bots/bot_001.jpg",
    "tier": "easy",
    "skill": 0.33,
    "spin_interval": [1600, 2500],
    "departure_round_range": [8, 14]
  }
]
```

When emitting these to the client (in `room:state`, `bot:departed`, etc.), keys are translated to camelCase (`avatarUrl`) for JS consumption — see snapshot/standings code in §8 and §11.

---

## 15. Rate Limiting (auth)

```python
# main.py addition
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# routes/auth.py — annotate sensitive endpoints
from main import limiter

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginIn):
    ...
```

---

## 16. Implementation Plan

### Phase 1 — Core infrastructure (days 1–4)
- [ ] `pip install -r requirements.txt`; `uvicorn main:asgi_app --reload` boots cleanly
- [ ] `db/migrations/` runs against local Postgres via `psql -f`
- [ ] `db/pool.py` — `init_pool()` on startup, `close_pool()` on shutdown
- [ ] `config.py` (Pydantic v2 SettingsConfigDict) + `.env`
- [ ] `utils/tokens.py` — `create_token()`, `decode_token()`
- [ ] `routes/_deps.py` — `current_player_id` dependency
- [ ] `routes/auth.py` — guest, register, login (rate-limited)
- [ ] `realtime/server.py` + `realtime/auth.py` — connect handler with JWT verify, CORS allowlist
- [ ] `realtime/room_handlers.py` — `room:join` → `room:state` (sync `enter_room`)
- [ ] `services/room_service.py` — `join_public()`, `create_private()`, `join_by_code()`, `attach_socket()`
- [ ] **Test:** two browser tabs `room:join` same public room and both receive `room:state`

### Phase 2 — Bot simulation and round flow (days 5–9)
- [ ] `data/bot_profiles.json` — 50 placeholder profiles
- [ ] `utils/seeded_random.py` + **cross-language parity test** vs `src/utils/seededRandom.js` (first 100 floats match to 9 decimal places)
- [ ] `utils/card_layouts.py` — `generate_card()`, `get_all_lines()`, `get_near_win_lines()` + parity test
- [ ] `services/bot_service.py` — asyncio task per bot, status check at loop top, cancel handling
- [ ] `RoomService.start_round()` — per-player private `round:start` emit (no broadcast of seeds map)
- [ ] `services/leaderboard_service.py` — 2-second broadcast loop, exits on status change
- [ ] `realtime/game_handlers.py` — `game:spin-result`, `game:bingo-claim` → `GameService.validate_bingo_claim()` (3-step validator from §10)
- [ ] `RoomService.end_round()` — DB writes (rounds.ended_at, round_results, players.coins) inside a transaction
- [ ] **Test:** full round (bot win + human win), DB rows correct, BINGO with tampered cardState rejected

### Phase 3 — Multi-round sessions (days 10–13)
- [ ] Bot departure in `end_round()` — `bot:departed` broadcast
- [ ] `_next_round_timer()` — drops players with `is_staying=False`, starts next or closes
- [ ] `round:stay` / `round:leave` handlers; `mark_staying()` flips flag
- [ ] Private room `room:start` handler (`start_private()` with status/owner/count checks)
- [ ] `routes/rooms.py` — private room create + join by code endpoints
- [ ] **Test:** 5-round session, bots depart per schedule, players stay/leave, room closes when < 2 humans staying

### Phase 4 — Persistence and accounts (days 14–17)
- [ ] `services/account_service.py` — `create_guest()`, `register()`, `authenticate()` (passlib bcrypt)
- [ ] `routes/profile.py` — GET/PUT profile, GET history (last 20 round_results)
- [ ] `POST /auth/guest-upgrade` — adds email + password to existing guest account
- [ ] Session bonuses: computed when `player_leave` fires for a player with stats; emitted as part of the next `round:end` they receive (or a synthetic results payload)
- [ ] **Test:** coins accumulate across rounds; guest upgrade preserves coins

### Phase 5 — Bot avatars and hardening (days 18–20)
- [ ] Generate/source 50 bot portraits; populate final `bot_profiles.json`
- [ ] Static `/bots/*.jpg` confirmed
- [ ] Rate limiting on auth via `slowapi` (login: 5/min, register: 3/min)
- [ ] Graceful reconnect: on new socket connect with valid token, if player has `sid=None` in any room, re-emit `room:state`
- [ ] Inactivity cleanup task: every 5 min, scan `_rooms`, close any with 0 humans for > 5 min
- [ ] **Load test:** 20 concurrent rooms × 8 players using `locust`

---

## 17. Running Locally

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Postgres
createdb slingo
for f in db/migrations/*.sql; do psql slingo -f "$f"; done

# Server
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
uvicorn main:asgi_app --host 0.0.0.0 --port 3001 --reload
```

Client `.env.development`:
```
VITE_SERVER_URL=http://localhost:3001
```

---

*End of TEAMPLAY_BACKEND.md*
