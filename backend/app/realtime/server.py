"""Socket.IO realtime server for live study-room presence.

Built with python-socketio + ``AsyncRedisManager`` so multiple instances behind
a load balancer share room state through Redis Pub/Sub: a broadcast on instance
A reaches a client connected to instance B. ``build_server()`` returns a fresh,
fully-wired server (the test suite spins up two of them on one Redis to prove
cross-instance fan-out).

Client protocol:
  connect      auth={"token": <jwt>}                  -> ConnectionRefusedError on bad token
  join_room    {"room_id", "status"?}                 -> "room_snapshot" to caller, "presence_update" to room
  set_status   {"room_id", "status"}                  -> "presence_update" to room
  heartbeat    {"room_id"}                             -> keeps presence alive (no broadcast)
  leave_room   {"room_id"}                             -> "presence_update" (leave) to room
  disconnect                                            -> "presence_update" (leave) for each joined room
"""

import time
from collections import deque
from uuid import UUID

import socketio

from app.core import db
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import decode_access_token
from app.models.room import Room
from app.models.user import User
from app.services import presence

log = get_logger("realtime")


class RateLimiter:
    """Per-connection sliding-window limiter for chatty events."""

    def __init__(self, max_events: int, window_seconds: int) -> None:
        self.max_events = max_events
        self.window = window_seconds
        self._hits: dict[str, deque[float]] = {}

    def allow(self, sid: str) -> bool:
        now = time.time()
        q = self._hits.setdefault(sid, deque())
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.max_events:
            return False
        q.append(now)
        return True

    def drop(self, sid: str) -> None:
        self._hits.pop(sid, None)


async def _load_user(token: str | None) -> User | None:
    if not token:
        return None
    try:
        user_id = UUID(decode_access_token(token))
    except Exception:  # noqa: BLE001 — any malformed/expired token => unauthenticated
        return None
    async with db.SessionFactory() as session:
        return await session.get(User, user_id)


async def _load_room(room_id: str) -> Room | None:
    try:
        rid = UUID(room_id)
    except (ValueError, TypeError):
        return None
    async with db.SessionFactory() as session:
        return await session.get(Room, rid)


def build_server() -> socketio.AsyncServer:
    manager = socketio.AsyncRedisManager(settings.redis_url)
    sio = socketio.AsyncServer(
        async_mode="asgi",
        client_manager=manager,
        cors_allowed_origins="*",
    )
    limiter = RateLimiter(
        settings.rate_limit_max_events, settings.rate_limit_window_seconds
    )

    async def _error(sid: str, detail: str) -> None:
        await sio.emit("error", {"detail": detail}, to=sid)

    @sio.event
    async def connect(sid: str, environ: dict, auth: dict | None) -> None:
        user = await _load_user((auth or {}).get("token"))
        if user is None:
            raise socketio.exceptions.ConnectionRefusedError("authentication failed")
        await sio.save_session(
            sid,
            {
                "user_id": str(user.id),
                "display_name": user.display_name,
                "character": user.character_config or {},
                "rooms": set(),
            },
        )
        log.info("ws.connect", sid=sid, user_id=str(user.id))

    @sio.event
    async def join_room(sid: str, data: dict) -> None:
        session = await sio.get_session(sid)
        room_id = (data or {}).get("room_id")
        room = await _load_room(room_id)
        if room is None:
            return await _error(sid, "room not found")

        user_id = session["user_id"]
        already_member = await presence.get_member(room_id, user_id) is not None
        if not already_member and await presence.member_count(room_id) >= room.capacity:
            return await _error(sid, "room is full")

        status = (data or {}).get("status", "focusing")
        member = await presence.add_member(
            room_id,
            user_id,
            session["display_name"],
            session["character"],
            status=status,
        )
        await sio.enter_room(sid, room_id)
        session["rooms"].add(room_id)
        await sio.save_session(sid, session)

        # Full snapshot to the joiner (initial state + reconnect recovery)...
        await sio.emit(
            "room_snapshot",
            {"room_id": room_id, "members": await presence.list_members(room_id)},
            to=sid,
        )
        # ...and a join delta to everyone else (fans out across instances via Redis).
        await sio.emit(
            "presence_update",
            {"room_id": room_id, "event": "join", "member": member},
            room=room_id,
            skip_sid=sid,
        )

    @sio.event
    async def set_status(sid: str, data: dict) -> None:
        if not limiter.allow(sid):
            return await _error(sid, "rate limited")
        session = await sio.get_session(sid)
        room_id = (data or {}).get("room_id")
        status = (data or {}).get("status")
        if status not in presence.VALID_STATUSES:
            return await _error(sid, "invalid status")
        member = await presence.update_status(room_id, session["user_id"], status)
        if member is None:
            return await _error(sid, "not in room")
        await sio.emit(
            "presence_update",
            {"room_id": room_id, "event": "status", "member": member},
            room=room_id,
        )

    @sio.event
    async def heartbeat(sid: str, data: dict) -> None:
        if not limiter.allow(sid):
            return
        session = await sio.get_session(sid)
        room_id = (data or {}).get("room_id")
        if not room_id:
            return
        alive = await presence.heartbeat(room_id, session["user_id"])
        if not alive and room_id in session["rooms"]:
            # Self-heal: presence is keyed by user_id, so another connection
            # of the same account disconnecting evicts this one too. Re-add
            # and re-announce so the room recovers within one heartbeat.
            status = (data or {}).get("status", "idle")
            member = await presence.add_member(
                room_id,
                session["user_id"],
                session["display_name"],
                session["character"],
                status=status if status in presence.VALID_STATUSES else "idle",
            )
            await sio.emit(
                "presence_update",
                {"room_id": room_id, "event": "join", "member": member},
                room=room_id,
            )

    @sio.event
    async def leave_room(sid: str, data: dict) -> None:
        session = await sio.get_session(sid)
        room_id = (data or {}).get("room_id")
        if not room_id or room_id not in session["rooms"]:
            return
        await _exit_room(sid, session, room_id)
        await sio.save_session(sid, session)

    @sio.event
    async def disconnect(sid: str) -> None:
        try:
            session = await sio.get_session(sid)
        except KeyError:
            limiter.drop(sid)
            return
        for room_id in list(session.get("rooms", set())):
            await _exit_room(sid, session, room_id)
        limiter.drop(sid)
        log.info("ws.disconnect", sid=sid)

    async def _exit_room(sid: str, session: dict, room_id: str) -> None:
        user_id = session["user_id"]
        await presence.remove_member(room_id, user_id)
        await sio.leave_room(sid, room_id)
        session["rooms"].discard(room_id)
        await sio.emit(
            "presence_update",
            {"room_id": room_id, "event": "leave", "user_id": user_id},
            room=room_id,
            skip_sid=sid,
        )

    return sio
