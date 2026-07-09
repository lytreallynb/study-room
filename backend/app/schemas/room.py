"""Room request + response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    capacity: int = Field(default=50, ge=1, le=500)
    is_public: bool = True


class RoomRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    owner_id: UUID
    capacity: int
    is_public: bool
    created_at: datetime


class RoomWithOccupancy(RoomRead):
    # Live member count from Redis presence; 0 when the room is dark.
    occupancy: int = 0
