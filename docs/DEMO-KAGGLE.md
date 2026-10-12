# CINEMA — temporary Kaggle judge-demo backend

This setup uses the **real source-aware FastAPI worker**, not a prerecorded render. Kaggle and Cloudflare Quick Tunnel are temporary and **cannot guarantee judge-time uptime**.

## 1. Start one Kaggle GPU cell

In a GPU-enabled Kaggle notebook with Internet enabled, run this **single cell**:

```python
import urllib.request

commit = "f1b1981945aa2bff4a79f7030f45ff83a4902085"
url = (f"https://raw.githubusercontent.com/Davemafy/cinema-live/{commit}/"
       "kaggle/start_subject_demo.py")
data = urllib.request.urlopen(url, timeout=45).read()
exec(compile(data, "start_subject_demo.py", "exec"),
     {"__name__": "__main__"})
```

The launcher reuses the pinned subject-aware engine and existing caches where present. It installs its own isolated environment and FastAPI dependencies; it does **not** edit the working Wan or LTX environments.

It prints the Cloudflare URL and a random bearer token only once the public `/health` endpoint responds. Do not publish notebook output containing the token. Keep the cell running for the whole recording.

## 2. Configure Vercel — two backend values

Set **server-only** environment values on the CINEMA Vercel project:

```dotenv
CINEMA_BACKEND_URL=https://<your-current-cloudflare-host>.trycloudflare.com
CINEMA_BACKEND_TOKEN=<your-worker-bearer-token>
```

Leave the already configured `JOB_SIGNING_SECRET` stable. Never add `NEXT_PUBLIC_` prefixes or put the token in the URL. Redeploy to apply environment changes.

The legacy `CINEMA_KAGGLE_URL` may still configure Silver screen/LTX, separately; the two new settings select the Directed light worker. The app should select Directed light by default when its authenticated health check succeeds.

## 3. Verify before recording

1. Browser check: `https://<host>.trycloudflare.com/health` returns model `cinema/ic-light-person-aware-v1`, mode `subject-aware`, `ltxFallback:false`.
2. CINEMA `/api/health` reports the **Directed light** treatment available only after the worker is reachable. Do not consider the bare public worker health a successful GPU render.
3. Load **Use sample performance**, select Directed light, submit **once**. Watch queue/rendering until an actual result appears.
4. Inspect complete original and result playback; test MP4 download.
5. Record the real browser walkthrough and label the offline fallback as offline. If inference errors, leave the publicly viewable evidence available without pretending a new render succeeded.

The first job may download several gigabytes of model weights and take minutes. Kaggle GPU inference **has not been verified** for this worker. The worker has a 30-minute per-job timeout. Jobs and videos are session-local; restarting Kaggle loses them and changes the tunnel hostname, so update the URL and redeploy again.

## 4. Completion checklist

- Public CINEMA site loads on desktop and mobile.
- Video upload/preview or the licensed sample works.
- A new AI reference is generated for the uploaded clip.
- Queued → rendering → succeeded with an actual result.
- MP4 plays and downloads.
- No secrets in public logs or screenshots.
- The existing Devpost draft is **actually submitted** before the deadline.

Never delay Devpost publication solely because Kaggle is unavailable.
