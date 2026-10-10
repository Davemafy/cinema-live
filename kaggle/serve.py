"""CINEMA temporary Kaggle image-to-video job worker. First-frame conditioning only."""
import hmac, io, os, queue, re, secrets, subprocess, threading, time
from hashlib import sha256
from pathlib import Path
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

ROOT = Path("/kaggle/working/cinema-worker")
ROOT.mkdir(parents=True, exist_ok=True)
TOKEN = os.environ.get("CINEMA_KAGGLE_TOKEN") or secrets.token_urlsafe(32)
URL = ""
MODEL_STATE = "starting"
PIPE = None
JOBS = {}
Q = queue.Queue(maxsize=2)
LOCK = threading.Lock()
LOAD_LOCK = threading.Lock()
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

def say(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)

def auth(value):
    if not value or not hmac.compare_digest(value, "Bearer " + TOKEN):
        raise HTTPException(401, "Unauthorized")

def signed_url(job_id):
    if not URL: return None
    exp = int(time.time()) + 4 * 3600
    sig = hmac.new(TOKEN.encode(), f"{job_id}:{exp}".encode(), sha256).hexdigest()
    return f"{URL}/v1/jobs/{job_id}/video?e={exp}&s={sig}"

@app.get("/health")
def health():
    return {"ok": MODEL_STATE != "failed", "state": MODEL_STATE, "model": "kaggle/ltx-image-conditioned-2b", "conditioning": "first-frame-only", "queued": Q.qsize()}

@app.post("/v1/jobs", status_code=202)
async def submit(video: UploadFile = File(...), prompt: str = Form(...), authorization: str | None = Header(default=None)):
    auth(authorization)
    if MODEL_STATE == "failed": raise HTTPException(503, "Model unavailable")
    if not prompt.strip() or len(prompt) > 2500: raise HTTPException(400, "Invalid prompt")
    data = await video.read(4_000_001)
    if not data or len(data) > 4_000_000: raise HTTPException(413, "Max upload 4MB")
    if not (data[4:8] == b"ftyp" or data[:4] == b"\x1aE\xdf\xa3" or data[:4] == b"OggS"):
        raise HTTPException(415, "Expected MP4, WebM or Ogg")
    jid = secrets.token_hex(12)
    source = ROOT / (jid + ".input.mp4")
    source.write_bytes(data)
    with LOCK:
        JOBS[jid] = {"id": jid, "state": "queued", "prompt": prompt.strip(), "source": str(source), "error": None, "inferenceSeconds": None}
    try: Q.put_nowait(jid)
    except queue.Full:
        with LOCK: del JOBS[jid]
        source.unlink(missing_ok=True)
        raise HTTPException(429, "GPU queue full")
    say("QUEUED " + jid)
    return {"id": jid, "state": "queued"}

@app.get("/v1/jobs/{jid}")
def status(jid: str, authorization: str | None = Header(default=None)):
    auth(authorization)
    with LOCK:
        job = JOBS.get(jid)
        if not job: raise HTTPException(404, "Job missing or session restarted")
        result = {k: job[k] for k in ("id", "state", "error", "inferenceSeconds")}
    if result["state"] == "succeeded": result["videoUrl"] = signed_url(jid)
    return result

@app.get("/v1/jobs/{jid}/video")
def video(jid: str, e: int, s: str):
    if not re.fullmatch("[0-9a-f]{24}", jid) or e < time.time() or e > time.time() + 14460:
        raise HTTPException(403, "Expired link")
    expected = hmac.new(TOKEN.encode(), f"{jid}:{e}".encode(), sha256).hexdigest()
    if not hmac.compare_digest(expected, s): raise HTTPException(403, "Invalid link")
    with LOCK:
        job = JOBS.get(jid)
        if not job or job["state"] != "succeeded": raise HTTPException(404, "Not ready")
    path = ROOT / (jid + ".mp4")
    if not path.is_file(): raise HTTPException(404, "Missing file")
    return FileResponse(path, media_type="video/mp4", filename="cinema-" + jid + ".mp4", headers={"Cache-Control": "private, no-store"})

