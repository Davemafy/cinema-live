# Two-variable inference backend

The frontend is provider-independent. Configure exactly these backend connection
values as **server-only Vercel secrets** (never NEXT_PUBLIC_):

```dotenv
CINEMA_BACKEND_URL=https://your-gpu-backend.example.com
CINEMA_BACKEND_TOKEN=YOUR_EXISTING_WORKER_BEARER_TOKEN_AT_LEAST_32_CHARACTERS
```

Keep the application's existing independent `JOB_SIGNING_SECRET` unchanged.
Changing the worker token or host does not change the application signing key.
There is no backend-token-derived job-signing fallback. If a legacy deployment
never had an independent signing secret, establish one explicitly before deploying
this branch; old capabilities from a derived key will not survive that migration.
No production secret was changed by this implementation.

## Contract and engine selection

- `GET /health`: bearer header included; worker returns its actual `ok`/`model`.
- `POST /v1/jobs`: bearer header + multipart `video` and engine payload.
- `GET /v1/jobs/{id}`: bearer header, actual queued/rendering/failed/succeeded state.
- `GET /v1/jobs/{id}/video?e=UNIX_SECONDS&s=HMAC_SHA256`: signed MP4, four-hour lifetime.

The same URL/token pair works with Cloudflare Tunnel, Modal, Lightning AI,
RunPod, JarvisLabs or another host **if that host exposes this FastAPI contract**.
A raw vendor generation API is not a drop-in CINEMA worker.

LTX uses the existing `prompt` multipart field. The subject-aware engine uses
`treatment=subject-aware`. Those payloads stay in their existing engine adapters;
there is no provider-specific routing framework. The app discovers supported
engine availability from health. A single configured worker currently serves its
selected engine, not both models simultaneously. Switching treatment never starts
an unsupported model or silently falls back after failure.

Recognized LTX implementation model ID: `kaggle/ltx-video-conditioned-2b` (the
historical implementation identifier remains the same on other hosts).
Subject-aware ID: `cinema/ic-light-person-aware-v1`, with `mode=subject-aware`
and `ltxFallback=false`. Source-aware completed metadata must record actual
image-AI participation and match the signed submitted source hash.

## Validation and security

URL must be an HTTPS origin without username/password, path, query or fragment.
Public DNS names and valid HTTPS ports are accepted without Kaggle/Cloudflare
hostname restrictions. IP literals and local/internal names are rejected in
production. Explicit local HTTPS tests require `CINEMA_ALLOW_LOCAL_ENGINE=true`
in development; TLS certificate validation remains enabled. New variables never
accept HTTP or token-bearing URLs.

Bearer credentials go only to the configured origin. Authenticated HTTP requests
reject redirects. MP4 addresses must match that origin and the exact job path/ID,
contain only one `e` and `s`, have an unexpired bounded lifetime, and carry a valid
HMAC signed with the worker token. Export capabilities remain signed separately
with `JOB_SIGNING_SECRET`; downloads reject redirects. A malformed/partial new
pair fails closed instead of selecting a legacy or paid fallback.

## Configure the worker

Both existing FastAPI workers accept `CINEMA_BACKEND_TOKEN` and
`CINEMA_BACKEND_URL` as aliases for their original worker variables. The URL is
its **externally routed HTTPS origin**, not its internal listening address.
Use TLS termination/reverse proxy provided by your host. Bind privately or set
`CINEMA_BIND_HOST=0.0.0.0` only when the host requires it.

- Subject-aware: `python -u kaggle/cinematography_worker.py`; default internal port
  8892, configurable with `CINEMA_SUBJECT_PORT`. Compatible dependencies are in
  `kaggle/requirements-subject.txt`; keep the existing model cache.
- LTX: `python -u kaggle/serve.py`; set `CINEMA_WORKDIR` and `CINEMA_PORT` as needed
  on a non-Kaggle host. With a configured external URL, it skips Cloudflare tunnel
  provisioning. Its original notebook/tunnel startup still works when no external
  URL is configured. Rendering/model controls are preserved.

Use an already-funded/free authorized compute environment. This sprint does not
provision hosts, activate paid GPU instances or deploy production.

## Migration and limitations

The new pair takes priority for new submissions. When both are absent, existing
`CINEMA_KAGGLE_URL` / `CINEMA_KAGGLE_TOKEN` and `CINEMA_CINEMATOGRAPHY_URL` still work
with the independent signing secret. Keep those legacy values until the new pair
has been tested. Do not put credentials into the new URL.

Jobs and MP4s live on the worker. A provider change **does not migrate or recover
in-progress jobs or files**. New signed claims remember their worker origin and
refuse to poll an old job ID on another host. Old legacy claims are rejected if
moved to the new connection without an origin binding. Finish and download jobs
before switching. Worker restarts lose in-memory job state; notebooks/tunnels
can expire. Durability, unattended serving and a distributed queue are not
implemented or claimed.

After you configure a real public worker, test health, submit an actual video,
inspect its output, compare/play/download, then promote only after authorization.
Mocked contract tests prove URL/transport behavior, not real GPU inference.

## Verified in this sprint

Both engine adapters passed mocked end-to-end contract checks on three HTTPS
origins, including a non-default port. A genuine uploaded clip then ran through
the same application using the two new variables over **local HTTPS**: actual
IC-Light reference generation, status polling, origin/job/HMAC verification,
comparison playback and export. The CPU job took 284.128 s and produced the same
measured film hash as earlier same-input runs. Evidence: `docs/evidence/backend-v1`.
This local TLS proof is not a deployed public GPU endpoint or a GPU benchmark.
