"""Shared pytest fixtures.

Tests run against the local ``studysync_test`` database. Each test gets a fresh
schema (drop+create) for isolation. The app's ``get_session`` dependency is
overridden to use the test engine; ``db`` exposes a session for direct setup/
assertions (e.g. simulating elapsed time in the anti-cheat test).
"""

import os
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from redis.asyncio import from_url as redis_from_url

from app.core.config import settings
from app.core.db import get_session
from app.core import redis as redis_mod
from app.main import app
from app.models import Base

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://studysync:studysync@localhost:5432/studysync_test",
)


@pytest.fixture
async def engine() -> AsyncGenerator[AsyncEngine, None]:
    eng = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest.fixture
async def client(engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def db(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Register + log in a default user, return Bearer auth headers."""
    await client.post(
        "/auth/register",
        json={
            "email": "ada@example.com",
            "password": "password123",
            "display_name": "Ada",
        },
    )
    resp = await client.post(
        "/auth/login",
        json={"email": "ada@example.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def async_redis():
    """Fresh, loop-bound Redis client patched in for endpoints that read
    Redis (stats leaderboard, room occupancy). The module-level client binds
    to the first event loop it touches, so per-test tests must swap it."""
    orig = redis_mod.redis_client
    rds = redis_from_url(settings.redis_url, decode_responses=True)
    redis_mod.redis_client = rds
    await rds.flushdb()
    yield rds
    await rds.flushdb()
    await rds.aclose()
    redis_mod.redis_client = orig
