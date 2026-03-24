#!/bin/bash
set -eo pipefail

FILE_PATH="$1"
PR_NUMBER="$2"

if [ ! -f "$FILE_PATH" ]; then
  echo "File not found: $FILE_PATH" >&2
  exit 1
fi

TAG="e2e-pr-${PR_NUMBER}-run-${GITHUB_RUN_NUMBER}"

gh release delete "$TAG" --yes 2>/dev/null || true
git push origin ":refs/tags/$TAG" 2>/dev/null || true

gh release create "$TAG" "$FILE_PATH" \
  --title "E2E recording PR #${PR_NUMBER}" \
  --notes "Auto-generated e2e test recording. Safe to delete." \
  --prerelease

echo "https://github.com/${GITHUB_REPOSITORY}/releases/download/${TAG}/$(basename "$FILE_PATH")"
