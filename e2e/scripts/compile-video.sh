#!/bin/bash
set -eo pipefail

cd "$(dirname "$0")/.."

if [ ! -d "test-results" ]; then
  echo "No test-results directory, skipping video compilation"
  exit 0
fi

VIDEOS=$(find test-results -name "*.webm" -type f 2>/dev/null | sort || true)

if [ -z "$VIDEOS" ]; then
  echo "No test videos found, skipping compilation"
  exit 0
fi

CONCAT_FILE=$(mktemp)
while IFS= read -r f; do
  echo "file '$(pwd)/$f'" >> "$CONCAT_FILE"
done <<< "$VIDEOS"

COUNT=$(echo "$VIDEOS" | wc -l | tr -d ' ')
echo "Compiling $COUNT video(s) into test-run.mp4 at 4x speed..."

ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
  -vf "setpts=0.25*PTS,scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -crf 35 -preset ultrafast \
  -an -r 30 \
  test-run.mp4

rm -f "$CONCAT_FILE"

SIZE=$(du -h test-run.mp4 | cut -f1)
echo "Done: test-run.mp4 ($SIZE)"
