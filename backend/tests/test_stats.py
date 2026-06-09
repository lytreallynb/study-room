"""Analytics endpoints: /stats/me and the cached /stats/leaderboard."""

from datetime import date

import pytest
from httpx import AsyncClient
from redis.asyncio import from_url as redis_from_url
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import redis as redis_mod
from app.core.config import settings
from app.models.aggregate import DailyStudyAggregate
from app.models.user import User
from app.workers.redis import LEADERBOARD_KEY


async def test_my_stats_sums_aggregates(
    client: AsyncClient, auth_headers: dict[str, str], db: AsyncSession
) -> None:
    ada = (
        await db.execute(select(User).where(User.email == "ada@example.com"))
    ).scalars().one()
    db.add_all(
        [
            DailyStudyAggregate(
                user_id=ada.id, date=date(2026, 6, 1),
                total_focus_seconds=3000, sessions_count=2, completion_rate=1.0,
            ),
            DailyStudyAggregate(
                user_id=ada.id, date=date(2026, 6, 2),
                total_focus_seconds=1500, sessions_count=1, completion_rate=1.0,
            ),
        ]
    )
    await db.commit()

    resp = await client.get("/stats/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_focus_seconds"] == 4500
    assert body["total_sessions"] == 3
    assert len(body["days"]) == 2
    assert body["days"][0]["date"] == "2026-06-02"  # most recent first


@pytest.fixture
async def async_redis():
    """Fresh, loop-bound Redis client patched in for the stats endpoint."""
    orig = redis_mod.redis_client
    rds = redis_from_url(settings.redis_url, decode_responses=True)
    redis_mod.redis_client = rds
    await rds.flushdb()
    yield rds
    await rds.flushdb()
    await rds.aclose()
    redis_mod.redis_client = orig


async def test_leaderboard_reads_cached_zset(
    client: AsyncClient, auth_headers: dict[str, str], db: AsyncSession, async_redis
) -> None:
    u1 = User(email="lead1@example.com", hashed_password="x", display_name="Top")
    u2 = User(email="lead2@example.com", hashed_password="x", display_name="Second")
    db.add_all([u1, u2])
    await db.commit()
    await db.refresh(u1)
    await db.refresh(u2)

    await async_redis.zadd(
        LEADERBOARD_KEY, {str(u1.id): 5000, str(u2.id): 2000}
    )

    resp = await client.get("/stats/leaderboard", headers=auth_headers)
    assert resp.status_code == 200
    board = resp.json()
    assert [e["display_name"] for e in board] == ["Top", "Second"]
    assert board[0]["rank"] == 1 and board[0]["focus_seconds"] == 5000


async def test_leaderboard_empty(
    client: AsyncClient, auth_headers: dict[str, str], async_redis
) -> None:
    resp = await client.get("/stats/leaderboard", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []
