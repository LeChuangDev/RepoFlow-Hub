#!/usr/bin/env bash
# RepoFlow Hub · Linux 离线版启动器
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$DIR/app/index.html"
PROFILE="$DIR/profile"
BROWSER=""

if [ ! -f "$APP" ]; then
  echo "[RepoFlow Hub] 缺少 app/index.html，安装包可能不完整。"
  exit 1
fi

for candidate in google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
  if command -v "$candidate" >/dev/null 2>&1; then
    BROWSER="$candidate"
    break
  fi
done

if [ -z "$BROWSER" ]; then
  echo "[RepoFlow Hub] 未找到 Chrome / Chromium / Edge，改用系统默认浏览器打开。"
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$APP" >/dev/null 2>&1 || echo "请手动打开：$APP"
  else
    echo "请手动打开：$APP"
  fi
  exit 0
fi

mkdir -p "$PROFILE"
exec "$BROWSER" \
  --app="file://$APP" \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  --disable-background-networking \
  --disable-sync \
  --window-size=1440,900
