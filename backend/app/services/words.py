"""Vocabulary practice: deck seeding, card selection, Leitner reviews.

Selection order for a practice batch: cards already in progress that are due
now (oldest due first), then unseen words. Reviewing grants XP/coins through
app.services.rewards (server-side, like session rewards).
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.word import UserWordProgress, Word

WORDS_PATH = Path(__file__).resolve().parent.parent / "data" / "words.json"

# Box 1..5 review intervals. Box 1 repeats within the same study session.
BOX_INTERVALS = [
    timedelta(minutes=10),
    timedelta(days=1),
    timedelta(days=3),
    timedelta(days=7),
    timedelta(days=30),
]
MAX_BOX = len(BOX_INTERVALS)


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def ensure_seeded(db: AsyncSession) -> None:
    """Load the bundled deck once. Idempotent and cheap when already seeded."""
    count = (await db.execute(select(func.count(Word.id)))).scalar_one()
    if count > 0:
        return
    deck = json.loads(WORDS_PATH.read_text(encoding="utf-8"))
    for entry in deck:
        db.add(Word(**entry))
    await db.commit()


async def practice_batch(
    db: AsyncSession, user: User, limit: int
) -> list[tuple[Word, UserWordProgress | None]]:
    await ensure_seeded(db)
    now = _now()

    due = await db.execute(
        select(Word, UserWordProgress)
        .join(UserWordProgress, UserWordProgress.word_id == Word.id)
        .where(
            UserWordProgress.user_id == user.id,
            UserWordProgress.due_at <= now,
        )
        .order_by(UserWordProgress.due_at)
        .limit(limit)
    )
    batch: list[tuple[Word, UserWordProgress | None]] = [
        (w, p) for w, p in due.all()
    ]

    remaining = limit - len(batch)
    if remaining > 0:
        seen = select(UserWordProgress.word_id).where(
            UserWordProgress.user_id == user.id
        )
        fresh = await db.execute(
            select(Word)
            .where(Word.id.not_in(seen))
            .order_by(Word.term)
            .limit(remaining)
        )
        batch.extend((w, None) for w in fresh.scalars().all())

    return batch


async def review_word(
    db: AsyncSession, user: User, word_id: UUID, known: bool
) -> UserWordProgress:
    word = await db.get(Word, word_id)
    if word is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Word not found")

    result = await db.execute(
        select(UserWordProgress).where(
            UserWordProgress.user_id == user.id,
            UserWordProgress.word_id == word_id,
        )
    )
    progress = result.scalars().first()
    now = _now()
    if progress is None:
        # Explicit values: column defaults only apply at flush, and we
        # increment these fields before that.
        progress = UserWordProgress(
            user_id=user.id,
            word_id=word_id,
            box=1,
            due_at=now,
            correct_count=0,
            wrong_count=0,
        )
        db.add(progress)

    if known:
        progress.box = min(progress.box + 1, MAX_BOX)
        progress.correct_count += 1
    else:
        progress.box = 1
        progress.wrong_count += 1
    progress.due_at = now + BOX_INTERVALS[progress.box - 1]
    return progress


async def total_correct_reviews(db: AsyncSession, user: User) -> int:
    """Lifetime correct reviews across all cards (drives the coin cadence)."""
    result = await db.execute(
        select(func.coalesce(func.sum(UserWordProgress.correct_count), 0)).where(
            UserWordProgress.user_id == user.id
        )
    )
    return int(result.scalar_one())
