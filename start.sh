#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/QuakeMindBackend"
WEB_DIR="$ROOT_DIR/quakemind-web"
LOG_DIR="$ROOT_DIR/.logs"
mkdir -p "$LOG_DIR"

# Windows (Git Bash/MSYS) needs taskkill to kill the whole process tree,
# otherwise child processes (e.g. node spawned by npm) survive Ctrl+C.
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) IS_WINDOWS=1 ;;
  *) IS_WINDOWS=0 ;;
esac

kill_tree() {
  local pid="$1"
  [ -z "$pid" ] && return 0
  if [ "$IS_WINDOWS" = "1" ]; then
    # $! is an MSYS-internal PID, not the real Windows PID taskkill needs.
    local winpid="$pid"
    if [ -r "/proc/$pid/winpid" ]; then
      winpid="$(cat "/proc/$pid/winpid" 2>/dev/null)"
    fi
    taskkill //PID "$winpid" //T //F >/dev/null 2>&1
  else
    kill "$pid" 2>/dev/null
  fi
}

CLEANED_UP=0
cleanup() {
  [ "$CLEANED_UP" = "1" ] && return 0
  CLEANED_UP=1
  echo ""
  echo "Sistem kapatiliyor..."
  kill_tree "$BACKEND_PID"
  kill_tree "$WEB_PID"
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "==> Backend (FastAPI) baslatiliyor... (NLP/risk modelleri yuklenecek, bu 1-2 dakika surebilir, lutfen bekleyin)"
cd "$BACKEND_DIR"
if [ -x "./venv/Scripts/python.exe" ]; then
  PYTHON_BIN="./venv/Scripts/python.exe"
elif [ -x "./venv/bin/python" ]; then
  PYTHON_BIN="./venv/bin/python"
else
  echo "HATA: QuakeMindBackend/venv bulunamadi. Once su komutu calistirin:"
  echo "  cd QuakeMindBackend && python -m venv venv && ./venv/*/pip install -r requirements.txt"
  exit 1
fi
"$PYTHON_BIN" fastapi_app.py > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

echo "==> Frontend (Next.js) baslatiliyor..."
cd "$WEB_DIR"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 24.18.0 >/dev/null 2>&1 || true

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo "==> node_modules bulunamadi, 'npm install' calistiriliyor (bu biraz surebilir)..."
  npm install
fi

npm run dev > "$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

echo ""
echo "============================================================"
echo " Backend : http://127.0.0.1:8000   (log: $LOG_DIR/backend.log)"
echo " Frontend: http://localhost:3000   (log: $LOG_DIR/web.log)"
echo " Durdurmak icin: Ctrl+C"
echo "============================================================"

wait
