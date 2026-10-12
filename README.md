# CINEMA

**Turn a performance into a cinematic scene.**

[Live studio](https://madeincinema.vercel.app) · [Demo and submission](submission/PUBLISH.md) · [Source and model credits](THIRD_PARTY.md)

CINEMA is an experimental filmmaking workspace. Record or upload a short performance, choose a treatment, compare it with the original, and export the result as MP4. The goal is to change the visual atmosphere without sacrificing the captured movement and timing.

## See it work

The studio supports camera capture, video uploads (MP4, WebM, MOV), a licensed sample, video preprocessing, asynchronous render jobs, side-by-side playback, and download. Source footage is retained for comparison.

**Directed light** is the source-preserving experimental pipeline. It creates an IC-Light reference from the supplied video, segments people, follows movement using OpenCV optical flow, and composites treated foreground/background lighting over the original frames. Lighting and moving-subject boundaries are not yet consistently realistic.

**Silver screen** is an experimental black-and-white LTX video-to-video path. Unlike Directed light, it may regenerate parts of the performance; identity and movement preservation are not guaranteed.

The public site uses a **temporary Kaggle GPU worker** when available. A real Directed light job completed through the deployed app using its built-in sample, but notebook availability is not guaranteed. If the worker is offline, the app reports the unavailable treatment instead of displaying a fake render.

## Results and evidence

- [Appearance-transfer film (B)](docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4) — the stronger-looking **offline** visual showcase, not a live Directed light result.
- [Subject-aware film (C)](docs/evidence/subject-aware-v1/subject-aware.mp4) — actual experimental IC-Light and moving-subject pipeline; some mask artifacts remain.
- [A / B / C comparison](docs/evidence/subject-aware-v1/comparison-abc.mp4) — same source, different treatment methods.
- [Technical method, measured tests, and limitations](docs/subject-aware-cinematography.md) — reproducible evidence, including a separate local source-upload test.

The primary source performance is a licensed Charleston dance excerpt from ARTSEDGE / The Kennedy Center (CC BY 3.0). See [attribution](submission/ATTRIBUTIONS.md).

## Run locally

Requires Node.js 22+.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Camera capture requires localhost or HTTPS. The studio can preview and normalize footage without a GPU; actual AI rendering requires a working backend.

```sh
npm run typecheck
npm test
npm run build
```

For a temporary FastAPI worker, configure these **server-only** environment variables:

```dotenv
CINEMA_BACKEND_URL=https://your-worker.example
CINEMA_BACKEND_TOKEN=your-private-bearer-token
JOB_SIGNING_SECRET=your-independent-random-signing-secret
```

Never commit real values or expose them through `NEXT_PUBLIC_`. The worker must support `/health`, `/v1/jobs`, job status, and signed MP4 URLs. Read [backend integration](docs/backend-connection.md) and [temporary Kaggle setup](docs/DEMO-KAGGLE.md). Old jobs are not migrated when a notebook restarts or its tunnel URL changes.

## Stack

Next.js, React, TypeScript, FastAPI, Python, OpenCV, IC-Light, torchvision segmentation, FFmpeg, and Vercel. LTX and Wan VACE were evaluated during development; CINEMA did not train those models.

The app and orchestration code are MIT-licensed. **Model checkpoints, binary codecs, and sample media have their own terms.** See [THIRD_PARTY.md](THIRD_PARTY.md) and [submission/ATTRIBUTIONS.md](submission/ATTRIBUTIONS.md).

Built for Banana Hacks 2026.
