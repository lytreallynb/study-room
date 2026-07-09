"""SQLAlchemy models. Import every model here so Alembic autogenerate and
metadata.create_all() see the full schema."""

from app.models.aggregate import DailyStudyAggregate
from app.models.base import Base
from app.models.experiment import (
    Experiment,
    ExperimentAssignment,
    FeatureFlag,
    MetricEvent,
    MetricEventType,
)
from app.models.room import Room
from app.models.session import (
    SessionEvent,
    SessionEventType,
    SessionStatus,
    StudySession,
)
from app.models.user import User
from app.models.word import UserWordProgress, Word

__all__ = [
    "Base",
    "User",
    "Room",
    "StudySession",
    "SessionEvent",
    "SessionStatus",
    "SessionEventType",
    "DailyStudyAggregate",
    "Experiment",
    "ExperimentAssignment",
    "MetricEvent",
    "MetricEventType",
    "FeatureFlag",
    "Word",
    "UserWordProgress",
]
