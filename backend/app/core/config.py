"""Application configuration, loaded from environment / .env.

Defaults are dev-friendly so the app and the Phase 0 health test boot with no
external services. Production overrides everything via environment variables.
"""

import json
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


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

    # Allowed CORS origins. Dev allows all; set to the frontend origin(s) in
    # prod, e.g. CORS_ORIGINS='["https://studysync.vercel.app"]'.
    # NoDecode: take the raw env string (so a bare "*" is valid) and let the
    # validator below parse it — pydantic-settings would otherwise JSON-decode it.
    cors_origins: Annotated[list[str], NoDecode] = ["*"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: object) -> object:
        """Accept a JSON list (``["https://a"]``), a comma-separated string
        (``https://a,https://b``), or a bare value (``*``)."""
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["*"]
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # --- Persistence (used from Phase 1 onward) ---
    # Async SQLAlchemy URL. Defaults to local Postgres; CI/compose override it.
    database_url: str = "postgresql+asyncpg://studysync:studysync@localhost:5432/studysync"

    # --- Redis (presence, pub/sub, cache, Celery broker — Phase 2+) ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Auth (Phase 1) ---
    jwt_secret: str = "dev-insecure-secret-change-me-in-production-0123456789"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 60 * 24

    # --- Realtime / presence (Phase 2) ---
    realtime_port: int = 8001
    # A member is considered live while their last heartbeat is within this
    # window; stale members are lazily pruned on read (covers ungraceful drops).
    presence_ttl_seconds: int = 45
    # Per-connection token bucket for chatty events (set_status / heartbeat).
    rate_limit_max_events: int = 30
    rate_limit_window_seconds: int = 10

    # --- Logging ---
    log_level: str = "INFO"
    # Pretty console logs in dev, JSON in prod.
    log_json: bool = False


    @property
    def async_database_url(self) -> str:
        """asyncpg URL for the API. Accepts a bare ``postgresql://`` (e.g. a
        managed-Postgres connection string) and adds the async driver."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        """psycopg URL for sync Celery workers, from the same DATABASE_URL."""
        url = self.database_url
        for prefix in ("postgresql+asyncpg://", "postgresql://"):
            if url.startswith(prefix):
                return url.replace(prefix, "postgresql+psycopg://", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
