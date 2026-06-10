#!/usr/bin/env sh
# API entrypoint: run migrations, then serve. Used by the Render Blueprint
# (sh start-api.sh) where dockerCommand can't chain with && reliably.
set -e
uv run --no-dev alembic upgrade head
exec uv run --no-dev uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
