"""Room CRUD + ownership rules."""

from httpx import AsyncClient


async def test_create_and_list_room(
    client: AsyncClient, auth_headers: dict[str, str], async_redis
) -> None:
    create = await client.post(
        "/rooms",
        json={"name": "Late Night Library", "capacity": 20},
        headers=auth_headers,
    )
    assert create.status_code == 201
    room = create.json()
    assert room["name"] == "Late Night Library"
    assert room["capacity"] == 20

    listing = await client.get("/rooms", headers=auth_headers)
    assert listing.status_code == 200
    assert any(r["id"] == room["id"] for r in listing.json())


async def test_get_room_by_id(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    room_id = (
        await client.post("/rooms", json={"name": "Focus Cave"}, headers=auth_headers)
    ).json()["id"]
    resp = await client.get(f"/rooms/{room_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Focus Cave"


async def test_only_owner_can_delete(client: AsyncClient) -> None:
    # Owner creates a room.
    await client.post(
        "/auth/register",
        json={
            "email": "owner@example.com",
            "password": "password123",
            "display_name": "Owner",
        },
    )
    owner_token = (
        await client.post(
            "/auth/login",
            json={"email": "owner@example.com", "password": "password123"},
        )
    ).json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    room_id = (
        await client.post("/rooms", json={"name": "Mine"}, headers=owner_headers)
    ).json()["id"]

    # A different user cannot delete it.
    await client.post(
        "/auth/register",
        json={
            "email": "intruder@example.com",
            "password": "password123",
            "display_name": "Intruder",
        },
    )
    intruder_token = (
        await client.post(
            "/auth/login",
            json={"email": "intruder@example.com", "password": "password123"},
        )
    ).json()["access_token"]
    intruder_headers = {"Authorization": f"Bearer {intruder_token}"}

    forbidden = await client.delete(f"/rooms/{room_id}", headers=intruder_headers)
    assert forbidden.status_code == 403

    # Owner can.
    ok = await client.delete(f"/rooms/{room_id}", headers=owner_headers)
    assert ok.status_code == 204


async def test_room_listing_includes_live_occupancy(
    client: AsyncClient, auth_headers: dict[str, str], async_redis
) -> None:
    from app.services import presence

    room_id = (
        await client.post("/rooms", json={"name": "Occupancy Hall"}, headers=auth_headers)
    ).json()["id"]

    listing = await client.get("/rooms", headers=auth_headers)
    room = next(r for r in listing.json() if r["id"] == room_id)
    assert room["occupancy"] == 0

    await presence.add_member(room_id, "user-1", "momo", status="focusing")
    listing = await client.get("/rooms", headers=auth_headers)
    room = next(r for r in listing.json() if r["id"] == room_id)
    assert room["occupancy"] == 1
