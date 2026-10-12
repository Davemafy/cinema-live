"""Run CINEMA's real subject-aware FastAPI worker in an active Kaggle GPU notebook.

This is temporary demo compute, NOT durable hosting. It deliberately does not
alter the existing LTX/Wan environments or Vercel configuration. No model
success is claimed until a real job completes.
"""
import os
import queue
import re
import secrets
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from pathlib import Path

# Immutable known working source; model and checkpoint integrity is checked by
# the original Kaggle bootstrap. Update only after new implementation is tested.
SOURCE_COMMIT = "a063a0796dcfbc695fac1abab4c817770d766662"
ROOT = Path("/tmp/cinema-subject-demo")
WORKING = Path("/kaggle/working")
WORKER = ROOT / "kaggle/cinematography_worker.py"
BOOTSTRAP = ROOT / "run_subject_cell.py"


def fetch(path, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    url = f"https://raw.githubusercontent.com/Davemafy/cinema-live/{SOURCE_COMMIT}/{path}"
    with urllib.request.urlopen(url, timeout=75) as response:
        data = response.read(2_000_001)
    if len(data) > 2_000_000 or not data:
        raise RuntimeError("Failed pinned source download: " + path)
    if destination.suffix == ".py":
        compile(data, str(destination), "exec")
    destination.write_bytes(data)


def bootstrap():
    ROOT.mkdir(parents=True, exist_ok=True)
    fetch("kaggle/experiments/run_subject_cell.py", BOOTSTRAP)
    import runpy
    code = runpy.run_path(str(BOOTSTRAP))
    cache, env = code["hardware"](Path("/tmp"), WORKING)
    assets = code["assets"](ROOT / "pinned-assets")
    python = code["python_environment"](Path("/tmp"), env)
    # The inference script and its helper must sit adjacent to the worker.
    experiments = WORKER.parent / "experiments"
    experiments.mkdir(parents=True, exist_ok=True)
    for name in ("subject_cinematography.py", "treatment_transfer.py"):
        shutil.copy2(assets / name, experiments / name)
    fetch("kaggle/cinematography_worker.py", WORKER)
    subprocess.run([sys.executable, "-m", "pip", "--python", str(python),
        "install", "-q", "--disable-pip-version-check",
        "fastapi", "uvicorn", "python-multipart", "requests"], env=env,
        check=True, timeout=600)
    return python, cache, env


def tunnel_binary():
    binary = ROOT / "cloudflared"
    if not binary.exists():
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        with urllib.request.urlopen(url, timeout=120) as response, binary.open("wb") as file:
            shutil.copyfileobj(response, file)
        binary.chmod(0o755)
    return binary


def start_tunnel(port):
    binary = tunnel_binary()
    tunnel = subprocess.Popen([str(binary), "tunnel", "--no-autoupdate",
        "--protocol", "http2", "--url", f"http://127.0.0.1:{port}"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1)
    hosts = queue.Queue()

    def reader():
        try:
            for line in tunnel.stdout:
                found = re.search(r"https://[a-z0-9-]+\\.trycloudflare\\.com", line)
                if found:
                    hosts.put(found.group(0))
                elif "error" in line.lower() or "failed" in line.lower():
                    print("CLOUDFLARE:", line.strip()[:250], flush=True)
        finally:
            hosts.put(None)

    threading.Thread(target=reader, daemon=True).start()
    try:
        origin = hosts.get(timeout=120)
    except queue.Empty:
        tunnel.terminate()
        raise RuntimeError("Quick Tunnel did not provide a hostname in 120 seconds")
    if not origin:
        raise RuntimeError("Cloudflare Tunnel exited before providing a hostname")
    return tunnel, origin


def main():
    print("BOOTSTRAPPING CINEMA SUBJECT-AWARE GPU WORKER (may install/download model dependencies)", flush=True)
    python, cache, env = bootstrap()
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    tunnel, origin = start_tunnel(port)
    token = os.environ.get("CINEMA_SUBJECT_TOKEN") or secrets.token_urlsafe(40)
    if len(token) < 32:
        tunnel.terminate()
        raise RuntimeError("CINEMA_SUBJECT_TOKEN must be at least 32 characters")
    env.update(CINEMA_SUBJECT_TOKEN=token, CINEMA_SUBJECT_ORIGIN=origin,
               CINEMA_SUBJECT_CACHE=str(cache), CINEMA_SUBJECT_PORT=str(port),
               CINEMA_SUBJECT_WORKDIR=str(WORKING / "cinema-subject-jobs"))
    log = WORKING / "cinema-subject-fastapi.log"
    print("Launching isolated FastAPI worker; logs:", log, flush=True)
    with log.open("a") as out:
        worker = subprocess.Popen([str(python), "-u", str(WORKER)],
                                  env=env, stdout=out, stderr=subprocess.STDOUT)
        try:
            import requests
            for attempt in range(45):
                if worker.poll() is not None:
                    raise RuntimeError(f"Worker exited with code {worker.returncode}; inspect {log}")
                try:
                    res = requests.get(origin + "/health", timeout=6)
                    data = res.json() if res.ok else {}
                    if (data.get("model") == "cinema/ic-light-person-aware-v1"
                        and data.get("mode") == "subject-aware"):
                        break
                except Exception:
                    pass
                time.sleep(2)
            else:
                raise RuntimeError(f"Worker public health unavailable; inspect {log}")
            print("\nGPU WORKER REACHABLE; NO RENDER HAS YET RUN.", flush=True)
            print("CINEMA_BACKEND_URL=" + origin, flush=True)
            print("CINEMA_BACKEND_TOKEN=" + token, flush=True)
            print("PUBLIC HEALTH=" + origin + "/health", flush=True)
            print("Keep this Kaggle GPU cell running while recording the app demo.", flush=True)
            print("COPY TOKEN PRIVATELY INTO VERCEL ENV; DO NOT SHARE NOTEBOOK OUTPUT SCREENSHOTS.", flush=True)
            while worker.poll() is None and tunnel.poll() is None:
                time.sleep(4)
            raise RuntimeError(f"Demo worker or tunnel ended. Worker log: {log}")
        finally:
            worker.terminate()
            tunnel.terminate()
            try:
                worker.wait(timeout=15)
            except subprocess.TimeoutExpired:
                worker.kill()
            try:
                tunnel.wait(timeout=15)
            except subprocess.TimeoutExpired:
                tunnel.kill()


if __name__ == "__main__":
    main()
