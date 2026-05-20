#!/bin/bash
set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_FILE="$REPO_DIR/.pids"
echo "Starting NeighborGoods..."
cd "$REPO_DIR/backend"
DATA_DIR="$REPO_DIR/data" venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload &
BACKEND_PID=$!
echo "Backend PID $BACKEND_PID → http://localhost:8080"
cd "$REPO_DIR/frontend"
PORT=3030 npm start &
FRONTEND_PID=$!
echo "Frontend PID $FRONTEND_PID → http://localhost:3030"
echo "$BACKEND_PID $FRONTEND_PID" > "$PIDS_FILE"
echo "Run ./stop.sh to stop."
wait
