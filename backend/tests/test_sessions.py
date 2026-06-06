"""Study session lifecycle + the server-side anti-cheat time accounting."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import StudySession


async def test_session_lifecycle(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    start = await client.post("/sessions", json={}, headers=auth_headers)
    assert start.status_code == 201
    sid = start.json()["id"]
    assert start.json()["status"] == "active"

    pause = await client.post(f"/sessions/{sid}/pause", headers=auth_headers)
    assert pause.status_code == 200 and pause.json()["status"] == "paused"

    resume = await client.post(f"/sessions/{sid}/resume", headers=auth_headers)
    assert resume.status_code == 200 and resume.json()["status"] == "active"

    end = await client.post(f"/sessions/{sid}/end", headers=auth_headers)
    assert end.status_code == 200 and end.json()["status"] == "ended"

    history = await client.get("/sessions", headers=auth_headers)
    assert history.status_code == 200
    assert len(history.json()) == 1


async def test_cannot_start_two_sessions(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    assert (await client.post("/sessions", json={}, headers=auth_headers)).status_code == 201
    conflict = await client.post("/sessions", json={}, headers=auth_headers)
    assert conflict.status_code == 409


async def test_focus_time_is_server_measured_not_client_supplied(
    client: AsyncClient, auth_headers: dict[str, str], db: AsyncSession
) -> None:
    """Anti-cheat: the client never sends a duration. Even when we tamper with
    the request body, focus_seconds is derived purely from the server clock."""
    start = await client.post(
        "/sessions",
        # Attempt to inject a bogus duration — the schema ignores it.
        json={"focus_seconds": 999_999},
        headers=auth_headers,
    )
    assert start.status_code == 201
    sid = start.json()["id"]
    assert start.json()["focus_seconds"] == 0  # injection ignored

    # Simulate an hour of real elapsed time by backdating the active stretch.
    session = await db.get(StudySession, UUID(sid))
    assert session is not None
    session.last_resumed_at = datetime.now(timezone.utc) - timedelta(hours=1)
    await db.commit()

    end = await client.post(f"/sessions/{sid}/end", headers=auth_headers)
    assert end.status_code == 200
    focus = end.json()["focus_seconds"]
    # ~3600s, server-computed; nowhere near the injected 999_999.
    assert 3590 <= focus <= 3610


async def test_cannot_operate_on_others_session(client: AsyncClient) -> None:
    # User A starts a session.
    await client.post(
        "/auth/register",
        json={"email": "a@example.com", "password": "password123", "display_name": "A"},
    )
    a_token = (
        await client.post(
            "/auth/login", json={"email": "a@example.com", "password": "password123"}
        )
    ).json()["access_token"]
    sid = (
        await client.post(
            "/sessions", json={}, headers={"Authorization": f"Bearer {a_token}"}
        )
    ).json()["id"]

    # User B cannot end it.
    await client.post(
        "/auth/register",
        json={"email": "b@example.com", "password": "password123", "display_name": "B"},
    )
    b_token = (
        await client.post(
            "/auth/login", json={"email": "b@example.com", "password": "password123"}
        )
    ).json()["access_token"]
    resp = await client.post(
        f"/sessions/{sid}/end", headers={"Authorization": f"Bearer {b_token}"}
    )
    assert resp.status_code == 404
