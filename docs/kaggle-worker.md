# CINEMA temporary Kaggle inference backend

This is an **experimental, session-scoped** worker. It is NOT a persistent public hosting service. It uses LTX image-to-video conditioned on the **first frame** of the supplied MP4, not motion-preserving video-to-video. A source video is required; output is a new AI-generated short shot with independent motion.

## Start in your existing Kaggle T4 notebook

Use the notebook that already produced a working LTX MP4 so Hugging Face weights may be cached. Keep Internet enabled.

Paste **one new code cell**:

```python
import subprocess, sys
from pathlib import Path

print("Installing small API packages...", flush=True)
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
    "fastapi", "uvicorn", "python-multipart", "pillow", "requests"], check=True)

url = "https://raw.githubusercontent.com/Davemafy/cinema-live/kaggle-worker-demo/kaggle/serve.py"
target = Path("/kaggle/working/cinema_worker.py")
import requests
response = requests.get(url, timeout=30)
response.raise_for_status()
target.write_bytes(response.content)
print("STARTING TEMPORARY CINEMA GPU WORKER", flush=True)
subprocess.run([sys.executable, "-u", str(target)], check=True)
```

When the tunnel succeeds, the notebook prints **PUBLIC URL**, **API TOKEN**, and **HEALTH**. Keep that Kaggle cell/session running. If no tunnel URL appears or it reports port 7844 connection failures, outbound tunnels may be blocked; this route cannot be used in that Kaggle session.

**Never paste the API token into a public chat, codebase, GitHub file, or NEXT_PUBLIC environment variable.** Place it only in Vercel's server-side environment settings.

## Vercel: one environment variable

The Kaggle notebook already printed a **PUBLIC URL** and **API TOKEN**. Create exactly one server-side encrypted environment variable in CINEMA:

```dotenv
CINEMA_KAGGLE_URL=https://YOUR_KAGGLE_API_TOKEN@YOUR_RANDOM_HOST.trycloudflare.com
```

For the current worker, combine the notebook's original token and its Cloudflare hostname into that ONE URL. Do not share that complete URL, put it in source code, or use `NEXT_PUBLIC_`.

**No additional env variables are needed:** for this Kaggle-only demo, the backend reads the token from the URL, derives a temporary job signing secret, and activates inference automatically. The existing Fal settings are not used when `CINEMA_KAGGLE_URL` exists.

Deploy the `kaggle-worker-demo` branch manually when ready. Git auto-deploys are disabled in `vercel.json`.

Note: the tunnel hostname changes if Kaggle restarts, so you'll need to update that one URL and manually redeploy. Kaggle cannot guarantee uptime.


## API contract

- `GET /health` – connection/model state (public).
- `POST /v1/jobs` – `Authorization: Bearer <token>`, multipart `video` (max 4 MB) + `prompt`; returns `{"id":"...","state":"queued"}`.
- `GET /v1/jobs/{id}` – bearer token; returns job state, timing, signed media URL on success.
- `GET /v1/jobs/{id}/video?e=...&s=...` – expiring HMAC-signed MP4 delivery.

One GPU generation runs at a time; at most two can wait. The service holds jobs in memory and loses them on Kaggle reset. Tunnel hostnames rotate.

## Required acceptance test

1. Visit the printed `HEALTH` URL on your phone; it should return JSON, not a Cloudflare error.
2. The Kaggle output should eventually show `MODEL READY` before rendering.
3. On CINEMA Vercel, use **sample performance**, select **Silver screen**, submit.
4. Verify `queued → rendering → succeeded` and MP4 playback/export, or preserve the actual error details.
5. Don't claim successful motion preservation: only the first source frame conditions LTX. The original 5-second timing and action are **not** retained.

Kaggle free notebooks can disconnect, have a documented session length of up to 12 hours, and are unsuitable for permanent hosting. Cloudflare Quick Tunnel is intended for development/testing.
