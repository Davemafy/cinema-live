"""CINEMA temporary Kaggle motion-conditioned video generation worker."""
import hmac, io, os, queue, re, secrets, subprocess, threading, time, sys
from hashlib import sha256
from pathlib import Path
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

ROOT = Path("/kaggle/working/cinema-worker")
ROOT.mkdir(parents=True, exist_ok=True)
TOKEN = os.environ.get("CINEMA_KAGGLE_TOKEN") or secrets.token_urlsafe(32)
URL = ""
PORT = 8000
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
    return {"ok": MODEL_STATE != "failed", "state": MODEL_STATE, "model": "kaggle/ltx-video-conditioned-2b", "conditioning": "source-video-frames", "queued": Q.qsize()}

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
    return FileResponse(path, media_type="video/mp4", filename="cinema-" + jid + ".mp4", content_disposition_type="inline", headers={"Cache-Control": "private, no-store"})

# Quality profile: real source-video conditioning and a longer shot.
# 49 frames @12 fps = 4.08 seconds. 20 steps; 384x256 for T4 memory.
WIDTH, HEIGHT, FPS, FRAMES, STEPS = 384, 256, 12, 49, 20
STRENGTH = 0.65

def read_source_frames(path):
    """Sample the uploaded clip, retaining its motion for video conditioning."""
    from PIL import Image
    frame_bytes = WIDTH * HEIGHT * 3
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
        "-i", path, "-an", "-vf",
        f"fps={FPS},scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease:force_divisible_by=2,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2,format=rgb24",
        "-frames:v", str(FRAMES), "-pix_fmt", "rgb24",
        "-f", "rawvideo", "pipe:1"
    ]
    raw = subprocess.run(command, capture_output=True, timeout=45, check=True).stdout
    count = len(raw) // frame_bytes
    if count < 9:
        raise RuntimeError(f"Video has too few decoded frames: {count}")
    frames = [
        Image.frombytes("RGB", (WIDTH, HEIGHT), raw[i * frame_bytes:(i + 1) * frame_bytes])
        for i in range(min(count, FRAMES))
    ]
    while len(frames) < FRAMES:
        frames.append(frames[-1].copy())
    return frames

def finish_noir(raw_path, final_path):
    """Make the requested monochrome grade deterministic, not prompt-dependent."""
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
        "-i", str(raw_path), "-an",
        "-vf", "hue=s=0,eq=contrast=1.27:brightness=-0.025,noise=alls=3:allf=t,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19",
        "-movflags", "+faststart", "-y", str(final_path)
    ]
    subprocess.run(command, capture_output=True, timeout=120, check=True)

def load():
    global PIPE, MODEL_STATE
    with LOAD_LOCK:
        if PIPE is not None: return PIPE
        MODEL_STATE = "loading"
        say("LOADING LTX 2B VIDEO-TO-VIDEO PIPELINE (uses existing model weights)")
        import torch
        from diffusers import LTXConditionPipeline
        obj = LTXConditionPipeline.from_pretrained(
            "Lightricks/LTX-Video", torch_dtype=torch.float16
        )
        obj.enable_model_cpu_offload()
        obj.vae.enable_tiling()
        PIPE = obj
        MODEL_STATE = "ready"
        say("MODEL READY: SOURCE-VIDEO CONDITIONING")
        return PIPE

def warm():
    """Preload the video pipeline and expose load errors immediately."""
    global MODEL_STATE
    try:
        load()
    except Exception as exc:
        MODEL_STATE = "failed"
        say("MODEL LOAD FAILED: " + str(exc)[:600])

