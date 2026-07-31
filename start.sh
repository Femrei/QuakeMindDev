#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/QuakeMindBackend"
WEB_DIR="$ROOT_DIR/quakemind-web"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

cleanup() {
  echo ""
  echo "Sistem kapatiliyor..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "==> Backend (FastAPI) baslatiliyor..."
cd "$BACKEND_DIR"
./venv/bin/python fastapi_app.py > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "==> Frontend (Next.js) baslatiliyor..."
cd "$WEB_DIR"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 24.18.0 >/dev/null 2>&1 || true
npm run dev > "$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

echo ""
echo "============================================================"
echo " Backend : http://127.0.0.1:8000   (log: $LOG_DIR/backend.log)"
echo " Frontend: http://localhost:3000   (log: $LOG_DIR/web.log)"
echo " Durdurmak icin: Ctrl+C"
echo "============================================================"

wait
