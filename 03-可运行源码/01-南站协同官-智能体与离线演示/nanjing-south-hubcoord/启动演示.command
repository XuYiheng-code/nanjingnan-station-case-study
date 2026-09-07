#!/bin/zsh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BIN="$PROJECT_DIR/.venv/bin/python"
DEMO_RUNTIME="$(mktemp -d /tmp/hubcoord-presentation.XXXXXX)"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  rm -rf "$DEMO_RUNTIME"
}
trap cleanup EXIT INT TERM

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "首次运行：正在创建本地 Python 环境…"
  if ! python3 -m venv "$PROJECT_DIR/.venv" || ! "$PYTHON_BIN" -m pip install -r "$PROJECT_DIR/requirements.txt"; then
    echo ""
    echo "服务依赖未能安装。你仍可直接双击："
    echo "$PROJECT_DIR/南站协同官-直接打开.html"
    open "$PROJECT_DIR/南站协同官-直接打开.html"
    exit 1
  fi
fi

DEMO_PORT=8152
while lsof -nP -iTCP:"$DEMO_PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  DEMO_PORT=$((DEMO_PORT + 1))
  if [[ "$DEMO_PORT" -gt 8172 ]]; then
    echo "8152—8172 端口均被占用，已改为打开无需服务的离线版。"
    open "$PROJECT_DIR/南站协同官-直接打开.html"
    exit 1
  fi
done

cd "$PROJECT_DIR"
HUBCOORD_DATA_DIR="$DEMO_RUNTIME" HUBCOORD_PORT="$DEMO_PORT" "$PYTHON_BIN" app.py &
SERVER_PID=$!

for _ in {1..120}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "展示服务提前退出，已改为打开无需服务的离线版。"
    open "$PROJECT_DIR/南站协同官-直接打开.html"
    exit 1
  fi
  HEALTH="$(curl -fsS "http://127.0.0.1:$DEMO_PORT/healthz" 2>/dev/null || true)"
  if [[ "$HEALTH" == *'"mode":"case_teaching_simulation"'* ]]; then
    open "http://127.0.0.1:$DEMO_PORT/"
    echo "评委展示站已打开。请从首页理解案例，再进入可操作 Demo。本次使用临时档案，关闭这个终端窗口后会自动移除。"
    wait "$SERVER_PID"
    exit 0
  fi
  sleep 0.25
done

echo "服务未能在 30 秒内启动，已改为打开无需服务的离线版。"
open "$PROJECT_DIR/南站协同官-直接打开.html"
exit 1
