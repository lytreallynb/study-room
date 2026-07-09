"""FastAPI application factory.

Phase 0: app boots with health endpoints, structured logging, and CORS.
Routers for auth/rooms/sessions/etc. are mounted here in later phases.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app import __version__
from app.api import auth, experiments, health, rooms, sessions, stats, words
from app.core.config import settings
from app.core.logging import configure_logging, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    log = get_logger("startup")
    log.info("app.start", app=settings.app_name, env=settings.environment)
    yield
    log.info("app.stop")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(rooms.router)
    app.include_router(sessions.router)
    app.include_router(stats.router)
    app.include_router(experiments.router)
    app.include_router(experiments.flags_router)
    app.include_router(words.router)

    # Prometheus: auto HTTP metrics + custom business metrics, exposed at /metrics.
    Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
    return app


app = create_app()
