#!/usr/bin/env bash
# The demo app the features run against, made in a Node.js container (nothing on the machine): Angular's official
# starter with server rendering (`ng new --ssr`, the Angular CLI pinned), the pages of demo/ over it, `npm install` and
# `npm run build`, into demo-app/ (or DEMO_DIR). The project is named demo, so its server is
# dist/demo/server/server.mjs.
#   bash .github/scripts/build-demo.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
NODE_IMAGE="${NODE_IMAGE:-node:24-bookworm-slim@sha256:873f586f3794f52281bd039bf02c048a0be08fde619338f9941bad1eb6b34530}"
NG_VERSION="${NG_VERSION:-22.3.0}"
DEMO_DIR="${DEMO_DIR:-$ROOT/demo-app}"
if [ -e "$DEMO_DIR" ]; then
  echo "$DEMO_DIR is there already: remove it to make the demo again." >&2
  exit 1
fi
parent="$(dirname "$DEMO_DIR")"
name="$(basename "$DEMO_DIR")"
mkdir -p "$parent"
docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm -e npm_config_update_notifier=false \
  -e CI=true -e NG_CLI_ANALYTICS=false -v "$parent:/work" -v "$ROOT/demo:/pages:ro" -w /work "$NODE_IMAGE" bash -c "
    npx --yes @angular/cli@${NG_VERSION} new demo --directory ${name} --ssr --defaults --interactive=false --ai-config=none \
      --skip-git --skip-install --package-manager=npm --style=css \
    && cp -a /pages/. ${name}/ \
    && cd ${name} && npm install --no-audit --no-fund && npm run build \
    && node -e \"for (const p of ['@angular/core', '@angular/router', '@angular/ssr', 'express']) console.log(p, require('./node_modules/' + p + '/package.json').version)\"
  " < /dev/null
echo "Built the demo into $DEMO_DIR/dist/demo"
