"""Synchronous Redis client for Celery workers (e.g. leaderboard zset writes).

The API reads the same keys via the async client in app/core/redis.py.
"""

import redis

from app.core.config import settings

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)

LEADERBOARD_KEY = "leaderboard:weekly"
