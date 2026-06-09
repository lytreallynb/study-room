"""Experimentation + feature-flag logic.

Bucketing is deterministic and stable across processes/runs: we hash
``"{key}:{user_id}"`` with SHA-256 (not Python's salted ``hash()``) into 0..99.
The same user always lands in the same bucket for a given key, so variant
assignment and percentage rollouts are reproducible without storing a coin flip.
"""

import hashlib
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.metrics import experiment_exposures_total
from app.models.experiment import (
    Experiment,
    ExperimentAssignment,
    FeatureFlag,
    MetricEvent,
    MetricEventType,
)
from app.models.user import User


def bucket(user_id: str, key: str) -> int:
    """Stable bucket in [0, 100) for a (user, key) pair."""
    digest = hashlib.sha256(f"{key}:{user_id}".encode()).hexdigest()
    return int(digest, 16) % 100


def variant_for_bucket(b: int, variants: list[str]) -> str:
    """Map a bucket to a variant via an even split across variants."""
    idx = b * len(variants) // 100
    return variants[min(idx, len(variants) - 1)]


async def get_experiment(db: AsyncSession, key: str) -> Experiment | None:
    result = await db.execute(select(Experiment).where(Experiment.key == key))
    return result.scalars().first()


async def get_or_assign(
    db: AsyncSession, user: User, experiment: Experiment
) -> tuple[ExperimentAssignment, bool]:
    """Return the user's assignment, creating + logging an exposure on first call."""
    existing = await db.execute(
        select(ExperimentAssignment).where(
            ExperimentAssignment.user_id == user.id,
            ExperimentAssignment.experiment_key == experiment.key,
        )
    )
    assignment = existing.scalars().first()
    if assignment is not None:
        return assignment, False

    variant = variant_for_bucket(
        bucket(str(user.id), experiment.key), experiment.variants
    )
    assignment = ExperimentAssignment(
        user_id=user.id, experiment_key=experiment.key, variant=variant
    )
    db.add(assignment)
    db.add(
        MetricEvent(
            user_id=user.id,
            experiment_key=experiment.key,
            variant=variant,
            event_type=MetricEventType.exposure.value,
        )
    )
    await db.commit()
    await db.refresh(assignment)
    experiment_exposures_total.labels(
        experiment=experiment.key, variant=variant
    ).inc()
    return assignment, True


async def log_metric(
    db: AsyncSession,
    user: User,
    experiment: Experiment,
    event_type: str,
    value: float = 1.0,
) -> None:
    """Log an outcome event, tagged with the user's current variant."""
    assignment, _ = await get_or_assign(db, user, experiment)
    db.add(
        MetricEvent(
            user_id=user.id,
            experiment_key=experiment.key,
            variant=assignment.variant,
            event_type=event_type,
            value=value,
        )
    )
    await db.commit()


async def compute_results(
    db: AsyncSession,
    experiment: Experiment,
    goal_event: str = MetricEventType.session_completed.value,
) -> list[dict]:
    """Per-variant exposures, goal completions, and completion rate."""
    rows = await db.execute(
        select(
            MetricEvent.variant,
            MetricEvent.event_type,
            func.count(),
        )
        .where(MetricEvent.experiment_key == experiment.key)
        .group_by(MetricEvent.variant, MetricEvent.event_type)
    )
    counts: dict[str, dict[str, int]] = {v: {} for v in experiment.variants}
    for variant, event_type, n in rows:
        counts.setdefault(variant, {})[event_type] = n

    results = []
    for variant in experiment.variants:
        exposures = counts.get(variant, {}).get(MetricEventType.exposure.value, 0)
        completions = counts.get(variant, {}).get(goal_event, 0)
        results.append(
            {
                "variant": variant,
                "exposures": exposures,
                "completions": completions,
                "completion_rate": (completions / exposures) if exposures else 0.0,
            }
        )
    return results


# --------------------------------------------------------------------------- #
# Feature flags
# --------------------------------------------------------------------------- #
async def evaluate_flag(db: AsyncSession, key: str, user: User) -> bool:
    flag = await db.get(FeatureFlag, key)
    if flag is None or not flag.enabled:
        return False
    if flag.rollout_pct >= 100:
        return True
    if flag.rollout_pct <= 0:
        return False
    return bucket(str(user.id), key) < flag.rollout_pct


async def upsert_flag(
    db: AsyncSession, key: str, enabled: bool, rollout_pct: int
) -> FeatureFlag:
    flag = await db.get(FeatureFlag, key)
    if flag is None:
        flag = FeatureFlag(key=key, enabled=enabled, rollout_pct=rollout_pct)
        db.add(flag)
    else:
        flag.enabled = enabled
        flag.rollout_pct = rollout_pct
    await db.commit()
    await db.refresh(flag)
    return flag
