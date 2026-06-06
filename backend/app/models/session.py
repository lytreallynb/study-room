"""Study session + append-only session event log.

focus_seconds is computed entirely from server clock timestamps in the session
service — the client never supplies it (anti-cheat). See app/services/sessions.py.
"""

import enum
import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SessionStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    ended = "ended"


class SessionEventType(str, enum.Enum):
    start = "start"
    pause = "pause"
    resume = "resume"
    end = "end"


class StudySession(Base, TimestampMixin):
    __tablename__ = "study_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    room_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True, index=True
    )

    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus, name="session_status"),
        default=SessionStatus.active,
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # When the current active stretch began (reset on each resume). Used to
    # accumulate focus_seconds from the server clock.
    last_resumed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Accumulated focused time, server-derived only.
    focus_seconds: Mapped[int] = mapped_column(default=0)


class SessionEvent(Base):
    __tablename__ = "session_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[UUID] = mapped_column(
        ForeignKey("study_sessions.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[SessionEventType] = mapped_column(
        Enum(SessionEventType, name="session_event_type")
    )
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True))
