"""Celery worker tasks: daily aggregation + leaderboard caching.

Tasks run synchronously in worker processes, so these tests drive the task
functions directly against a synchronous session bound to the test DB (the
async ``engine`` fixture owns the schema).
"""

from datetime import datetime, timezone

import pytest
import redis as redislib
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.aggregate import DailyStudyAggregate
from app.models.room import Room  # noqa: F401 — ensure mapper is registered
from app.models.session import SessionStatus, StudySession
from app.models.user import User
from app.workers import db as wdb
from app.workers import redis as wredis
from app.workers.tasks import aggregate_daily_study, recompute_leaderboard

SYNC_URL = "postgresql+psycopg://studysync:studysync@localhost:5432/studysync_test"


@pytest.fixture
def sync_session(engine):  # engine (async) creates the schema in studysync_test
    sync_engine = create_engine(SYNC_URL)
    factory = sessionmaker(bind=sync_engine, expire_on_commit=False)

    orig_factory = wdb.SessionLocal
    wdb.SessionLocal = factory

    orig_redis = wredis.redis_client
    rds = redislib.Redis.from_url(settings.redis_url, decode_responses=True)
    rds.flushdb()
    wredis.redis_client = rds

    yield factory

    wdb.SessionLocal = orig_factory
    wredis.redis_client = orig_redis
    rds.flushdb()
    sync_engine.dispose()


def _seed(factory) -> tuple[str, str]:
    with factory() as s:
        u1 = User(email="w1@example.com", hashed_password="x", display_name="Mia")
        u2 = User(email="w2@example.com", hashed_password="x", display_name="Leo")
        s.add_all([u1, u2])
        s.flush()
        day = datetime(2026, 6, 1, 10, 0, tzinfo=timezone.utc)
        s.add_all(
            [
                # Mia: two completed sessions -> 3000s, completion 1.0
                StudySession(
                    user_id=u1.id, status=SessionStatus.ended,
                    started_at=day, focus_seconds=1800,
                ),
                StudySession(
                    user_id=u1.id, status=SessionStatus.ended,
                    started_at=day, focus_seconds=1200,
                ),
                # Leo: one completed + one abandoned -> 600s, completion 0.5
                StudySession(
                    user_id=u2.id, status=SessionStatus.ended,
                    started_at=day, focus_seconds=600,
                ),
                StudySession(
                    user_id=u2.id, status=SessionStatus.active,
                    started_at=day, focus_seconds=0,
                ),
            ]
        )
        s.commit()
        return str(u1.id), str(u2.id)


def test_daily_aggregation(sync_session) -> None:
    u1, u2 = _seed(sync_session)

    result = aggregate_daily_study("2026-06-01")
    assert result == {"date": "2026-06-01", "users": 2}

    with sync_session() as s:
        rows = {
            str(a.user_id): a
            for a in s.execute(select(DailyStudyAggregate)).scalars().all()
        }
    assert rows[u1].total_focus_seconds == 3000
    assert rows[u1].sessions_count == 2
    assert rows[u1].completion_rate == 1.0
    assert rows[u2].total_focus_seconds == 600
    assert rows[u2].completion_rate == 0.5


def test_aggregation_is_idempotent(sync_session) -> None:
    _seed(sync_session)
    aggregate_daily_study("2026-06-01")
    aggregate_daily_study("2026-06-01")  # re-run upserts, no duplicates
    with sync_session() as s:
        count = len(s.execute(select(DailyStudyAggregate)).scalars().all())
    assert count == 2


def test_leaderboard_zset(sync_session) -> None:
    u1, u2 = _seed(sync_session)
    aggregate_daily_study("2026-06-01")

    result = recompute_leaderboard(days=7, end_date_str="2026-06-07")
    assert result == {"entries": 2}

    ranked = wredis.redis_client.zrevrange(
        wredis.LEADERBOARD_KEY, 0, -1, withscores=True
    )
    assert ranked == [(u1, 3000.0), (u2, 600.0)]  # Mia ahead of Leo
