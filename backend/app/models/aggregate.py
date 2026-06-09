"""Daily per-user study aggregates, written by the Celery aggregation task.

Pre-computing these (instead of scanning raw sessions on every request) keeps
analytics/leaderboard reads cheap — the classic batch-rollup pattern.
"""

from datetime import date as date_type
from uuid import UUID

from sqlalchemy import Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DailyStudyAggregate(Base):
    __tablename__ = "daily_study_aggregates"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    date: Mapped[date_type] = mapped_column(Date, primary_key=True)
    total_focus_seconds: Mapped[int] = mapped_column(default=0)
    sessions_count: Mapped[int] = mapped_column(default=0)
    completion_rate: Mapped[float] = mapped_column(default=0.0)
