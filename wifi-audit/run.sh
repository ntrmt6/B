#!/usr/bin/env bash
# wifi-audit launcher — binds to 0.0.0.0:8080 so your phone on the same LAN can reach it.
# Needs: root (for airmon-ng etc.), aircrack-ng suite, hcxtools (optional), hashcat (optional).
set -euo pipefail
cd "$(dirname "$0")"

if [[ $EUID -ne 0 ]]; then
  echo "Please run with sudo (airmon-ng needs root)." >&2
  exit 1
fi

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

PORT="${PORT:-8080}"
HOST="${HOST:-0.0.0.0}"
echo "wifi-audit on http://${HOST}:${PORT}"
exec .venv/bin/uvicorn app:app --host "$HOST" --port "$PORT"
