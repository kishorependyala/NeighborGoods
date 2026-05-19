#!/bin/bash
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Restarting..."
"$REPO_DIR/stop.sh"
sleep 1
"$REPO_DIR/start.sh"
