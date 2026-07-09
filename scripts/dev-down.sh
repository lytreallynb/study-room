#!/bin/sh
# Stop the local stack started by dev-up.sh. Only kills processes whose
# working directory is inside this repo, so other projects' dev servers
# (e.g. another Next.js app on :3000) are never touched.
repo=$(cd "$(dirname "$0")/.." && pwd)

for port in 8000 8001 3000 3001; do
  pid=$(lsof -ti tcp:"$port" -s tcp:LISTEN || true)
  [ -z "$pid" ] && continue
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
  case "$cwd" in
    "$repo"*) kill "$pid" && echo "stopped :$port" ;;
    *) echo "skipping :$port (not this repo: $cwd)" ;;
  esac
done
