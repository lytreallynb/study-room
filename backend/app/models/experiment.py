"""A/B experiments, deterministic assignments, metric event log, feature flags.

Mirrors a real experimentation backend: users are bucketed deterministically
into variants, exposures + outcome events are logged immutably, and results are
aggregated per variant. Feature flags support percentage rollouts.
"""

import enum
import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class MetricEventType(str, enum.Enum):
    exposure = "exposure"
    session_completed = "session_completed"


class Experiment(Base, TimestampMixin):
    __tablename__ = "experiments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    # Ordered list of variant names, e.g. ["control", "reminder"].
    variants: Mapped[list] = mapped_column(JSONB)
    active: Mapped[bool] = mapped_column(default=True)


class ExperimentAssignment(Base):
    __tablename__ = "experiment_assignments"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    experiment_key: Mapped[str] = mapped_column(String(80), primary_key=True)
    variant: Mapped[str] = mapped_column(String(80))
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class MetricEvent(Base):
    __tablename__ = "metric_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    experiment_key: Mapped[str] = mapped_column(String(80), index=True)
    variant: Mapped[str] = mapped_column(String(80))
    event_type: Mapped[str] = mapped_column(String(80))
    value: Mapped[float] = mapped_column(Float, default=1.0)
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class FeatureFlag(Base, TimestampMixin):
    __tablename__ = "feature_flags"

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    enabled: Mapped[bool] = mapped_column(default=False)
    # 0..100 — deterministic per-user rollout when enabled.
    rollout_pct: Mapped[int] = mapped_column(default=100)
