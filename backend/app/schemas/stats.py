"""Analytics response schemas."""

from datetime import date as date_type
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DailyStatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date_type
    total_focus_seconds: int
    sessions_count: int
    completion_rate: float


class MyStats(BaseModel):
    total_focus_seconds: int
    total_sessions: int
    days: list[DailyStatRead]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    display_name: str
    focus_seconds: int
