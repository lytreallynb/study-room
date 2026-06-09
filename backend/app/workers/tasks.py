"""Celery tasks: batch rollups of study data + leaderboard caching.

Tasks run synchronously in worker processes. They resolve their DB session and
Redis client via module attributes (``db.SessionLocal`` / ``redis.redis_client``)
so the test suite can point them at the test database / a fresh Redis client.
"""

from collections import defaultdict
from datetime import date as date_type
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.logging import get_logger
from app.models.aggregate import DailyStudyAggregate
from app.models.session import SessionStatus, StudySession
from app.workers import db, redis
from app.workers.celery_app import celery_app

log = get_logger("worker")


def _utc_day_bounds(day: date_type) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


@celery_app.task
def aggregate_daily_study(date_str: str | None = None) -> dict:
    """Roll up one day's study sessions into per-user daily aggregates.

    Defaults to yesterday (UTC). Idempotent: re-running upserts the same rows.
    """
    target = (
        date_type.fromisoformat(date_str)
        if date_str
        else (datetime.now(timezone.utc).date() - timedelta(days=1))
    )
    day_start, day_end = _utc_day_bounds(target)

    with db.SessionLocal() as session:
        sessions = (
            session.execute(
                select(StudySession).where(
                    StudySession.started_at >= day_start,
                    StudySession.started_at < day_end,
                )
            )
            .scalars()
            .all()
        )

        rollup: dict = defaultdict(lambda: {"focus": 0, "count": 0, "completed": 0})
        for s in sessions:
            r = rollup[s.user_id]
            r["focus"] += s.focus_seconds
            r["count"] += 1
            if s.status == SessionStatus.ended:
                r["completed"] += 1

        for user_id, r in rollup.items():
            completion = r["completed"] / r["count"] if r["count"] else 0.0
            stmt = pg_insert(DailyStudyAggregate).values(
                user_id=user_id,
                date=target,
                total_focus_seconds=r["focus"],
                sessions_count=r["count"],
                completion_rate=completion,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["user_id", "date"],
                set_={
                    "total_focus_seconds": stmt.excluded.total_focus_seconds,
                    "sessions_count": stmt.excluded.sessions_count,
                    "completion_rate": stmt.excluded.completion_rate,
                },
            )
            session.execute(stmt)
        session.commit()

    log.info("worker.aggregate", date=target.isoformat(), users=len(rollup))
    return {"date": target.isoformat(), "users": len(rollup)}


@celery_app.task
def recompute_leaderboard(days: int = 7, end_date_str: str | None = None) -> dict:
    """Sum focus time per user over a trailing window and cache it as a Redis
    sorted set for cheap ranked reads."""
    end = (
        date_type.fromisoformat(end_date_str)
        if end_date_str
        else datetime.now(timezone.utc).date()
    )
    start = end - timedelta(days=days - 1)

    with db.SessionLocal() as session:
        rows = session.execute(
            select(
                DailyStudyAggregate.user_id,
                DailyStudyAggregate.total_focus_seconds,
            ).where(
                DailyStudyAggregate.date >= start,
                DailyStudyAggregate.date <= end,
            )
        ).all()

    totals: dict[str, int] = defaultdict(int)
    for user_id, focus in rows:
        totals[str(user_id)] += focus

    r = redis.redis_client
    pipe = r.pipeline()
    pipe.delete(redis.LEADERBOARD_KEY)
    if totals:
        pipe.zadd(redis.LEADERBOARD_KEY, totals)
    pipe.execute()

    log.info("worker.leaderboard", entries=len(totals))
    return {"entries": len(totals)}
