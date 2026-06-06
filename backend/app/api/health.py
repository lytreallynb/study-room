"""Health & readiness endpoints.

``/health`` is a liveness probe with no dependencies (always answers if the
process is up). ``/health/ready`` is a readiness probe that will, from Phase 1+,
check Postgres and Redis connectivity.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__
from app.core.config import settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe — no external dependencies."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        version=__version__,
        environment=settings.environment,
    )
