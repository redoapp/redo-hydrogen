#!/bin/bash
set -eo pipefail

cd "$(dirname "$0")/../.."

echo "Installing root dependencies..."
npm ci

echo "Building package..."
npm run build
npm pack

echo "Installing fixture dependencies..."
(cd e2e/fixtures/hydrogen-quickstart && npm ci)

echo "Installing Playwright..."
(cd e2e && npm ci)
(cd e2e && npx playwright install --with-deps chromium)

echo "Installing ffmpeg..."
sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg

echo "Setup complete"
