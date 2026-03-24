#!/bin/bash
set -eo pipefail

cd "$(dirname "$0")/.."

RESULTS_JSON="test-results/results.json"

if [ ! -f "$RESULTS_JSON" ]; then
  echo "No results.json found, skipping video compilation"
  exit 0
fi

HAS_DRAWTEXT=$(ffmpeg -filters 2>/dev/null | grep -c drawtext || true)

TESTS=$(jq -c '
[.. | objects | select(.specs?) | .specs[] |
  .title as $title |
  .tests[].results[] |
  select(.attachments | map(select(.name == "video")) | length > 0) |
  {title: $title, status, retry, video: (.attachments[] | select(.name == "video") | .path)}
]' "$RESULTS_JSON")

COUNT=$(echo "$TESTS" | jq 'length')
if [ "$COUNT" = "0" ]; then
  echo "No test videos found, skipping compilation"
  exit 0
fi

echo "Processing $COUNT test video(s)..."

TMPDIR=$(mktemp -d)
CONCAT_FILE="$TMPDIR/concat.txt"
trap 'rm -rf "$TMPDIR"' EXIT

for i in $(seq 0 $((COUNT - 1))); do
  ENTRY=$(echo "$TESTS" | jq -c ".[$i]")
  TITLE=$(echo "$ENTRY" | jq -r '.title')
  STATUS=$(echo "$ENTRY" | jq -r '.status')
  RETRY=$(echo "$ENTRY" | jq -r '.retry')
  VIDEO=$(echo "$ENTRY" | jq -r '.video')

  if [ ! -f "$VIDEO" ]; then
    echo "  Skipping missing video: $VIDEO"
    continue
  fi

  OVERLAY="$TITLE"
  if [ "$RETRY" -gt 0 ]; then
    OVERLAY="$TITLE (retry $RETRY)"
  fi

  STATUS_ICON="✓"
  if [ "$STATUS" = "failed" ]; then
    STATUS_ICON="✗"
  fi

  OUTFILE="$TMPDIR/clip_${i}.mp4"

  if [ "$HAS_DRAWTEXT" -gt 0 ]; then
    ESCAPED=$(echo "$OVERLAY" | sed "s/'/'\\\\''/g" | sed 's/:/\\:/g')
    ffmpeg -y -i "$VIDEO" \
      -vf "scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2,drawtext=text='${ESCAPED}':fontsize=14:fontcolor=white:x=8:y=8:box=1:boxcolor=black@0.6:boxborderw=5,drawtext=text='${STATUS_ICON} ${STATUS}':fontsize=12:fontcolor=white:x=8:y=30:box=1:boxcolor=black@0.6:boxborderw=4" \
      -c:v libx264 -crf 30 -preset ultrafast -an \
      -loglevel error \
      "$OUTFILE"
  else
    ffmpeg -y -i "$VIDEO" \
      -vf "scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2" \
      -c:v libx264 -crf 30 -preset ultrafast -an \
      -loglevel error \
      "$OUTFILE"
  fi

  echo "file '$OUTFILE'" >> "$CONCAT_FILE"
  echo "  [$STATUS_ICON] $TITLE"
done

if [ ! -f "$CONCAT_FILE" ]; then
  echo "No videos processed"
  exit 0
fi

echo "Concatenating and speeding up 4x..."

ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
  -vf "setpts=0.25*PTS" \
  -c:v libx264 -crf 35 -preset ultrafast \
  -an -r 30 \
  -loglevel error \
  test-run.mp4

SIZE=$(du -h test-run.mp4 | cut -f1)
echo "Done: test-run.mp4 ($SIZE)"
