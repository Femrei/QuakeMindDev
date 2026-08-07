#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/QuakeMindBackend"
WEB_DIR="$ROOT_DIR/quakemind-web"
MOBILE_DIR="$ROOT_DIR/quakemind"
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

get_lan_ip() {
  # Backend dinliyor 0.0.0.0:8000, yani telefonun gorebilecegi adres
  # 127.0.0.1 degil, bu makinenin LAN/hotspot IP'si. Gercek bir paket
  # gondermeden hangi arayuzun kullanilacagini ogrenmek icin soket
  # trigi kullaniyoruz -- ipconfig/ifconfig parse etmekten daha guvenilir.
  if command -v python3 >/dev/null 2>&1; then
    python3 -c '
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    print(s.getsockname()[0])
    s.close()
except Exception:
    pass
' 2>/dev/null
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
  kill_tree "$MOBILE_PID"
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

MOBILE_STATUS="atlandi (flutter bulunamadi)"
if command -v flutter >/dev/null 2>&1 && [ -d "$MOBILE_DIR" ]; then
  echo "==> Mobil (Flutter) icin bagli cihaz/emulator araniyor..."
  cd "$MOBILE_DIR"
  MOBILE_DEVICE_ID=""
  if command -v python3 >/dev/null 2>&1; then
    MOBILE_DEVICE_ID="$(flutter devices --machine 2>/dev/null | python3 -c '
import json, sys
try:
    devices = json.load(sys.stdin)
except Exception:
    devices = []
for d in devices:
    if d.get("platformType") in ("android", "ios"):
        print(d.get("id", ""))
        break
' 2>/dev/null || true)"
  fi

  if [ -n "$MOBILE_DEVICE_ID" ]; then
    echo "==> Mobil uygulama '$MOBILE_DEVICE_ID' cihazinda baslatiliyor..."
    flutter run -d "$MOBILE_DEVICE_ID" > "$LOG_DIR/mobile.log" 2>&1 &
    MOBILE_PID=$!
    MOBILE_STATUS="'$MOBILE_DEVICE_ID' cihazinda calisiyor (log: $LOG_DIR/mobile.log)"
  else
    MOBILE_STATUS="bagli cihaz/emulator yok -- 'cd quakemind && flutter run' ile manuel baslat"
  fi
  cd "$ROOT_DIR"
fi

LAN_IP="$(get_lan_ip)"

echo ""
echo "============================================================"
echo " Backend : http://127.0.0.1:8000   (log: $LOG_DIR/backend.log)"
echo " Frontend: http://localhost:3000   (log: $LOG_DIR/web.log)"
echo " Mobil   : $MOBILE_STATUS"
if [ -n "$LAN_IP" ]; then
  echo " Mobil API IP: $LAN_IP:8000"
  echo "   (Telefon uygulamasinda Giris Ekrani > Sunucu Ayari kismina"
  echo "    bu IP:port degerini girin. Telefon ve bilgisayar ayni"
  echo "    ag/hotspot'ta olmali.)"
else
  echo " Mobil API IP: tespit edilemedi -- 'ipconfig' / 'ifconfig' ile"
  echo "   bu bilgisayarin LAN IP'sini bulup telefonda Sunucu Ayari'na girin."
fi
echo " Durdurmak icin: Ctrl+C"
echo "============================================================"

wait
