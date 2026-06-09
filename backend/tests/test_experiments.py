"""A/B experiments + feature flags: deterministic bucketing, exposure/metric
logging, per-variant results, and percentage rollouts."""

from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experiment import MetricEvent
from app.models.user import User
from app.services import experiments as svc


def test_bucketing_is_stable_and_in_range() -> None:
    # Pure function: same inputs -> same bucket, always in [0, 100).
    for i in range(500):
        uid = f"user-{i}"
        b = svc.bucket(uid, "exp.focus_reminder")
        assert 0 <= b < 100
        assert b == svc.bucket(uid, "exp.focus_reminder")


def test_even_split_covers_both_variants() -> None:
    variants = ["control", "reminder"]
    seen = {svc.variant_for_bucket(svc.bucket(f"u{i}", "k"), variants) for i in range(200)}
    assert seen == {"control", "reminder"}


async def _register(client: AsyncClient, email: str) -> dict[str, str]:
    await client.post(
        "/auth/register",
        json={"email": email, "password": "password123", "display_name": email[:8]},
    )
    token = (
        await client.post(
            "/auth/login", json={"email": email, "password": "password123"}
        )
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_assignment_is_deterministic_and_logs_single_exposure(
    client: AsyncClient, auth_headers: dict[str, str], db: AsyncSession
) -> None:
    await client.post(
        "/experiments",
        json={"key": "focus_reminder", "name": "Focus reminder", "variants": ["control", "reminder"]},
        headers=auth_headers,
    )

    first = await client.get("/experiments/focus_reminder/assignment", headers=auth_headers)
    second = await client.get("/experiments/focus_reminder/assignment", headers=auth_headers)
    assert first.status_code == 200
    assert first.json()["variant"] == second.json()["variant"]

    ada = (
        await db.execute(select(User).where(User.email == "ada@example.com"))
    ).scalars().one()
    expected = svc.variant_for_bucket(
        svc.bucket(str(ada.id), "focus_reminder"), ["control", "reminder"]
    )
    assert first.json()["variant"] == expected

    # Exactly one exposure was logged despite two assignment calls.
    exposures = await db.execute(
        select(func.count())
        .select_from(MetricEvent)
        .where(
            MetricEvent.user_id == ada.id,
            MetricEvent.experiment_key == "focus_reminder",
            MetricEvent.event_type == "exposure",
        )
    )
    assert exposures.scalar() == 1


async def test_results_aggregate_exposures_and_completions(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    await client.post(
        "/experiments",
        json={"key": "exp1", "name": "Exp 1", "variants": ["a", "b"]},
        headers=auth_headers,
    )

    # 5 users exposed; 3 of them complete the goal.
    for i in range(5):
        h = await _register(client, f"p{i}@example.com")
        await client.get("/experiments/exp1/assignment", headers=h)
        if i < 3:
            await client.post(
                "/experiments/exp1/metric",
                json={"event_type": "session_completed"},
                headers=h,
            )

    res = (await client.get("/experiments/exp1/results", headers=auth_headers)).json()
    assert sum(v["exposures"] for v in res) == 5
    assert sum(v["completions"] for v in res) == 3
    for v in res:
        if v["exposures"]:
            assert v["completion_rate"] == v["completions"] / v["exposures"]


async def test_results_404_for_unknown_experiment(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    assert (
        await client.get("/experiments/nope/results", headers=auth_headers)
    ).status_code == 404


async def test_feature_flag_rollout(
    client: AsyncClient, auth_headers: dict[str, str], db: AsyncSession
) -> None:
    # Full rollout -> on.
    await client.post(
        "/flags", json={"key": "new_ui", "enabled": True, "rollout_pct": 100}, headers=auth_headers
    )
    assert (await client.get("/flags/new_ui", headers=auth_headers)).json()["enabled"] is True

    # Zero rollout -> off.
    await client.post(
        "/flags", json={"key": "new_ui", "enabled": True, "rollout_pct": 0}, headers=auth_headers
    )
    assert (await client.get("/flags/new_ui", headers=auth_headers)).json()["enabled"] is False

    # Partial rollout is deterministic for a given user.
    await client.post(
        "/flags", json={"key": "new_ui", "enabled": True, "rollout_pct": 50}, headers=auth_headers
    )
    ada = (
        await db.execute(select(User).where(User.email == "ada@example.com"))
    ).scalars().one()
    expected = svc.bucket(str(ada.id), "new_ui") < 50
    assert (await client.get("/flags/new_ui", headers=auth_headers)).json()["enabled"] is expected


async def test_unknown_flag_is_disabled(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    assert (await client.get("/flags/ghost", headers=auth_headers)).json()["enabled"] is False
