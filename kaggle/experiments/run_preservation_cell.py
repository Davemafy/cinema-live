"""One pinned Kaggle launch: reproduce source finish, test one restyled Wan render.

Uses existing /tmp Wan environment/cache. Never changes production or starts APIs.
The fixed appearance image is an actual, disclosed AI reference, not a video result.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone

COMMIT = "a13fb3b5f57870065afaa58aa0d92147824ce60d"
FILES = {
    "kaggle/experiments/wan_vace_quality.py": "2a5ca43fa85ba62ec73a1edf9d910363518267e238a945da0aa92426eee5a606",
    "kaggle/experiments/treatment_transfer.py": "4b65df4df00dd13ca5bd7cc62945f0841d1fe0043021e4605a6638b8319db941",
    "docs/evidence/preservation-v1/ai-reference.png": "ce5825392cb1192c27db4cdccff0d7bbf04719afc428b9829555b8ec7db7c565",
    "docs/evidence/preservation-v1/ai-provenance.json": "ab2211216194e3a5364fecfdf60b1d8524f1f20c274c4d11ab7ab9776fef705a",
    "public/demo-performance.mp4": "db12280afa65e42db525120158495eb50e98df55d9d78089f388f1330346ab43",
}


def fetch_assets(root):
    root.mkdir(parents=True, exist_ok=True)
    for relative, expected in FILES.items():
        target = root / Path(relative).name
        if target.is_file() and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
            data = target.read_bytes()
        else:
            url = f"https://raw.githubusercontent.com/Davemafy/cinema-live/{COMMIT}/{relative}"
            with urllib.request.urlopen(url, timeout=45) as response:
                data = response.read(5_000_001)
            if len(data)>5_000_000 or hashlib.sha256(data).hexdigest()!=expected:
                raise RuntimeError("Pinned integrity check failed: "+relative)
            target.write_bytes(data)
        if relative.endswith(".py"):
            compile(data,str(target),"exec")
    return root


def find_wan_baseline(working):
    candidates=[]
    for path in working.glob("cinema-vace-*/run.json"):
        try:
            r=json.loads(path.read_text());video=path.parent/"vace-output.mp4"
            if (r.get("gpuVerified") and not r.get("appearanceReferenceSha256") and video.is_file()
                and r.get("sourceSha256")==FILES["public/demo-performance.mp4"]
                and r.get("conditioningScale")==1.0 and r.get("guidanceScale")==5.0
                and r.get("outputSha256")==hashlib.sha256(video.read_bytes()).hexdigest()
                and (r.get("width"),r.get("height"),r.get("frames"),r.get("fps"),r.get("steps"),r.get("seed"))
                    ==(448,256,49,12,30,20261011)):
                candidates.append(video)
        except (ValueError, OSError):
            continue
    return max(candidates,key=lambda p:p.stat().st_mtime) if candidates else None


def main():
    temp,working=Path("/tmp"),Path("/kaggle/working")
    python=temp/"cinema-vace-venv/bin/python"
    cache=temp/"cinema-vace-cache"
    wan_available=python.is_file() and cache.is_dir()
    if not wan_available:
        print("WAN CACHE ABSENT: source-preserving treatment remains available. Skipping generative Wan test; NO weight download.",flush=True)
    if wan_available and shutil.disk_usage(temp).free<3*1024**3:
        raise RuntimeError("Need 3 GiB free temporary headroom; stop before inference")
    if shutil.disk_usage(working).free<100*1024**2:
        raise RuntimeError("Need 100 MiB free /kaggle/working for evidence")
    assets=fetch_assets(temp/("cinema-preservation-assets-"+COMMIT[:8]))
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    finish=temp/("cinema-finish-"+stamp)
    generation=temp/("cinema-restyled-wan-"+stamp)
    saved=working/("cinema-preservation-"+stamp)
    script=assets/"wan_vace_quality.py"
    if wan_available:
        subprocess.run([str(python),"-u",str(script),"--api-check"],check=True,timeout=120)
        # GPU preflight is needed only for generative Wan mode.
        subprocess.run([str(python),"-c",
            "import importlib.util,pathlib; s=importlib.util.spec_from_file_location('wan',"+repr(str(script))+
            "); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.hardware(pathlib.Path('/tmp'))"],
            check=True,timeout=60)
    # The appearance-transfer path is CPU-only. Use system Python if the
    # optional Wan environment has disappeared after a Kaggle session reset.
    flow_python=str(python) if wan_available else sys.executable
    flow_env=os.environ.copy()
    has_cv=subprocess.run([flow_python,"-c","import cv2; print('OpenCV',cv2.__version__)"],check=False).returncode==0
    if not has_cv:
        deps=temp/"cinema-flow-only-deps"
        subprocess.run([sys.executable,"-m","pip","install","--no-deps","--no-cache-dir",
            "--target",str(deps),"opencv-python-headless==4.11.0.86"],check=True,timeout=300)
        flow_env["PYTHONPATH"]=str(deps)+(os.pathsep+flow_env["PYTHONPATH"] if flow_env.get("PYTHONPATH") else "")
    source=assets/"demo-performance.mp4"
    reference=assets/"ai-reference.png"
    provenance=assets/"ai-provenance.json"
    baseline_override=globals().get("WAN_BASELINE","")
    baseline=Path(baseline_override) if baseline_override else find_wan_baseline(working)
    if baseline and not baseline.is_file():raise RuntimeError("Provided Wan baseline does not exist")
    ltx=globals().get("LTX_RESULT","")
    if ltx and not Path(ltx).is_file():raise RuntimeError("Provided LTX baseline does not exist")
    print("AI reference: actual session-generated image; reused openly for this fixed test.",flush=True)
    print("Baseline:",str(baseline) if baseline else "not found; no baseline superiority claim",flush=True)
    print("Evidence destination:",saved,flush=True)
    try:
        subprocess.run([flow_python,"-u",str(assets/"treatment_transfer.py"),"--source",str(source),
            "--reference",str(reference),"--provenance",str(provenance),"--out",str(finish)],
            env=flow_env,check=True,timeout=600)
        print("CPU SOURCE-PRESERVING FILM COMPLETED AND DECODE VERIFIED.",flush=True)
        if wan_available:
            print("CACHED WAN AVAILABLE: starting ONE controlled generative render.",flush=True)
            args=[str(python),"-u",str(script),"--cache-only","--source",str(source),
                  "--appearance-reference",str(reference),"--source-preserving-result",str(finish/"treated-source.mp4"),
                  "--out",str(generation)]
            if baseline:args.extend(["--wan-baseline",str(baseline)])
            if ltx:args.extend(["--ltx-result",str(ltx)])
            subprocess.run(args,check=True,timeout=2700)
        else:
            print("GENERATIVE WAN SKIPPED: cached weights missing. No inference, no download, no misleading success claim.",flush=True)
    finally:
        saved.mkdir(parents=True,exist_ok=True)
        for label,folder in [("source-preserving",finish),("restyled-wan",generation)]:
            if folder.is_dir():
                destination=saved/label;destination.mkdir(exist_ok=True)
                for file in folder.iterdir():
                    if file.is_file():shutil.copy2(file,destination/file.name)
        for name in ("ai-reference.png","ai-provenance.json"):
            shutil.copy2(assets/name,saved/name)
        print("EVIDENCE/ERROR LOGS PRESERVED:",saved,flush=True)
        try:
            from IPython.display import display,FileLink
            for file in sorted(saved.rglob("*")):
                if file.is_file():display(FileLink(str(file)))
        except Exception as exc:
            print("Evidence is saved; notebook links unavailable:",str(exc),flush=True)
    # Display failures must not invalidate completed media.
    finish_video=saved/"source-preserving/treated-source.mp4"
    finish_report=saved/"source-preserving/run.json"
    if not finish_video.is_file() or not finish_report.is_file():
        raise RuntimeError("Source-preserving output not verified; inspect saved evidence")
    report=json.loads(finish_report.read_text())
    if report.get("videoDiffusionUsed") is not False or not report.get("originalFramesUsed"):
        raise RuntimeError("Incorrect source-preserving report provenance")
    print("SOURCE-PRESERVING VIDEO COMPLETE. This is AI-derived appearance transfer, NOT video diffusion.",flush=True)
    video=saved/"restyled-wan/vace-output.mp4" if wan_available else finish_video
    comparison=saved/"restyled-wan/comparison-contact-sheet.jpg" if wan_available else saved/"source-preserving/comparison-contact-sheet.jpg"
    if wan_available:
        wan_report=json.loads((saved/"restyled-wan/run.json").read_text())
        if not video.is_file() or not wan_report.get("gpuVerified"):
            raise RuntimeError("No completed verified Wan output; inspect logs")
        print("ACTUAL WAN RENDER COMPLETE. Visual adoption decision is still pending.",flush=True)
    try:
        from IPython.display import display,Video,Image
        display(Video(str(video),embed=True))
        if comparison.is_file():display(Image(filename=str(comparison)))
    except Exception as exc:
        print("Media is saved; use the file links. Inline display unavailable:",str(exc),flush=True)


if __name__=="__main__":main()
