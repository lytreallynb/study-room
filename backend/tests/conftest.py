"""Shared pytest fixtures.

The Phase 0 client talks to the ASGI app in-process (no network, no DB), so the
health test runs anywhere — including CI before any infra exists.
"""

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
