#!/bin/bash
# Build a NocoBase film (skill nocobase-video). Run from the film's project folder (scripts/init.sh made it).
#   1. cue sheet: dry run of the page                        → out/$OUT/events.json
#   2. music: score.mjs                                      → out/$OUT/music.wav
#   3. effects on their own stem, music ducked: mix.mjs      → out/$OUT/mix.wav (+ sfx-stem.wav, music-ducked.wav)
#   3b. narration, when the project has $VO (vo.json; references/narration.md): tts.py → vo/, mix-vo.mjs → out/$OUT/mix-vo.wav
#   4. frames: 2× supersampled, 4-sample motion blur         → out/$OUT/video.mp4
#   5. mux + loudness: two-pass loudnorm, −14 LUFS, −1.5 dBTP (AAC adds a few tenths; the file must stay ≤ −1 dBTP) → out/$OUT/$NAME.mp4
#   ./make.sh                        full quality, 60 fps (budget ≈ 17 s of render per second of film on an M-series Mac)
#   AUDIO_ONLY=1 ./make.sh           the soundtrack only (score, effects, narration) → out/$OUT/preview.m4a at −14 LUFS: preview.html plays it
#   SKIP_VIDEO=1 ./make.sh           re-score, re-mix and re-mux only (keeps out/$OUT/video.mp4)
#   FPS=30 DSF=1 MB=1 ./make.sh      quick draft
#   SKIP_TTS=1 ./make.sh             keep the narration takes in vo/ (re-mix only); NO_VO=1 builds without narration
#   OUT=film PAGE=film.html NAME=film VO=vo.json   defaults (a language version: PAGE=film-en.html OUT=film-en VO=vo-en.json)
set -euo pipefail
cd "$(dirname "$0")"
OUT=${OUT:-film}; PAGE=${PAGE:-film.html}; NAME=${NAME:-$OUT}; FPS=${FPS:-60}; DSF=${DSF:-2}; MB=${MB:-4}; VO=${VO:-vo.json}
node render.mjs --dry --page "$PAGE" | tail -1
mkdir -p "out/$OUT" && cp out/events.json "out/$OUT/events.json"
OUT=$OUT node score.mjs | head -4
OUT=$OUT node mix.mjs | head -2
MIX=mix.wav
if [ -f "$VO" ] && [ -z "${NO_VO:-}" ]; then
  [ -n "${SKIP_TTS:-}" ] || python3 tts.py --script "$VO" | tail -3
  OUT=$OUT SCRIPT=$VO node mix-vo.mjs | tail -2
  MIX=mix-vo.wav
fi
M=$(ffmpeg -hide_banner -nostats -i "out/$OUT/$MIX" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
LN="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
# the HTML review cut's soundtrack, at the film's loudness (preview.html plays out/$OUT/preview.m4a)
ffmpeg -y -hide_banner -loglevel error -i "out/$OUT/$MIX" -af "$LN" -c:a aac -b:a 256k -ar 48000 "out/$OUT/preview.m4a"
[ -n "${AUDIO_ONLY:-}" ] && { echo "soundtrack → out/$OUT/preview.m4a (open preview.html)"; exit 0; }
if [ -z "${SKIP_VIDEO:-}" ]; then
  node render.mjs --fps "$FPS" --dsf "$DSF" --mb "$MB" --page "$PAGE" --out "$PWD/out/$OUT/video.mp4" 2>&1 | tr '\r' '\n' | tail -1
fi
ffmpeg -y -hide_banner -loglevel error -i "out/$OUT/video.mp4" -i "out/$OUT/$MIX" \
  -af "$LN" \
  -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "out/$OUT/$NAME.mp4"
echo "done → out/$OUT/$NAME.mp4"
ffmpeg -hide_banner -nostats -i "out/$OUT/$NAME.mp4" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary/,$p' | grep -E "I:|LRA:|Peak:" | tr -s ' ' | tr '\n' ' '; echo
