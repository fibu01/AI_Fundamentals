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
# Codespaces and other remote containers forward a port only if the server
# listens on all interfaces, not just loopback.
# Any remote container forwards a port only if the server listens on all
# interfaces. CODESPACES alone was too narrow a test, so check every marker
# these environments set.
if [ -n "${CODESPACES:-}${CODESPACE_NAME:-}${GITPOD_WORKSPACE_ID:-}${REMOTE_CONTAINERS:-}${DEVCONTAINER:-}" ]; then
  : "${HOST:=0.0.0.0}"
else
  : "${HOST:=127.0.0.1}"
fi

# Codespaces manages node through nvm, which only lands on PATH for login
# shells. A codespace created before .devcontainer existed has no node at all
# until the container is rebuilt. Find it rather than dying on "npm: command
# not found" halfway through.
if ! command -v npm >/dev/null 2>&1; then
  for d in "${NVM_DIR:-}" /usr/local/share/nvm "$HOME/.nvm"; do
    [ -n "$d" ] && [ -s "$d/nvm.sh" ] || continue
    export NVM_DIR="$d"
    # shellcheck disable=SC1091
    . "$d/nvm.sh" >/dev/null 2>&1 || true
    command -v npm >/dev/null 2>&1 && break
  done
fi
if ! command -v npm >/dev/null 2>&1; then
  for b in /usr/local/share/nvm/versions/node/*/bin /usr/local/nvm/versions/node/*/bin; do
    [ -x "$b/npm" ] && PATH="$b:$PATH" && export PATH && break
  done
fi
if ! command -v npm >/dev/null 2>&1; then
  cat >&2 <<'ERR'
node/npm not found.

In a Codespace this usually means the container predates .devcontainer/.
Either rebuild it (F1 -> "Codespaces: Rebuild Container", a few minutes), or
install node for this session:

  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs

Elsewhere: install Node 20+ from https://nodejs.org
ERR
  exit 1
fi
echo "==> node $(node --version), npm $(npm --version)"

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
python3 -m uvicorn app:app --host "$HOST" --port "$PORT" &
PROXY_PID=$!
trap 'kill $PROXY_PID 2>/dev/null || true' EXIT INT TERM

for _ in $(seq 1 30); do
  sleep 1
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then break; fi
done

if [ -n "${CODESPACE_NAME:-}" ]; then
  PUBLIC_URL="https://${CODESPACE_NAME}-${PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}/"
  # Forward it explicitly: a codespace built before .devcontainer existed has
  # no forwardPorts entry, and auto-detection on bind is not guaranteed.
  if command -v gh >/dev/null 2>&1; then
    gh codespace ports forward "$PORT:$PORT" --codespace "$CODESPACE_NAME" >/dev/null 2>&1 &
    gh codespace ports visibility "$PORT:public" --codespace "$CODESPACE_NAME" >/dev/null 2>&1 \
      && echo "port $PORT set to public" \
      || echo "could not set port $PORT public automatically; do it in the PORTS tab"
  fi
  echo
  echo "If the URL below 404s, open the PORTS tab and confirm $PORT is listed and Public."
fi
echo
curl -s "http://localhost:$PORT/api/health"; echo
cat <<MSG

  Live preview:  ${PUBLIC_URL:-http://localhost:$PORT/}
  Instructor:    ${PUBLIC_URL:-http://localhost:$PORT/}?mode=instructor

  Output panels say "Live run" when the call reached the model. This gateway
  runs at about 5.5 tokens/second, so W7 takes roughly 12 seconds and W3 or W5
  take 40 or more. The build raises the browser timeout to 90s for that reason;
  the student build keeps 10s and falls back to a transcript.

  Ctrl-C to stop.

MSG
wait $PROXY_PID
