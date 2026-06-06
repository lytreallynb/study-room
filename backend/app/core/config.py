"""Application configuration, loaded from environment / .env.

Defaults are dev-friendly so the app and the Phase 0 health test boot with no
external services. Production overrides everything via environment variables.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_name: str = "StudySync"
    environment: Literal["dev", "test", "prod"] = "dev"
    debug: bool = True

    # --- Persistence (used from Phase 1 onward) ---
    # Async SQLAlchemy URL. Defaults to local Postgres; CI/compose override it.
    database_url: str = "postgresql+asyncpg://studysync:studysync@localhost:5432/studysync"

    # --- Redis (presence, pub/sub, cache, Celery broker — Phase 2+) ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Auth (Phase 1) ---
    jwt_secret: str = "dev-insecure-secret-change-me-in-production-0123456789"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 60 * 24

    # --- Logging ---
    log_level: str = "INFO"
    # Pretty console logs in dev, JSON in prod.
    log_json: bool = False


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
