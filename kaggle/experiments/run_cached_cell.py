# Run ONLY after a prior Wan attempt has installed its isolated venv and cached
# weights under /tmp. This is a recovery launch; it never downloads model weights
# or repeats pip installation intentionally.
import os, sys, shutil, subprocess, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from IPython.display import display, FileLink, Video, Image

COMMIT = "f2340eea052eb370ffd340836013af0aaa2ef5a3"
temp = Path("/tmp")
working = Path("/kaggle/working")
python = temp / "cinema-vace-venv/bin/python"
cache = temp / "cinema-vace-cache"
script = temp / "cinema_vace_quality_fixed.py"
if os.stat(temp).st_dev == os.stat(working).st_dev:
    raise RuntimeError("Temporary volume shares disk with /kaggle/working; stop")
if not python.is_file() or not cache.is_dir():
    raise RuntimeError("Cached venv or model directory not found; do not rerun the old cell. Share this message.")
if shutil.disk_usage(temp).free < 3 * 1024**3:
    raise RuntimeError("Less than 3 GiB free on /tmp; stop.")
url = (f"https://raw.githubusercontent.com/Davemafy/cinema-live/{COMMIT}/"
       "kaggle/experiments/wan_vace_quality.py")
with urllib.request.urlopen(url, timeout=45) as response:
    code = response.read(100_001)
if len(code) > 100_000 or not code:
    raise RuntimeError("Could not retrieve bounded pinned experiment")
compile(code, "wan_vace_quality.py", "exec")
script.write_bytes(code)
name = "cinema-vace-retry-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
out = temp / name
saved = working / name
print("REUSING CACHED WAN WEIGHTS AND VENV; no reinstall", flush=True)
print("Experiment:", COMMIT, flush=True)
print("Result folder:", saved, flush=True)
rc = 1
try:
    result = subprocess.run(
        [str(python), "-u", str(script), "--out", str(out)],
        check=False, timeout=2700
    )
    rc = result.returncode
finally:
    if out.is_dir():
        saved.mkdir(parents=True, exist_ok=True)
        for file in out.iterdir():
            if file.is_file():
                shutil.copy2(file, saved / file.name)
        print("SAVED EVIDENCE:", saved, flush=True)
        for file in sorted(saved.iterdir()):
            if file.is_file():
                display(FileLink(str(file)))

if rc != 0:
    raise RuntimeError(f"Wan inference failed (exit {rc}). Inspect saved failure.json / experiment.log; do not repeat unchanged.")
video = saved / "vace-output.mp4"
if not video.is_file():
    raise RuntimeError("Process exited 0 without output MP4")
# Kaggle's IPython Video constructor can fail with filename= even though
# the MP4 is valid. Display is optional and must never mark GPU work failed.
try:
    display(Video(str(video), embed=True))
except Exception as exc:
    print(f"MP4 is saved; inline playback unavailable: {exc}", flush=True)
    display(FileLink(str(video)))
display(Image(filename=str(saved / "comparison-contact-sheet.jpg")))
