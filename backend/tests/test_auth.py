"""Auth: registration, login, token-protected access."""

from httpx import AsyncClient


async def test_register_returns_user_without_password(client: AsyncClient) -> None:
    resp = await client.post(
        "/auth/register",
        json={
            "email": "grace@example.com",
            "password": "password123",
            "display_name": "Grace",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "grace@example.com"
    assert body["coins"] == 0 and body["level"] == 1
    assert "password" not in body and "hashed_password" not in body


async def test_duplicate_email_rejected(client: AsyncClient) -> None:
    payload = {
        "email": "dup@example.com",
        "password": "password123",
        "display_name": "Dup",
    }
    assert (await client.post("/auth/register", json=payload)).status_code == 201
    assert (await client.post("/auth/register", json=payload)).status_code == 409


async def test_login_and_me(client: AsyncClient) -> None:
    await client.post(
        "/auth/register",
        json={
            "email": "lin@example.com",
            "password": "password123",
            "display_name": "Lin",
        },
    )
    login = await client.post(
        "/auth/login",
        json={"email": "lin@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["display_name"] == "Lin"


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post(
        "/auth/register",
        json={
            "email": "x@example.com",
            "password": "password123",
            "display_name": "X",
        },
    )
    resp = await client.post(
        "/auth/login", json={"email": "x@example.com", "password": "wrong-pass"}
    )
    assert resp.status_code == 401


async def test_me_requires_auth(client: AsyncClient) -> None:
    # Missing credentials -> 401/403 depending on Starlette version.
    assert (await client.get("/auth/me")).status_code in (401, 403)
    bad = await client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
    assert bad.status_code == 401
