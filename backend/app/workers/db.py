"""Synchronous SQLAlchemy session for Celery workers.

The API is async (asyncpg); Celery tasks run in sync worker processes, so they
use a separate synchronous engine (psycopg) against the same database.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _sync_url(async_url: str) -> str:
    return async_url.replace("+asyncpg", "+psycopg")


engine = create_engine(_sync_url(settings.database_url), pool_pre_ping=True)
SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine, expire_on_commit=False
)
