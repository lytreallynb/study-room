"""Vocabulary practice: seeding, batch selection, Leitner reviews, rewards."""

from httpx import AsyncClient

from app.services.rewards import REVIEWS_PER_COIN, XP_PER_CORRECT_REVIEW


async def test_practice_returns_seeded_cards(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    resp = await client.get("/words/practice?limit=5", headers=auth_headers)
    assert resp.status_code == 200
    cards = resp.json()
    assert len(cards) == 5
    first = cards[0]
    assert first["term"]
    assert first["translation"]
    assert first["box"] is None  # nothing reviewed yet


async def test_review_moves_boxes_and_grants_xp(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    card = (await client.get("/words/practice?limit=1", headers=auth_headers)).json()[0]

    # correct: box 1 -> 2, XP granted
    resp = await client.post(
        f"/words/{card['id']}/review", json={"known": True}, headers=auth_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["box"] == 2
    assert body["correct_count"] == 1
    assert body["reward"]["xp_earned"] == XP_PER_CORRECT_REVIEW

    me = (await client.get("/auth/me", headers=auth_headers)).json()
    assert me["xp"] == XP_PER_CORRECT_REVIEW

    # wrong: back to box 1, no reward
    resp = await client.post(
        f"/words/{card['id']}/review", json={"known": False}, headers=auth_headers
    )
    body = resp.json()
    assert body["box"] == 1
    assert body["wrong_count"] == 1
    assert body["reward"]["xp_earned"] == 0


async def test_every_fifth_correct_review_grants_a_coin(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    cards = (
        await client.get(f"/words/practice?limit={REVIEWS_PER_COIN}", headers=auth_headers)
    ).json()
    coins = 0
    for card in cards:
        resp = await client.post(
            f"/words/{card['id']}/review", json={"known": True}, headers=auth_headers
        )
        coins += resp.json()["reward"]["coins_earned"]
    assert coins == 1  # exactly one coin per 5 correct answers

    me = (await client.get("/auth/me", headers=auth_headers)).json()
    assert me["coins"] == 1


async def test_reviewed_card_leaves_practice_queue_until_due(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    card = (await client.get("/words/practice?limit=1", headers=auth_headers)).json()[0]
    await client.post(
        f"/words/{card['id']}/review", json={"known": True}, headers=auth_headers
    )
    batch = (await client.get("/words/practice?limit=50", headers=auth_headers)).json()
    assert card["id"] not in [c["id"] for c in batch]
