"""ASGI entrypoint for the realtime service.

Run as its own process (scales independently of the REST API):

    uv run uvicorn app.realtime.asgi:app --port 8001

Run several instances against the same Redis and they share room state.
"""

import socketio
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

from app.core.logging import configure_logging
from app.realtime.server import build_server

configure_logging()


async def _health(request):
    return JSONResponse({"status": "ok", "service": "studysync-realtime"})


# Non-Socket.IO HTTP routes (health checks) are served by this side app.
_http_app = Starlette(routes=[Route("/health", _health)])

sio = build_server()
app = socketio.ASGIApp(sio, other_asgi_app=_http_app)
