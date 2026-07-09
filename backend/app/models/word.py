"""Vocabulary deck + per-user spaced-repetition progress.

Words are a shared deck (seeded from app/data/words.json). Each user's
progress on a word is a Leitner box 1..5: a correct review moves the card up
a box and pushes the due date out; a miss sends it back to box 1, due now.
"""

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Word(Base):
    __tablename__ = "words"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    term: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    pos: Mapped[str] = mapped_column(String(20))  # part of speech
    definition: Mapped[str] = mapped_column(String(400))
    translation: Mapped[str] = mapped_column(String(120))  # zh-CN
    example: Mapped[str] = mapped_column(String(400))


class UserWordProgress(Base, TimestampMixin):
    __tablename__ = "user_word_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    word_id: Mapped[UUID] = mapped_column(
        ForeignKey("words.id", ondelete="CASCADE"), index=True
    )

    box: Mapped[int] = mapped_column(default=1)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    correct_count: Mapped[int] = mapped_column(default=0)
    wrong_count: Mapped[int] = mapped_column(default=0)
