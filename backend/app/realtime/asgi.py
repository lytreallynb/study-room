"""ASGI entrypoint for the realtime service.

Run as its own process (scales independently of the REST API):

    uv run uvicorn app.realtime.asgi:app --port 8001

Run several instances against the same Redis and they share room state.
"""

import socketio

from app.core.logging import configure_logging
from app.realtime.server import build_server

configure_logging()

sio = build_server()
app = socketio.ASGIApp(sio)
