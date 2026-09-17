#!/usr/bin/env bash
# Live preview: the lab with real Lab Model calls, on your own machine.
#
# GitHub Pages is static, so the hosted preview at /preview/ cannot call the
# gateway. This runs the proxy locally and serves the lab from it, so the
# browser talks to the proxy on the same origin and the proxy holds the key.
# The key never reaches the browser and never leaves this machine.
#
#   GATEWAY_API_KEY=sk-... ./scripts/run_live_preview.sh
#
# Then open http://localhost:8100/
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"

: "${GATEWAY_BASE_URL:=https://ai-gateway.barry.edu/v1}"
: "${LAB_MODEL:=gemma-4-31b-it}"
: "${PORT:=8100}"

if [ -z "${GATEWAY_API_KEY:-}" ] && [ -f proxy/.env ]; then
  set -a; . ./proxy/.env; set +a
fi
if [ -z "${GATEWAY_API_KEY:-}" ]; then
  echo "No GATEWAY_API_KEY. Run:  GATEWAY_API_KEY=sk-... $0" >&2
  exit 1
fi

echo "==> writing proxy/.env (gitignored, chmod 600)"
umask 077
cat > proxy/.env <<ENV
GATEWAY_BASE_URL=$GATEWAY_BASE_URL
GATEWAY_API_KEY=$GATEWAY_API_KEY
LAB_MODEL=$LAB_MODEL
VISION_ENABLED=0
FACULTY_NAME="Dr. Ellen Marsh"
FACULTY_FIELD=nursing
RATE_LIMIT_PER_MIN=60
GATEWAY_TIMEOUT_S=180
STATIC_DIR=../frontend/dist-preview
ENV
chmod 600 proxy/.env

echo "==> building the live-call frontend (dist-preview)"
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
npm run build:preview >/dev/null

echo "==> installing proxy deps"
cd "$ROOT/proxy"
python3 -m pip install -q -r requirements.txt

echo "==> starting the proxy on :$PORT"
set -a; . ./.env; set +a
python3 -m uvicorn app:app --port "$PORT" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT INT TERM

for _ in $(seq 1 30); do
  sleep 1
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then break; fi
done

echo
curl -s "http://localhost:$PORT/api/health"; echo
cat <<MSG

  Live preview:  http://localhost:$PORT/
  Instructor:    http://localhost:$PORT/?mode=instructor

  Output panels say "Live run" when the call reached the model. This gateway
  runs at about 5.5 tokens/second, so W7 takes roughly 12 seconds and W3 or W5
  take 40 or more. The build raises the browser timeout to 90s for that reason;
  the student build keeps 10s and falls back to a transcript.

  Ctrl-C to stop.

MSG
wait $PROXY_PID
