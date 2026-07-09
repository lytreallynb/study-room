"""Vocabulary practice endpoints (flashcards during focus sessions)."""

from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.session import RewardRead
from app.schemas.word import PracticeCard, ReviewRequest, ReviewResult
from app.services import rewards, words as svc

router = APIRouter(prefix="/words", tags=["words"])


@router.get("/practice", response_model=list[PracticeCard])
async def practice(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=10, ge=1, le=50),
) -> list[PracticeCard]:
    batch = await svc.practice_batch(db, current_user, limit)
    return [
        PracticeCard(
            id=word.id,
            term=word.term,
            pos=word.pos,
            definition=word.definition,
            translation=word.translation,
            example=word.example,
            box=progress.box if progress else None,
        )
        for word, progress in batch
    ]


@router.post("/{word_id}/review", response_model=ReviewResult)
async def review(
    word_id: UUID,
    payload: ReviewRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ReviewResult:
    progress = await svc.review_word(db, current_user, word_id, payload.known)
    total_correct = await svc.total_correct_reviews(db, current_user)
    reward = rewards.grant_review_reward(current_user, payload.known, total_correct)
    await db.commit()
    return ReviewResult(
        word_id=word_id,
        box=progress.box,
        due_at=progress.due_at,
        correct_count=progress.correct_count,
        wrong_count=progress.wrong_count,
        reward=RewardRead.model_validate(reward),
    )