def generate():
    global MODEL_STATE
    while True:
        jid = Q.get()
        started = time.time()
        try:
            with LOCK:
                job = JOBS[jid]
                job["state"] = "rendering"
            source_frames = read_source_frames(job["source"])
            say(f"SOURCE VIDEO: {len(source_frames)} frames retained for motion conditioning")
            pipe = load()
            # Validate signature before scheduling expensive inference.
            import inspect
            required_args = {"video", "strength", "denoise_strength", "frame_rate",
                             "num_frames", "num_inference_steps", "image_cond_noise_scale"}
            signature_args = set(inspect.signature(pipe.__call__).parameters)
            missing = required_args - signature_args
            if missing:
                raise RuntimeError("Unsupported diffusers LTXConditionPipeline arguments: " + ", ".join(sorted(missing)))
            from diffusers.utils import export_to_video
            say(f"GENERATING {jid}: {FRAMES} frames / {STEPS} steps / conditioning strength {STRENGTH}")
            output = pipe(
                video=source_frames,
                prompt=job["prompt"],
                negative_prompt="color, colored footage, oversaturated, blurry, jitter, anatomy distortions, visual glitches, captions, text",
                height=HEIGHT, width=WIDTH, num_frames=FRAMES,
                frame_rate=FPS, num_inference_steps=STEPS,
                strength=STRENGTH,
                denoise_strength=1.0,
                guidance_scale=5.0, guidance_rescale=0.7,
                decode_timestep=0.05, decode_noise_scale=0.025,
                image_cond_noise_scale=0.025,
            )
            raw = ROOT / (jid + ".raw.mp4")
            out = ROOT / (jid + ".mp4")
            export_to_video(output.frames[0], str(raw), fps=FPS)
            finish_noir(raw, out)
            if not out.is_file() or out.stat().st_size < 1000:
                raise RuntimeError("No MP4 produced")
            with LOCK:
                job["state"] = "succeeded"
                job["inferenceSeconds"] = round(time.time() - started, 1)
            say("DONE " + jid + " / " + str(job["inferenceSeconds"]) + "s")
        except Exception as ex:
            with LOCK:
                JOBS[jid]["state"] = "failed"
                JOBS[jid]["error"] = f"{type(ex).__name__}: {str(ex)[:350]}"
            if PIPE is None: MODEL_STATE = "failed"
            # Include stack frames so notebook failures are diagnosable without blind retries.
            import traceback
            say("FAILED " + jid + ": " + traceback.format_exc(limit=4)[-1600:])
        finally:
            Q.task_done()

def smoke_test():
    """One optional GPU render: check quality before deploying the website."""
    import requests
    say("SELFTEST: waiting for model weights")
    for _ in range(180):
        if MODEL_STATE == "ready": break
        if MODEL_STATE == "failed":
            say("SELFTEST ABORTED: model could not load")
            return
        time.sleep(2)
    else:
        say("SELFTEST ABORTED: model loading timeout")
        return
    try:
        say("SELFTEST: downloading CINEMA sample performance")
        source = requests.get(
            "https://raw.githubusercontent.com/Davemafy/cinema-live/main/public/demo-performance.mp4",
            timeout=45,
        )
        source.raise_for_status()
        response = requests.post(
            f"http://127.0.0.1:{PORT}/v1/jobs",
            headers={"Authorization": "Bearer " + TOKEN},
            files={"video": ("demo-performance.mp4", source.content, "video/mp4")},
            data={"prompt": "Restyle the supplied person performing their original motions into a classic film-noir performance: black and white, sculpted side light, deep shadows, visible film grain, natural anatomy, continuous single take, stable camera, preserve original movement and subject."},
            timeout=30,
        )
        response.raise_for_status()
        jid = response.json()["id"]
        say("SELFTEST: job " + jid + " accepted; waiting for Kaggle GPU")
        for _ in range(360):
            time.sleep(5)
            with LOCK:
                job = dict(JOBS[jid])
            if job["state"] == "succeeded":
                probe = subprocess.run(
                    ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height,r_frame_rate,nb_frames",
                     "-of", "default=noprint_wrappers=1", str(ROOT / (jid + ".mp4"))],
                    capture_output=True, text=True, timeout=20,
                )
                say("SELFTEST SUCCEEDED / " + str(job["inferenceSeconds"]) + " seconds")
                say("SELFTEST VIDEO DATA: " + " ".join(probe.stdout.splitlines()))
                say("SELFTEST RESULT VIDEO: " + str(signed_url(jid)))
                say("WATCH THIS RESULT BEFORE DEPLOYING VERCEL")
                return
            if job["state"] == "failed":
                say("SELFTEST FAILED: " + str(job["error"]))
                return
        say("SELFTEST TIMED OUT: wait and inspect notebook logs")
    except Exception as exc:
        say("SELFTEST ERROR: " + str(exc)[:350])

def main():
    import requests, uvicorn, socket
    global PORT
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        PORT = listener.getsockname()[1]
    say(f"STARTING CINEMA TEMPORARY KAGGLE API on local port {PORT}")
    threading.Thread(target=generate, daemon=True).start()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(30):
        try:
            if requests.get(f"http://127.0.0.1:{PORT}/health", timeout=1).ok: break
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
        [str(binary), "tunnel", "--no-autoupdate", "--protocol", "http2", "--url", f"http://127.0.0.1:{PORT}"],
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
            say("IMPORTANT: EXPERIMENTAL VIDEO-TO-VIDEO CONDITIONING; MOTION FIDELITY IS NOT GUARANTEED")
            threading.Thread(target=warm, daemon=True).start()
            if "--selftest" in sys.argv:
                threading.Thread(target=smoke_test, daemon=True).start()
        elif "error" in line.lower() or "failed" in line.lower():
            say("TUNNEL: " + line.strip()[:240])
    raise RuntimeError("Tunnel exited: " + str(tunnel.wait()))

if __name__ == "__main__": main()
