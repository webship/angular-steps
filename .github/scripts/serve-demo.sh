#!/usr/bin/env bash
# Serve the built demo (demo-app/, or DEMO_DIR) with its own server, in a Node.js container, at
# http://127.0.0.1:<port> (its first argument, or PORT, 3000 by default). Stop it with: docker stop angular-steps-demo-<port>
# Angular's server answers only the hosts it is told about (its guard against server-side request forgery, a 400
# otherwise): NG_ALLOWED_HOSTS names them, 127.0.0.1 and localhost by default.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
DEMO_DIR="${DEMO_DIR:-$ROOT/demo-app}"
PORT="${1:-${PORT:-3000}}"
exec docker run --rm --name "angular-steps-demo-${PORT}" -u "$(id -u):$(id -g)" -e PORT=4000 \
  -e NG_ALLOWED_HOSTS="${NG_ALLOWED_HOSTS:-127.0.0.1,localhost}" \
  -p "127.0.0.1:${PORT}:4000" -v "$DEMO_DIR:/app:ro" -w /app "$NODE_IMAGE" node dist/demo/server/server.mjs < /dev/null
