"""Study session lifecycle endpoints. Business logic + anti-cheat time
accounting live in app/services/sessions.py."""

from uuid import UUID

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.session import SessionRead, SessionStartRequest
from app.services import sessions as svc

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def start_session(
    payload: SessionStartRequest, current_user: CurrentUser, db: DbSession
):
    return await svc.start_session(db, current_user, payload.room_id)


@router.post("/{session_id}/pause", response_model=SessionRead)
async def pause_session(session_id: UUID, current_user: CurrentUser, db: DbSession):
    return await svc.pause_session(db, current_user, session_id)


@router.post("/{session_id}/resume", response_model=SessionRead)
async def resume_session(session_id: UUID, current_user: CurrentUser, db: DbSession):
    return await svc.resume_session(db, current_user, session_id)


@router.post("/{session_id}/end", response_model=SessionRead)
async def end_session(session_id: UUID, current_user: CurrentUser, db: DbSession):
    return await svc.end_session(db, current_user, session_id)


@router.get("", response_model=list[SessionRead])
async def session_history(current_user: CurrentUser, db: DbSession):
    return await svc.list_sessions(db, current_user)
