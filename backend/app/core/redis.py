"""Async Redis client (presence, cache, pub/sub broker — used from Phase 2)."""

import redis.asyncio as aioredis

from app.core.config import settings

redis_client: aioredis.Redis = aioredis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
)
