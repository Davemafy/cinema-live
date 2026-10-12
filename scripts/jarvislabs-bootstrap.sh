#!/usr/bin/env bash
set -euo pipefail

# Run once in a JarvisLabs PyTorch instance. Keep data under /home (persistent).
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="/home"
VENV="$BASE/cinema-venv"
PY="$VENV/bin/python"

command -v nvidia-smi >/dev/null || { echo "No NVIDIA GPU detected. Use a PyTorch GPU instance."; exit 1; }
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || {
  echo "FFmpeg and FFprobe are required. Install with: apt-get update && apt-get install -y ffmpeg"
  exit 1
}
python3 -m venv --system-site-packages "$VENV"
"$PY" - <<'PY'
import torch
assert torch.cuda.is_available(), "Installed PyTorch cannot see CUDA"
print("CUDA-ready PyTorch:", torch.__version__, torch.cuda.get_device_name(0))
PY
# Keep the instance's existing CUDA-enabled torch; don't replace it.
"$PY" -m pip install --no-cache-dir -r "$REPO/kaggle/requirements-subject.txt"
"$PY" - <<'PY'
import torch, torchvision, cv2, fastapi, diffusers, transformers, ftfy
from torchvision.models.segmentation import lraspp_mobilenet_v3_large
assert torch.cuda.is_available()
print("CINEMA dependencies OK; no render has run yet.")
PY
mkdir -p "$BASE/cinema-cache" "$BASE/cinema-jobs" "$BASE/cinema-torch"
if [[ ! -s "$BASE/cinema-worker.token" ]]; then
  "$PY" - <<'PY'
from pathlib import Path
import secrets, os
p=Path('/home/cinema-worker.token')
p.write_text(secrets.token_urlsafe(40))
os.chmod(p,0o600)
PY
fi
chmod 600 "$BASE/cinema-worker.token"
echo
echo "Prepared. Get the HTTPS API URL using JarvisLabs instance > API."
echo "Start the worker with:"
echo "  cd $REPO"
echo "  CINEMA_BACKEND_URL=https://YOUR_JARVISLABS_API_URL bash scripts/jarvislabs-serve.sh"
echo "Private token is stored at /home/cinema-worker.token. Never commit or screenshot it."
