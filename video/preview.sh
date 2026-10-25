#!/bin/bash
# 打开 HTML 审片版：在本目录起一个本地服务，再用浏览器打开 preview.html（英文版 preview-en.html）。
# 经由本地服务打开，音轨整段读进内存播放，跳转、倍速、声画同步都可靠；直接双击 preview.html（file://）时声音不一定能播。
#   ./preview.sh            打开 preview.html
#   ./preview.sh 48         从第 48 秒开始
#   ./preview.sh en [48]    英文版（preview-en.html）
cd "$(dirname "$0")"
PAGE=preview.html
if [ "$1" = en ]; then PAGE=preview-en.html; shift; fi
PORT=${PORT:-8765}
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT + 1)); done
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM
for _ in $(seq 1 50); do curl -s -o /dev/null "http://127.0.0.1:$PORT/$PAGE" && break; sleep 0.1; done
URL="http://127.0.0.1:$PORT/$PAGE${1:+#t=$1}"
if [ -d "/Applications/Google Chrome.app" ]; then open -a "Google Chrome" "$URL"
elif command -v open >/dev/null; then open "$URL"
elif command -v xdg-open >/dev/null; then xdg-open "$URL"
fi
echo "审片：$URL"
echo "看完按 Ctrl+C 关闭本地服务。"
wait $PID
