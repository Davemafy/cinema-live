# CINEMA implementation record

## Mission state — 2026-10-10

Repository started empty. Managed environment: CPU only, approximately 10 GB RAM,
30 GB disk, FFmpeg/FFprobe installed. No NVIDIA devices and no configured inference
credentials. GitHub and Vercel connectors are available. Network commands require
the sandbox network permission while retaining the managed proxy.

## Architecture

Next.js / React / TypeScript application, browser MediaRecorder capture and upload,
FFmpeg server normalization, fal LTX-2.3 Distilled video-to-video asynchronous queue.
The entire source video conditions inference, rather than only its first frame.
Original recording and active job capability are stored in browser IndexedDB.
Signed job capabilities avoid a database and keep provider credentials server-side.
UI styling, capture hook, storage, API client, preprocessing and provider adapter
are separate modules so the forthcoming UI harvest can replace presentation.

## Completed functionality

- Camera preview, permission errors, five-second MediaRecorder capture, retake,
  video upload and a licensed human-performance sample.
- Bounded FFprobe validation and FFmpeg normalization, aspect-ratio preservation,
  original/normalized playback and download, IndexedDB refresh recovery.
- Signed asynchronous job capabilities, real provider status handling, retry,
  comparison and generated export implementation. These inference-dependent paths
  are implemented but have not been exercised with a genuine generated video.
- Environment template, installation/model attribution docs and truthful draft
  Devpost description, judge instructions and demonstration script in submission/.

## Verified results

- Production build and TypeScript checks pass.
- Seven integration/security tests pass, including real FFmpeg portrait WebM
  normalization, upload limits, invalid-container rejection and signed capabilities.
- Local browser checks pass for emulated-camera recording, real performance
  upload, normalization/playback, source download, refresh recovery, invalid-file
  recovery, camera denial, and desktop plus 390/320-pixel mobile layouts.
- Screenshots were inspected. No physical camera has been tested.
- Official fal schema documents video_url, video_strength, matching duration/FPS,
  queue submit/status/result and MP4 output for the selected endpoint.
- No inference or transformed performance has been generated or verified.

## Deployment state

- Public repository: https://github.com/Davemafy/cinema-live
- Vercel project cinema-live was created separately from unrelated applications.
- Production alias: https://cinema-live-six.vercel.app
- Deployment dpl_G3EyQyXRjw3Ts2nkiS2ZMZ6GENga reached READY for commit 1bcde11.
- Server signing secret is configured privately; INFERENCE_ENABLED=false.
- The deployed browser verification attempt was interrupted. READY does not prove
  the deployed user journey; production health, preprocessing and browser checks
  still need completion. AI transformation is unavailable.

## Active blockers and authorization

- The owner declined paid inference and FAL_KEY configuration. Do not request that
  path again or incur charges. Investigate the existing Lightning AI account's
  free credits first; Modal Starter is an alternative only within included compute
  and with no unapproved charges. No GPU/account authorization is currently present
  in this CPU-only workspace. Lightning SDK is installed in
  /workspace/.venvs/cinema-infra; secure login and actual credit limits need checking.
- No UI harvest ZIP received yet; temporary functional interface only.
- Authenticated Devpost/YouTube access and required team eligibility information
  have not been established. Draft materials are prepared; nothing is submitted.

## Relevant commands

Run from /workspace/cinema-live:

```sh
npm run build
npm run typecheck
npm test
npm run verify:browser
BASE_URL=https://cinema-live-six.vercel.app ARTIFACT_DIR=artifacts/production npm run verify:browser
git push origin main
```

scripts/prove-inference.ts is a guarded genuine-inference verification script;
do not run a paid provider path without authorization. Generated artifacts and
credentials are ignored by Git.

## Next concrete action

Complete deployed CPU-path verification, inspect Lightning's secure login/free
compute availability, and build a reproducible self-hosted inference setup while
account access is unresolved. Verify a genuine source-conditioned output before
enabling rendering or claiming the full application is operational.

Deadline supplied: 2026-10-12 03:59 UTC (04:59 WAT).
