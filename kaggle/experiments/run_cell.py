# Paste this entire file into ONE Kaggle GPU notebook cell with Internet enabled.
# Preserve the old LTX output and notebook; stop its process to release resources.
import hashlib, subprocess, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from IPython.display import display, FileLink, Image, Video

COMMIT = "b792db40d834b9d6d298569a6751a78a0bf3b2c3"
SHA256 = "604afa69a7db0c3228e84be37c0b446ec88d9233cd88060b25df2fc6b69b4665"
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
out = Path("/kaggle/working") / ("cinema-vace-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
args = [sys.executable, "-u", str(target), "--bootstrap", "--out", str(out)]
for flag, value in [("--source", SOURCE), ("--ltx-result", LTX_RESULT), ("--prompt", PROMPT)]:
    if value:
        args.extend([flag, value])
print("One render only. RAM/disk/single-GPU VRAM and APIs checked before weights. Output:", out, flush=True)
subprocess.run(args, check=True)
display(Video(filename=str(out / "vace-output.mp4"), embed=True))
display(Image(filename=str(out / "comparison-contact-sheet.jpg")))
for name in ["vace-output.mp4", "run.json", "experiment.log", "comparison-00.png", "comparison-24.png", "comparison-48.png"]:
    display(FileLink(str(out / name)))
