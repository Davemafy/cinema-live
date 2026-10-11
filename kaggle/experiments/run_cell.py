# Paste this entire file into ONE Kaggle GPU notebook cell with Internet enabled.
# Preserve the old LTX output and notebook; stop its process to release resources.
import hashlib, subprocess, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from IPython.display import display, FileLink, Image, Video

COMMIT = "cdc97788be1bb707d8be8022202703859ecffa59"
SHA256 = "8d821bcae70910e7f991a366fbeca3ab249275f0b1a59af9d428fc1bb920774a"
SOURCE = ""      # Empty = same licensed real dance input as the LTX selftest.
LTX_RESULT = ""  # Optional local path to preserved LTX MP4 for a third column.
PROMPT = ""      # Supply a matching descriptive prompt if SOURCE is changed.
url = f"https://raw.githubusercontent.com/Davemafy/cinema-live/{COMMIT}/kaggle/experiments/wan_vace_quality.py"
with urllib.request.urlopen(url, timeout=45) as response:
    script = response.read(100_001)
if len(script) > 100_000 or hashlib.sha256(script).hexdigest() != SHA256:
    raise RuntimeError("Experiment script failed integrity check")
compile(script, "wan_vace_quality.py", "exec")
target = Path("/kaggle/working/cinema_vace_quality.py")
target.write_bytes(script)
# Work on the separate /tmp filesystem. The Kaggle working volume has
# insufficient room for an uncached ~19 GB VACE checkpoint plus headroom.
import os, shutil
temp = Path("/tmp")
working = Path("/kaggle/working")
if os.stat(temp).st_dev == os.stat(working).st_dev:
    raise RuntimeError("No separate temporary volume; stop before downloading")
if shutil.disk_usage(temp).free < 19_015_511_004 + 3 * 1024**3:
    raise RuntimeError("Temporary filesystem lacks Wan weight storage + headroom")
run_name = "cinema-vace-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
out = temp / run_name
saved = working / run_name
args = [sys.executable, "-u", str(target), "--bootstrap", "--out", str(out)]
for flag, value in [("--source", SOURCE), ("--ltx-result", LTX_RESULT), ("--prompt", PROMPT)]:
    if value:
        args.extend([flag, value])
print("One render only. Model cache and venv in /tmp; evidence saved to:", saved, flush=True)
try:
    subprocess.run(args, check=True, timeout=2800)
finally:
    # Preserve evidence even when the GPU experiment fails. Do not copy model
    # weights (kept in /tmp/cinema-vace-cache) to the limited working volume.
    if out.exists():
        saved.mkdir(parents=True, exist_ok=True)
        for artifact in out.iterdir():
            if artifact.is_file():
                shutil.copy2(artifact, saved / artifact.name)
        print("RESULTS/LOGS SAVED:", saved, flush=True)
        for artifact in sorted(saved.iterdir()):
            if artifact.is_file():
                display(FileLink(str(artifact)))

if not (saved / "vace-output.mp4").is_file():
    raise RuntimeError("Inference did not produce a verified MP4; inspect failure.json and experiment.log")
display(Video(filename=str(saved / "vace-output.mp4"), embed=True))
display(Image(filename=str(saved / "comparison-contact-sheet.jpg")))
