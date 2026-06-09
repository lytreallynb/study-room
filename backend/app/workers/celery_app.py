"""Celery application + beat schedule.

Run a worker (with embedded beat) locally:

    uv run celery -A app.workers.celery_app worker -B -l info
"""

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "studysync",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
)

celery_app.conf.beat_schedule = {
    # Roll up yesterday's sessions shortly after midnight UTC.
    "aggregate-daily-study": {
        "task": "app.workers.tasks.aggregate_daily_study",
        "schedule": crontab(hour=0, minute=30),
    },
    # Refresh the cached leaderboard every 15 minutes.
    "recompute-leaderboard": {
        "task": "app.workers.tasks.recompute_leaderboard",
        "schedule": crontab(minute="*/15"),
    },
}
