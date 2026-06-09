"""A/B experiment + feature-flag endpoints."""

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.experiment import Experiment
from app.schemas.experiment import (
    AssignmentRead,
    ExperimentCreate,
    ExperimentRead,
    FlagState,
    FlagUpsert,
    MetricCreate,
    VariantResult,
)
from app.services import experiments as svc

router = APIRouter(prefix="/experiments", tags=["experiments"])
flags_router = APIRouter(prefix="/flags", tags=["flags"])


async def _require_experiment(db: DbSession, key: str) -> Experiment:
    experiment = await svc.get_experiment(db, key)
    if experiment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experiment not found")
    return experiment


@router.post("", response_model=ExperimentRead, status_code=status.HTTP_201_CREATED)
async def create_experiment(
    payload: ExperimentCreate, current_user: CurrentUser, db: DbSession
) -> Experiment:
    existing = await db.execute(
        select(Experiment).where(Experiment.key == payload.key)
    )
    if existing.scalars().first() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Experiment key already exists")
    experiment = Experiment(
        key=payload.key, name=payload.name, variants=payload.variants
    )
    db.add(experiment)
    await db.commit()
    await db.refresh(experiment)
    return experiment


@router.get("/{key}/assignment", response_model=AssignmentRead)
async def get_assignment(
    key: str, current_user: CurrentUser, db: DbSession
) -> AssignmentRead:
    """Deterministically assign the caller to a variant (logging an exposure on
    first call) and return it. Repeat calls return the same variant."""
    experiment = await _require_experiment(db, key)
    assignment, _ = await svc.get_or_assign(db, current_user, experiment)
    return AssignmentRead(experiment_key=key, variant=assignment.variant)


@router.post("/{key}/metric", status_code=status.HTTP_204_NO_CONTENT)
async def log_metric(
    key: str, payload: MetricCreate, current_user: CurrentUser, db: DbSession
) -> None:
    experiment = await _require_experiment(db, key)
    await svc.log_metric(db, current_user, experiment, payload.event_type, payload.value)


@router.get("/{key}/results", response_model=list[VariantResult])
async def results(
    key: str, current_user: CurrentUser, db: DbSession
) -> list[dict]:
    experiment = await _require_experiment(db, key)
    return await svc.compute_results(db, experiment)


@flags_router.post("", response_model=FlagState)
async def upsert_flag(
    payload: FlagUpsert, current_user: CurrentUser, db: DbSession
) -> FlagState:
    flag = await svc.upsert_flag(db, payload.key, payload.enabled, payload.rollout_pct)
    # Echo how it evaluates for the caller.
    enabled = await svc.evaluate_flag(db, flag.key, current_user)
    return FlagState(key=flag.key, enabled=enabled)


@flags_router.get("/{key}", response_model=FlagState)
async def get_flag(key: str, current_user: CurrentUser, db: DbSession) -> FlagState:
    enabled = await svc.evaluate_flag(db, key, current_user)
    return FlagState(key=key, enabled=enabled)
