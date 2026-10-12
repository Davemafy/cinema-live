#!/usr/bin/env bash
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGIN="${CINEMA_BACKEND_URL:-}"
if [[ ! "$ORIGIN" =~ ^https://[^/]+$ ]]; then
  echo "Set CINEMA_BACKEND_URL to the clean public HTTPS origin copied from JarvisLabs API (without a path)." >&2
  exit 1
fi
if [[ ! -s /home/cinema-worker.token ]]; then
  echo "Missing private token. Run bash scripts/jarvislabs-bootstrap.sh first." >&2
  exit 1
fi
export CINEMA_SUBJECT_TOKEN="$(cat /home/cinema-worker.token)"
export CINEMA_SUBJECT_ORIGIN="$ORIGIN"
export CINEMA_SUBJECT_CACHE=/home/cinema-cache
export CINEMA_SUBJECT_WORKDIR=/home/cinema-jobs
export TORCH_HOME=/home/cinema-torch
export HF_HOME=/home/cinema-cache
export CINEMA_SUBJECT_PORT=6006
export CINEMA_BIND_HOST=0.0.0.0

echo "Starting authenticated CINEMA worker on 0.0.0.0:6006; public origin: $ORIGIN"
echo "GPU models load when the first job arrives. Keep the instance running."
cd "$REPO"
exec /home/cinema-venv/bin/python -u kaggle/cinematography_worker.py
