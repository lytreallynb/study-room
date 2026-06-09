"""Analytics endpoints backed by worker-computed aggregates + cached leaderboard."""

from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core import redis as redis_mod
from app.models.aggregate import DailyStudyAggregate
from app.models.user import User
from app.schemas.stats import DailyStatRead, LeaderboardEntry, MyStats
from app.workers.redis import LEADERBOARD_KEY

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/me", response_model=MyStats)
async def my_stats(
    current_user: CurrentUser,
    db: DbSession,
    days: int = Query(default=30, ge=1, le=365),
) -> MyStats:
    result = await db.execute(
        select(DailyStudyAggregate)
        .where(DailyStudyAggregate.user_id == current_user.id)
        .order_by(DailyStudyAggregate.date.desc())
        .limit(days)
    )
    rows = list(result.scalars().all())
    return MyStats(
        total_focus_seconds=sum(r.total_focus_seconds for r in rows),
        total_sessions=sum(r.sessions_count for r in rows),
        days=[DailyStatRead.model_validate(r) for r in rows],
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    db: DbSession,
    limit: int = Query(default=10, ge=1, le=100),
) -> list[LeaderboardEntry]:
    # Cheap ranked read from the worker-maintained Redis sorted set.
    ranked = await redis_mod.redis_client.zrevrange(
        LEADERBOARD_KEY, 0, limit - 1, withscores=True
    )
    if not ranked:
        return []

    user_ids = [UUID(uid) for uid, _ in ranked]
    result = await db.execute(select(User).where(User.id.in_(user_ids)))
    names = {u.id: u.display_name for u in result.scalars().all()}

    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=UUID(uid),
            display_name=names.get(UUID(uid), "Unknown"),
            focus_seconds=int(score),
        )
        for i, (uid, score) in enumerate(ranked)
    ]
