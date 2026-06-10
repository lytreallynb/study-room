#!/usr/bin/env sh
# Realtime (python-socketio) entrypoint.
exec uv run --no-dev uvicorn app.realtime.asgi:app --host 0.0.0.0 --port "${PORT:-8001}"