def load():
    global PIPE, MODEL_STATE
    with LOAD_LOCK:
        if PIPE is not None: return PIPE
        MODEL_STATE = "loading"
        say("LOADING LTX image-to-video weights (cached if present)")
        import torch
        from diffusers import LTXImageToVideoPipeline
        obj = LTXImageToVideoPipeline.from_pretrained("Lightricks/LTX-Video", torch_dtype=torch.float16)
        obj.enable_model_cpu_offload()
        obj.vae.enable_tiling()
        PIPE = obj
        MODEL_STATE = "ready"
        say("MODEL READY")
        return PIPE

def generate():
    global MODEL_STATE
    while True:
        jid = Q.get()
        started = time.time()
        try:
            with LOCK:
                job = JOBS[jid]
                job["state"] = "rendering"
            frame = subprocess.run(
                ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-i", job["source"],
                 "-frames:v", "1", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"],
                capture_output=True, timeout=30, check=True
            ).stdout
            image = ImageOps.fit(Image.open(io.BytesIO(frame)).convert("RGB"), (384, 256))
            pipe = load()
            from diffusers.utils import export_to_video
            say("GENERATING " + jid + " (17 frames / 384x256)")
            frames = pipe(
                image=image, prompt=job["prompt"],
                negative_prompt="blurry, jittery, distorted, artifacts, subtitles, text",
                height=256, width=384, num_frames=17, num_inference_steps=12,
                guidance_scale=3.0, decode_timestep=0.05, decode_noise_scale=0.025
            ).frames[0]
            out = ROOT / (jid + ".mp4")
            export_to_video(frames, str(out), fps=12)
            if not out.is_file() or out.stat().st_size < 1000: raise RuntimeError("No MP4 produced")
            with LOCK:
                job["state"] = "succeeded"
                job["inferenceSeconds"] = round(time.time() - started, 1)
            say("DONE " + jid + " / " + str(job["inferenceSeconds"]) + "s")
        except Exception as ex:
            with LOCK:
                JOBS[jid]["state"] = "failed"
                JOBS[jid]["error"] = f"{type(ex).__name__}: {str(ex)[:350]}"
            if PIPE is None: MODEL_STATE = "failed"
            say("FAILED " + jid + ": " + str(ex))
        finally:
            Q.task_done()

def warm():
    global MODEL_STATE
    try: load()
    except Exception as exc:
        MODEL_STATE = "failed"
        say("LOAD ERROR " + str(exc))

def main():
    import requests, uvicorn
    say("STARTING CINEMA TEMPORARY KAGGLE API")
    threading.Thread(target=generate, daemon=True).start()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(30):
        try:
            if requests.get("http://127.0.0.1:8000/health", timeout=1).ok: break
        except Exception: time.sleep(1)
    else: raise RuntimeError("FastAPI failed to start")

    binary = ROOT / "cloudflared"
    if not binary.exists():
        say("DOWNLOADING CLOUDFLARED")
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
        response = requests.get(url, stream=True, timeout=90)
        response.raise_for_status()
        with binary.open("wb") as f:
            for chunk in response.iter_content(1_048_576): f.write(chunk)
        binary.chmod(0o755)
    say("STARTING TUNNEL - Kaggle networking may block this")
    tunnel = subprocess.Popen(
        [str(binary), "tunnel", "--no-autoupdate", "--protocol", "http2", "--url", "http://127.0.0.1:8000"],
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1
    )
    global URL
    for line in tunnel.stdout:
        match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line)
        if match and not URL:
            URL = match.group(0)
            say("PUBLIC URL: " + URL)
            say("API TOKEN (SECRET - configure CINEMA_KAGGLE_TOKEN in Vercel): " + TOKEN)
            say("HEALTH: " + URL + "/health")
            say("IMPORTANT: FIRST-FRAME CONDITIONING ONLY, NOT FULL VIDEO-TO-VIDEO")
            threading.Thread(target=warm, daemon=True).start()
        elif "error" in line.lower() or "failed" in line.lower():
            say("TUNNEL: " + line.strip()[:240])
    raise RuntimeError("Tunnel exited: " + str(tunnel.wait()))

if __name__ == "__main__": main()
