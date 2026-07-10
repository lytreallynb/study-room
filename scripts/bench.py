"""Reproducible local benchmark for StudySync: REST read path + realtime fan-out.

Measures two things against a locally running stack (API :8010, realtime
:8001 and :8002 sharing one Redis):

1. HTTP: sustained GET /rooms (authenticated read hitting Postgres) with C
   concurrent workers for D seconds -> throughput and latency percentiles.
2. Realtime: N Socket.IO clients (distinct users) split across the two
   realtime instances join one room; one actor flips its presence status
   K times; every other client timestamps the matching presence_update.
   Delivery latency covers server processing + Redis pub/sub cross-instance
   hop + websocket delivery.

Run (API and both realtime instances must be up):
    cd backend && uv run python ../scripts/bench.py
    cd backend && uv run python ../scripts/bench.py --clients 150 --flips 10

Results are printed as markdown; paste into scripts/bench_results.md when
re-running so resume claims stay traceable to a dated run.
"""

from __future__ import annotations

import argparse
import asyncio
import statistics
import time

import httpx
import socketio

API = "http://localhost:8010"
REALTIME = ["http://localhost:8001", "http://localhost:8002"]
PASSWORD = "bench-password-123"


def pct(values: list[float], p: float) -> float:
    if not values:
        return float("nan")
    values = sorted(values)
    idx = min(len(values) - 1, max(0, round(p / 100 * (len(values) - 1))))
    return values[idx]


async def ensure_user(client: httpx.AsyncClient, i: int) -> str:
    """Register-or-login one bench user, return its access token.

    /auth/register returns the User (no token), so always log in after.
    """
    email = f"bench{i:04d}@example.com"
    for attempt in range(3):
        try:
            await client.post(
                "/auth/register",
                json={
                    "email": email,
                    "password": PASSWORD,
                    "display_name": f"bench{i:04d}",
                },
            )
            resp = await client.post(
                "/auth/login", json={"email": email, "password": PASSWORD}
            )
            resp.raise_for_status()
            return resp.json()["access_token"]
        except httpx.HTTPError:
            if attempt == 2:
                raise
            await asyncio.sleep(0.5 * (attempt + 1))
    raise RuntimeError("unreachable")


async def make_tokens(n: int) -> list[str]:
    async with httpx.AsyncClient(base_url=API, timeout=30) as client:
        sem = asyncio.Semaphore(8)

        async def one(i: int) -> str:
            async with sem:
                return await ensure_user(client, i)

        return list(await asyncio.gather(*(one(i) for i in range(n))))


async def bench_http(token: str, concurrency: int, duration: float) -> dict:
    """Hammer GET /rooms for `duration` seconds with `concurrency` workers."""
    headers = {"Authorization": f"Bearer {token}"}
    latencies: list[float] = []
    errors = 0
    deadline = time.perf_counter() + duration

    async with httpx.AsyncClient(base_url=API, headers=headers, timeout=10) as client:

        async def worker() -> None:
            nonlocal errors
            while time.perf_counter() < deadline:
                t0 = time.perf_counter()
                try:
                    r = await client.get("/rooms")
                    if r.status_code != 200:
                        errors += 1
                        continue
                except httpx.HTTPError:
                    errors += 1
                    continue
                latencies.append((time.perf_counter() - t0) * 1000)

        await asyncio.gather(*(worker() for _ in range(concurrency)))

    return {
        "requests": len(latencies),
        "errors": errors,
        "rps": len(latencies) / duration,
        "p50": pct(latencies, 50),
        "p95": pct(latencies, 95),
        "p99": pct(latencies, 99),
    }


