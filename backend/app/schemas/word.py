"""Vocabulary practice request + response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.session import RewardRead


class PracticeCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    term: str
    pos: str
    definition: str
    translation: str
    example: str
    # Leitner box if the user has seen this card before (1..5), else None.
    box: int | None = None


class ReviewRequest(BaseModel):
    known: bool


class ReviewResult(BaseModel):
    word_id: UUID
    box: int
    due_at: datetime
    correct_count: int
    wrong_count: int
    reward: RewardRead
