"""Study session request + response schemas.

Note: there is no field for focus_seconds on the request — it is derived
server-side from timestamps (anti-cheat).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.session import SessionStatus


class SessionStartRequest(BaseModel):
    room_id: UUID | None = None


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    room_id: UUID | None
    status: SessionStatus
    started_at: datetime
    ended_at: datetime | None
    focus_seconds: int
