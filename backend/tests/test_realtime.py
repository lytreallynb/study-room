"""Realtime presence tests.

Servers are run in-process via uvicorn on ephemeral ports in the test's own
event loop, and driven with real ``socketio.AsyncClient`` connections. The
headline test (`test_presence_fans_out_across_instances`) runs TWO servers on
ONE Redis to prove the AsyncRedisManager pub/sub fan-out: a status change on
instance #1 is delivered to a client connected to instance #2.
"""

import asyncio
import contextlib

import pytest
import socketio
import uvicorn
from redis.asyncio import from_url as redis_from_url
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core import db
from app.core import redis as redis_mod
from app.core.config import settings
from app.core.security import create_access_token
from app.models.room import Room
from app.models.user import User
from app.realtime.server import build_server


# --------------------------------------------------------------------------- #
# Infrastructure helpers
# --------------------------------------------------------------------------- #
async def _start_server(port: int):
    app = socketio.ASGIApp(build_server())
    config = uvicorn.Config(
        app, host="127.0.0.1", port=port, log_level="warning", lifespan="off"
    )
    server = uvicorn.Server(config)
    task = asyncio.create_task(server.serve())
    for _ in range(250):
        if server.started:
            break
        await asyncio.sleep(0.02)
    assert server.started, "server did not start"
    return server, task


async def _stop_server(server, task) -> None:
    server.should_exit = True
    with contextlib.suppress(asyncio.TimeoutError):
        await asyncio.wait_for(task, timeout=5)


def _new_client() -> tuple[socketio.AsyncClient, asyncio.Queue]:
    client = socketio.AsyncClient(reconnection=False)
    q: asyncio.Queue = asyncio.Queue()

    def collector(event_name: str):
        def handler(data):
            q.put_nowait((event_name, data))

        return handler

    for evt in ("room_snapshot", "presence_update", "error"):
        client.on(evt, collector(evt))
    return client, q


async def _wait_for(q: asyncio.Queue, event_name: str, timeout: float = 5.0):
    async def _consume():
        while True:
            etype, data = await q.get()
            if etype == event_name:
                return data

    return await asyncio.wait_for(_consume(), timeout)


# --------------------------------------------------------------------------- #
# Fixture: test DB seeding + loop-bound Redis client
# --------------------------------------------------------------------------- #
@pytest.fixture
async def rt_env(engine):
    # Realtime handlers look up users/rooms via db.SessionFactory — point it at
    # the test DB for the duration of the test.
    factory = async_sessionmaker(engine, expire_on_commit=False)
    orig_factory = db.SessionFactory
    db.SessionFactory = factory

    # Fresh Redis client bound to *this* test's event loop.
    orig_redis = redis_mod.redis_client
    rds = redis_from_url(settings.redis_url, decode_responses=True)
    redis_mod.redis_client = rds
    await rds.flushdb()

    async with factory() as s:
        mia = User(email="mia@example.com", hashed_password="x", display_name="Mia")
        leo = User(email="leo@example.com", hashed_password="x", display_name="Leo")
        s.add_all([mia, leo])
        await s.flush()
        room = Room(name="Late Night Library", owner_id=mia.id, capacity=50)
        s.add(room)
        await s.commit()
        env = {
            "room_id": str(room.id),
            "token_mia": create_access_token(mia.id),
            "token_leo": create_access_token(leo.id),
        }

    yield env

    db.SessionFactory = orig_factory
    await rds.flushdb()
    await rds.aclose()
    redis_mod.redis_client = orig_redis


# --------------------------------------------------------------------------- #
# Tests
# --------------------------------------------------------------------------- #
async def test_connect_requires_valid_token(rt_env) -> None:
    server, task = await _start_server(8401)
    client, _ = _new_client()
    try:
        with pytest.raises(socketio.exceptions.ConnectionError):
            await client.connect(
                "http://127.0.0.1:8401", auth={"token": "not-a-jwt"}, wait_timeout=5
            )
    finally:
        if client.connected:
            await client.disconnect()
        await _stop_server(server, task)


async def test_join_and_status_broadcast_single_instance(rt_env) -> None:
    server, task = await _start_server(8402)
    a, qa = _new_client()
    b, qb = _new_client()
    try:
        await a.connect(
            "http://127.0.0.1:8402", auth={"token": rt_env["token_mia"]}, wait_timeout=5
        )
        await a.emit("join_room", {"room_id": rt_env["room_id"]})
        snap = await _wait_for(qa, "room_snapshot")
        assert len(snap["members"]) == 1  # just Mia

        # B joins -> A should see a join delta.
        await b.connect(
            "http://127.0.0.1:8402", auth={"token": rt_env["token_leo"]}, wait_timeout=5
        )
        await b.emit("join_room", {"room_id": rt_env["room_id"]})
        join_evt = await _wait_for(qa, "presence_update")
        assert join_evt["event"] == "join"
        assert join_evt["member"]["display_name"] == "Leo"

        # B changes status -> A sees it.
        await b.emit(
            "set_status", {"room_id": rt_env["room_id"], "status": "break"}
        )
        status_evt = await _wait_for(qa, "presence_update")
        assert status_evt["event"] == "status"
        assert status_evt["member"]["status"] == "break"

        # B disconnects -> A sees a leave.
        await b.disconnect()
        leave_evt = await _wait_for(qa, "presence_update")
        assert leave_evt["event"] == "leave"
    finally:
        for c in (a, b):
            if c.connected:
                await c.disconnect()
        await _stop_server(server, task)


async def test_presence_fans_out_across_instances(rt_env) -> None:
    """The distributed-systems proof: two servers, one Redis. A broadcast on
    instance #1 reaches a client connected to instance #2 via Redis Pub/Sub."""
    s1, t1 = await _start_server(8403)
    s2, t2 = await _start_server(8404)
    a, qa = _new_client()  # connects to instance #1
    b, qb = _new_client()  # connects to instance #2
    try:
        await a.connect(
            "http://127.0.0.1:8403", auth={"token": rt_env["token_mia"]}, wait_timeout=5
        )
        await b.connect(
            "http://127.0.0.1:8404", auth={"token": rt_env["token_leo"]}, wait_timeout=5
        )
        await a.emit("join_room", {"room_id": rt_env["room_id"]})
        await _wait_for(qa, "room_snapshot")
        await b.emit("join_room", {"room_id": rt_env["room_id"]})
        await _wait_for(qb, "room_snapshot")

        # Drain A's join-delta for B so we isolate the next event.
        await _wait_for(qa, "presence_update")

        # A (instance #1) changes status; B (instance #2) must receive it.
        await a.emit(
            "set_status", {"room_id": rt_env["room_id"], "status": "focusing"}
        )
        evt = await _wait_for(qb, "presence_update", timeout=8)
        assert evt["event"] == "status"
        assert evt["member"]["display_name"] == "Mia"
        assert evt["member"]["status"] == "focusing"
    finally:
        for c in (a, b):
            if c.connected:
                await c.disconnect()
        await _stop_server(s1, t1)
        await _stop_server(s2, t2)
