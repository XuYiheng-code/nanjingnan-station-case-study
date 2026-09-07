#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STARTER_DIR="$(cd "$APP_DIR/.." && pwd)"
CAD_APP_DIR="${HUBCOORD_CAD_SOURCE:-$(cd "$APP_DIR/../../.." && pwd)/station-sim-3d}"
SSH_TARGET="${HUBCOORD_SSH_TARGET:-hubcoord-server}"
REMOTE_ROOT="${HUBCOORD_REMOTE_ROOT:-/opt/hubcoord}"
RELEASE_ID="$(date +%Y%m%d-%H%M%S)"
REMOTE_RELEASE="$REMOTE_ROOT/releases/$RELEASE_ID"

echo "[1/7] 构建并装配 CAD 空间沙盘"
test -f "$CAD_APP_DIR/package.json"
npm --prefix "$CAD_APP_DIR" run build
install -d "$APP_DIR/static/cad"
rsync -a --delete "$CAD_APP_DIR/dist/" "$APP_DIR/static/cad/"

echo "[2/7] 本地交付预检"
python3 "$APP_DIR/scripts/preflight.py"
python3 "$APP_DIR/scripts/build_offline_data.py"
python3 "$APP_DIR/scripts/build_standalone.py"
ssh "$SSH_TARGET" "grep -Eq '^DASHSCOPE_API_KEY=.+$' '$REMOTE_ROOT/current/nanjing-south-hubcoord/.env'" || {
  echo "服务器 .env 尚未配置 DASHSCOPE_API_KEY，发布已停止。" >&2
  exit 1
}

echo "[3/7] 备份数据库并建立服务器版本目录：$REMOTE_RELEASE"
ssh "$SSH_TARGET" "set -eu
  docker builder prune -af >/dev/null 2>&1 || true
  available_kb=\$(df -Pk '$REMOTE_ROOT' | awk 'NR == 2 {print \$4}')
  if test \"\$available_kb\" -lt 5242880; then
    echo '服务器可用空间不足 5 GiB；为保护数据库，发布已停止。请先清理旧版本或扩容磁盘。' >&2
    exit 1
  fi
  install -d -m 0755 '$REMOTE_ROOT/backups' '$REMOTE_RELEASE'
  if test -d '$REMOTE_ROOT/current/nanjing-south-hubcoord'; then
    cd '$REMOTE_ROOT/current/nanjing-south-hubcoord'
    container_id=\$(docker compose ps -q hubcoord)
    if test -n \"\$container_id\" && docker inspect -f '{{.State.Running}}' \"\$container_id\" | grep -q true; then
      backup_name='hubcoord-$RELEASE_ID.sqlite3'
      docker exec \"\$container_id\" python -c \"import sqlite3; source=sqlite3.connect('/data/hubcoord.sqlite3'); target=sqlite3.connect('/data/\$backup_name'); source.backup(target); target.close(); source.close()\"
      docker cp \"\$container_id:/data/\$backup_name\" '$REMOTE_ROOT/backups/'
      docker exec \"\$container_id\" python -c \"from pathlib import Path; Path('/data/\$backup_name').unlink(missing_ok=True)\"
      chmod 0600 '$REMOTE_ROOT/backups/'\"\$backup_name\"
    fi
  fi"

echo "[4/7] 上传应用、数据契约和评测集"
rsync -az \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude 'video-agent' \
  --exclude 'runtime' \
  --exclude '*.png' \
  --exclude '*.log' \
  --exclude '.pytest_cache' \
  "$STARTER_DIR/data" \
  "$STARTER_DIR/contracts" \
  "$STARTER_DIR/eval" \
  "$APP_DIR" \
  "$SSH_TARGET:$REMOTE_RELEASE/"

echo "[5/7] 继承服务器运行配置并重建容器"
ssh "$SSH_TARGET" "set -eu
  previous_release=\$(readlink -f '$REMOTE_ROOT/current')
  test -f '$REMOTE_ROOT/current/nanjing-south-hubcoord/.env'
  install -m 0600 '$REMOTE_ROOT/current/nanjing-south-hubcoord/.env' '$REMOTE_RELEASE/nanjing-south-hubcoord/.env'
  cd '$REMOTE_RELEASE/nanjing-south-hubcoord'
  docker compose config --quiet
  docker compose up -d --build
  ready=false
  for attempt in \$(seq 1 30); do
    if curl -fsS http://127.0.0.1:8152/readyz >/dev/null; then
      ready=true
      break
    fi
    sleep 2
  done
  if test \"\$ready\" != true; then
    cd \"\$previous_release/nanjing-south-hubcoord\"
    docker compose up -d --build
    ln -sfn \"\$previous_release\" '$REMOTE_ROOT/current'
    echo '新版本未就绪，已恢复上一版本。' >&2
    exit 1
  fi
  ln -sfn '$REMOTE_RELEASE' '$REMOTE_ROOT/current'
  docker compose ps"

echo "[6/7] 验证公网入口与关键页面"
curl -fsS "https://hubcoord.cn/healthz"
echo
curl -fsS "https://hubcoord.cn/api/v1/assistant/health" | grep -Fq '"status":"configured"'
curl -fsS -H 'Content-Type: application/json' --data '{"question":"部署检查：请解释量子纠缠。","mode":"facts"}' \
  "https://hubcoord.cn/api/v1/assistant/chat" | grep -Fq '"boundary":"insufficient_evidence"'
curl -fsS "https://hubcoord.cn/" | grep -Fq '政企共创平台企业'
for path in story.html analysis.html assistant.html assistant.css assistant.js film.html showcase.css showcase.js assets/nanjing-south-aerial.jpeg assets/films/nanjing-south-competition-poster.webp assets/films/nanjing-south-competition-female.zh-CN.vtt assets/films/nanjing-south-competition-male.zh-CN.vtt assets/films/hubcoord-agent-60s-poster.webp assets/films/hubcoord-agent-60s.zh-CN.vtt agent-home.html case.html mechanism.html solution.html demo.html evidence.html cad/ cad/data/facts.json; do
  curl -fsS -o /dev/null "https://hubcoord.cn/$path"
done
curl -fsS -r 0-1023 -o /dev/null "https://hubcoord.cn/assets/films/nanjing-south-competition-female.mp4"
curl -fsS -r 0-1023 -o /dev/null "https://hubcoord.cn/assets/films/nanjing-south-competition-male.mp4"
curl -fsS -r 0-1023 -o /dev/null "https://hubcoord.cn/assets/films/hubcoord-agent-60s.mp4"

echo "[7/7] 清理远端旧备份与旧版本（各保留可回退副本）"
ssh "$SSH_TARGET" "set -eu
  ls -1t '$REMOTE_ROOT/backups'/hubcoord-*.sqlite3 2>/dev/null | tail -n +4 | xargs -r rm --
  active_release=\$(readlink -f '$REMOTE_ROOT/current')
  release_index=0
  for release_dir in \$(ls -1dt '$REMOTE_ROOT/releases'/* 2>/dev/null); do
    release_index=\$((release_index + 1))
    if test \"\$release_index\" -gt 2 && test \"\$release_dir\" != \"\$active_release\"; then
      rm -rf -- \"\$release_dir\"
    fi
  done
  docker image prune -f >/dev/null 2>&1 || true"
echo "发布完成：$REMOTE_RELEASE"