async def bench_realtime(
    tokens: list[str], room_id: str, flips: int, flip_gap: float
) -> dict:
    """N clients join one room across two instances; measure fan-out latency."""
    n = len(tokens)
    clients: list[socketio.AsyncClient] = []
    joined = [asyncio.Event() for _ in range(n)]
    # deliveries[flip_index] -> list of per-client latencies (ms)
    deliveries: list[list[float]] = [[] for _ in range(flips)]
    flip_sent_at: list[float] = [0.0] * flips
    flip_status: list[str] = [
        "focusing" if k % 2 == 0 else "break" for k in range(flips)
    ]
    actor_user_id: str | None = None
    flip_cursor = [0] * n  # next flip index each client expects

    for i, token in enumerate(tokens):
        sio = socketio.AsyncClient(reconnection=False)

        def on_snapshot(_data: dict, i: int = i) -> None:
            joined[i].set()

        def on_presence(data: dict, i: int = i) -> None:
            member = data.get("member") or {}
            if data.get("event") != "status" or member.get("user_id") != actor_user_id:
                return
            k = flip_cursor[i]
            if k < flips and member.get("status") == flip_status[k]:
                deliveries[k].append((time.perf_counter() - flip_sent_at[k]) * 1000)
                flip_cursor[i] = k + 1

        sio.on("room_snapshot", on_snapshot)
        sio.on("presence_update", on_presence)
        clients.append(sio)

    t_connect0 = time.perf_counter()
    sem = asyncio.Semaphore(20)

    async def connect_and_join(i: int) -> None:
        async with sem:
            await clients[i].connect(
                REALTIME[i % len(REALTIME)],
                auth={"token": tokens[i]},
                transports=["websocket"],
            )
            await clients[i].emit("join_room", {"room_id": room_id, "status": "idle"})

    await asyncio.gather(*(connect_and_join(i) for i in range(n)))
    await asyncio.wait_for(
        asyncio.gather(*(e.wait() for e in joined)), timeout=30
    )
    connect_secs = time.perf_counter() - t_connect0

    # Resolve the actor's user id from the JWT payload via the API.
    async with httpx.AsyncClient(base_url=API, timeout=10) as api:
        me = await api.get(
            "/auth/me", headers={"Authorization": f"Bearer {tokens[0]}"}
        )
        actor_user_id = me.json()["id"]

    # The actor flips status; everyone else timestamps the broadcast.
    for k in range(flips):
        flip_sent_at[k] = time.perf_counter()
        await clients[0].emit(
            "set_status", {"room_id": room_id, "status": flip_status[k]}
        )
        await asyncio.sleep(flip_gap)

    await asyncio.sleep(2)  # let stragglers arrive
    all_lat = [x for per_flip in deliveries for x in per_flip]
    # set_status broadcasts to the whole room, actor included.
    expected = flips * n

    for sio in clients:
        try:
            await sio.disconnect()
        except Exception:  # noqa: BLE001 — teardown best-effort
            pass

    return {
        "clients": n,
        "instances": len(REALTIME),
        "connect_join_secs": connect_secs,
        "flips": flips,
        "expected_deliveries": expected,
        "received_deliveries": len(all_lat),
        "delivery_rate": len(all_lat) / expected if expected else 0.0,
        "p50": pct(all_lat, 50),
        "p95": pct(all_lat, 95),
        "max": max(all_lat) if all_lat else float("nan"),
    }


async def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--clients", type=int, default=150)
    ap.add_argument("--flips", type=int, default=10)
    ap.add_argument("--flip-gap", type=float, default=0.8)
    ap.add_argument("--http-concurrency", type=int, default=50)
    ap.add_argument("--http-seconds", type=float, default=20)
    args = ap.parse_args()

    print(f"provisioning {args.clients} bench users...")
    tokens = await make_tokens(args.clients)

    async with httpx.AsyncClient(base_url=API, timeout=10) as api:
        room = await api.post(
            "/rooms",
            json={"name": "bench room", "capacity": 500, "is_public": True},
            headers={"Authorization": f"Bearer {tokens[0]}"},
        )
        room.raise_for_status()
        room_id = room.json()["id"]

    print("running HTTP benchmark...")
    http = await bench_http(tokens[0], args.http_concurrency, args.http_seconds)

    print("running realtime benchmark...")
    rt = await bench_realtime(tokens, room_id, args.flips, args.flip_gap)

    print("\n## StudySync local benchmark")
    print(f"date: {time.strftime('%Y-%m-%d')}  |  host: local dev (single uvicorn worker per service)")
    print()
    print(f"### HTTP GET /rooms ({args.http_concurrency} concurrent, {args.http_seconds:.0f}s)")
    print(f"- requests: {http['requests']}  errors: {http['errors']}")
    print(f"- throughput: {http['rps']:.0f} req/s")
    print(f"- latency ms: p50 {http['p50']:.1f} / p95 {http['p95']:.1f} / p99 {http['p99']:.1f}")
    print()
    print(f"### Realtime presence fan-out ({rt['clients']} clients, {rt['instances']} instances)")
    print(f"- connect+join all clients: {rt['connect_join_secs']:.1f}s")
    print(f"- status flips: {rt['flips']}  deliveries: {rt['received_deliveries']}/{rt['expected_deliveries']} ({rt['delivery_rate'] * 100:.1f}%)")
    print(f"- delivery latency ms: p50 {rt['p50']:.1f} / p95 {rt['p95']:.1f} / max {rt['max']:.1f}")


if __name__ == "__main__":
    asyncio.run(main())
