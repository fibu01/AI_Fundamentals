#!/usr/bin/env bash
# Runs once when the Codespace is created.
set -euo pipefail
cd "$(dirname "$0")/../hallucination-lab"
echo "installing frontend dependencies"
(cd frontend && npm ci)
echo "installing proxy dependencies"
(cd proxy && python3 -m pip install -q -r requirements.txt)
cat <<'MSG'

  Setup done. To start the lab with live model calls:

    cd hallucination-lab
    GATEWAY_API_KEY=sk-... ./scripts/run_live_preview.sh

  Codespaces forwards port 8100 and prints an https URL. Set that port's
  visibility to Public in the PORTS tab if you want anyone else to reach it.

MSG
