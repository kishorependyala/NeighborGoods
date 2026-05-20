#!/bin/bash
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$REPO_DIR/.pids"

if [ -f "$PIDS_FILE" ]; then
  PIDS=$(cat "$PIDS_FILE")
  for PID in $PIDS; do
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo "Stopped PID $PID"
    fi
  done
  rm -f "$PIDS_FILE"
else
  echo "No .pids file found."
fi
echo "Done."
