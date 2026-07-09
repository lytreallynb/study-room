"""Redis-backed room presence.

State lives entirely in Redis so it is shared across every realtime instance
(any node can answer "who's in this room?"). Each room is a hash
``room:{room_id}:members`` mapping ``user_id -> JSON member``. A member carries
a ``last_seen`` epoch; reads lazily prune members whose last heartbeat is older
than ``presence_ttl_seconds`` — that covers clients that dropped without a clean
disconnect. The Redis client is reused; an explicit one can be injected (tests).
"""

import json
import time
from typing import Any

from redis.asyncio import Redis

from app.core import redis as redis_mod
from app.core.config import settings

VALID_STATUSES = {"focusing", "break", "idle"}


def _client(redis: Redis | None) -> Redis:
    # Resolve at call time (not import) so tests can inject a loop-bound client.
    return redis or redis_mod.redis_client


def _key(room_id: str) -> str:
    return f"room:{room_id}:members"


def _now() -> float:
    return time.time()


async def add_member(
    room_id: str,
    user_id: str,
    display_name: str,
    character: dict[str, Any] | None = None,
    status: str = "focusing",
    *,
    redis: Redis | None = None,
) -> dict[str, Any]:
    r = _client(redis)
    now = _now()
    # Preserve original join time on reconnect.
    existing = await get_member(room_id, user_id, redis=r)
    member = {
        "user_id": user_id,
        "display_name": display_name,
        "character": character or {},
        "status": status if status in VALID_STATUSES else "focusing",
        "joined_at": existing["joined_at"] if existing else now,
        "last_seen": now,
    }
    await r.hset(_key(room_id), user_id, json.dumps(member))
    return member


async def update_status(
    room_id: str, user_id: str, status: str, *, redis: Redis | None = None
) -> dict[str, Any] | None:
    r = _client(redis)
    member = await get_member(room_id, user_id, redis=r)
    if member is None:
        return None
    member["status"] = status
    member["last_seen"] = _now()
    await r.hset(_key(room_id), user_id, json.dumps(member))
    return member


async def heartbeat(
    room_id: str, user_id: str, *, redis: Redis | None = None
) -> bool:
    r = _client(redis)
    member = await get_member(room_id, user_id, redis=r)
    if member is None:
        return False
    member["last_seen"] = _now()
    await r.hset(_key(room_id), user_id, json.dumps(member))
    return True


async def remove_member(
    room_id: str, user_id: str, *, redis: Redis | None = None
) -> None:
    r = _client(redis)
    await r.hdel(_key(room_id), user_id)


async def get_member(
    room_id: str, user_id: str, *, redis: Redis | None = None
) -> dict[str, Any] | None:
    r = _client(redis)
    raw = await r.hget(_key(room_id), user_id)
    return json.loads(raw) if raw else None


async def list_members(
    room_id: str, *, redis: Redis | None = None
) -> list[dict[str, Any]]:
    """Live members, sorted by join time. Stale members are pruned in place."""
    r = _client(redis)
    raw = await r.hgetall(_key(room_id))
    now = _now()
    live: list[dict[str, Any]] = []
    stale: list[str] = []
    for user_id, value in raw.items():
        member = json.loads(value)
        if now - member.get("last_seen", 0) > settings.presence_ttl_seconds:
            stale.append(user_id)
        else:
            live.append(member)
    if stale:
        await r.hdel(_key(room_id), *stale)
    live.sort(key=lambda m: m["joined_at"])
    return live


async def member_count(room_id: str, *, redis: Redis | None = None) -> int:
    return len(await list_members(room_id, redis=redis))


async def member_counts(
    room_ids: list[str], *, redis: Redis | None = None
) -> dict[str, int]:
    """Live member count for many rooms in one pipelined round trip.

    Read-only: stale members are excluded from the count but not pruned
    (list_members handles pruning on the hot per-room path).
    """
    if not room_ids:
        return {}
    r = _client(redis)
    pipe = r.pipeline(transaction=False)
    for room_id in room_ids:
        pipe.hgetall(_key(room_id))
    hashes = await pipe.execute()
    now = _now()
    counts: dict[str, int] = {}
    for room_id, raw in zip(room_ids, hashes):
        live = 0
        for value in raw.values():
            member = json.loads(value)
            if now - member.get("last_seen", 0) <= settings.presence_ttl_seconds:
                live += 1
        counts[room_id] = live
    return counts
