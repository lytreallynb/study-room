"""Study session lifecycle with server-side time accounting (anti-cheat).

The client only triggers transitions (start / pause / resume / end). The amount
of focused time is computed exclusively from the server clock: every active
stretch contributes ``now - last_resumed_at`` to ``focus_seconds``. The client
cannot inflate study time because it never supplies a duration.

Every transition also appends an immutable row to ``session_events`` — an audit
log that later powers analytics (Phase 3) and experiment metrics (Phase 4).
"""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.metrics import sessions_started_total
from app.models.room import Room
from app.models.session import (
    SessionEvent,
    SessionEventType,
    SessionStatus,
    StudySession,
)
from app.models.user import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _accumulate(session: StudySession, at: datetime) -> None:
    """Add the elapsed active stretch (server-measured) to focus_seconds."""
    if session.last_resumed_at is not None:
        started = session.last_resumed_at
        if started.tzinfo is None:  # DB may hand back naive UTC
            started = started.replace(tzinfo=timezone.utc)
        elapsed = (at - started).total_seconds()
        if elapsed > 0:
            session.focus_seconds += int(elapsed)


async def _get_owned_session(
    db: AsyncSession, user: User, session_id: UUID
) -> StudySession:
    session = await db.get(StudySession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


async def _active_session(db: AsyncSession, user: User) -> StudySession | None:
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == user.id,
            StudySession.status != SessionStatus.ended,
        )
    )
    return result.scalars().first()


async def start_session(
    db: AsyncSession, user: User, room_id: UUID | None
) -> StudySession:
    if await _active_session(db, user) is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "You already have an in-progress session; end it first.",
        )

    if room_id is not None and await db.get(Room, room_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")

    now = _now()
    session = StudySession(
        user_id=user.id,
        room_id=room_id,
        status=SessionStatus.active,
        started_at=now,
        last_resumed_at=now,
        focus_seconds=0,
    )
    db.add(session)
    await db.flush()
    db.add(SessionEvent(session_id=session.id, type=SessionEventType.start, ts=now))
    await db.commit()
    await db.refresh(session)
    sessions_started_total.inc()
    return session


async def pause_session(
    db: AsyncSession, user: User, session_id: UUID
) -> StudySession:
    session = await _get_owned_session(db, user, session_id)
    if session.status != SessionStatus.active:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Cannot pause a {session.status.value} session"
        )

    now = _now()
    _accumulate(session, now)
    session.status = SessionStatus.paused
    session.last_resumed_at = None
    db.add(SessionEvent(session_id=session.id, type=SessionEventType.pause, ts=now))
    await db.commit()
    await db.refresh(session)
    return session


async def resume_session(
    db: AsyncSession, user: User, session_id: UUID
) -> StudySession:
    session = await _get_owned_session(db, user, session_id)
    if session.status != SessionStatus.paused:
        raise HTTPException(
            status.HTTP_409_CONFLICT, f"Cannot resume a {session.status.value} session"
        )

    now = _now()
    session.status = SessionStatus.active
    session.last_resumed_at = now
    db.add(SessionEvent(session_id=session.id, type=SessionEventType.resume, ts=now))
    await db.commit()
    await db.refresh(session)
    return session


async def end_session(db: AsyncSession, user: User, session_id: UUID) -> StudySession:
    session = await _get_owned_session(db, user, session_id)
    if session.status == SessionStatus.ended:
        raise HTTPException(status.HTTP_409_CONFLICT, "Session already ended")

    now = _now()
    if session.status == SessionStatus.active:
        _accumulate(session, now)
    session.status = SessionStatus.ended
    session.ended_at = now
    session.last_resumed_at = None
    db.add(SessionEvent(session_id=session.id, type=SessionEventType.end, ts=now))
    await db.commit()
    await db.refresh(session)
    return session


async def list_sessions(db: AsyncSession, user: User) -> list[StudySession]:
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user.id)
        .order_by(StudySession.started_at.desc())
    )
    return list(result.scalars().all())
