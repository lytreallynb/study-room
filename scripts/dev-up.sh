#!/bin/sh
# Start the full local stack (API :8000, realtime :8001, frontend :3000/:3001).
# Logs land in /tmp/studysync-*.log. Stop with: scripts/dev-down.sh
set -e
cd "$(dirname "$0")/.."

(cd backend && nohup uv run uvicorn app.main:app --port 8000 > /tmp/studysync-api.log 2>&1 &)
(cd backend && nohup uv run uvicorn app.realtime.asgi:app --port 8001 > /tmp/studysync-rt.log 2>&1 &)
(cd frontend && nohup npm run dev > /tmp/studysync-fe.log 2>&1 &)

echo "waiting for services..."
for i in $(seq 1 30); do
  api=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || true)
  rt=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health || true)
  [ "$api" = "200" ] && [ "$rt" = "200" ] && break
  sleep 1
done
echo "api=:8000($api) realtime=:8001($rt)"
grep -o "localhost:[0-9]*" /tmp/studysync-fe.log | head -1 || echo "frontend still starting, see /tmp/studysync-fe.log"
