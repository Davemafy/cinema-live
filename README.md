# CINEMA

Record one performance. Explore a cinematic treatment from the entire recorded
clip. Compare the source and result, and download the film.

**Subject-aware successor experiment:** actual CPU IC-Light inference, automatic
moving-person segmentation and independent foreground/background lighting now
work through the local app. [Real A/B/C media, measured results and limitations](docs/subject-aware-cinematography.md).
Matte artifacts remain; overall improvement over the prior output is not proven.
Public worker hosting is blocked and production is unchanged.

**This experiment branch includes an actual AI-image-directed, source-preserving
MP4**, with original dimensions, timing and source detail. See
[the experiment evidence](docs/preservation-aware-experiment.md). It is an offline
quality experiment; live image-AI serving and complete public workflow verification
remain pending. The existing UI and working LTX Kaggle backend are preserved.

The owner reports successful LTX and original-reference Wan GPU runs. A controlled
restyled-reference Wan candidate is ready for one cached-weight Kaggle execution;
it has not run here and has not been adopted. No fabricated output or benchmark.

Repository: https://github.com/Davemafy/cinema-live

## Watch the actual proof before running the demo

This experiment branch includes an honest, viewer-accessible **offline before/after** preview in `src/components/VerifiedExperiment.tsx`. It is separate from the site's temporary live GPU inference.

- [Watch the actual 5-second AI-directed preservation result](docs/evidence/preservation-v1/treated-source.mp4)
- [Watch the 56-second evidence demo](docs/evidence/preservation-v1/cinema-evidence-demo.mp4)
- [Original/result comparison](docs/evidence/preservation-v1/comparison.jpg)
- [Technical provenance, 120-frame output, source and image credits](docs/preservation-aware-experiment.md)

The experiment uses a real image-AI appearance reference and follows motion using optical-flow-guided appearance transfer. It does **not** generate new faces or body motion; it preserves original source pixels. The original production route remains an experimental LTX video-to-video integration, dependent on a live provider. A fresh public user upload is not yet proven to produce this offline treatment.

**Banana Hacks finalization:** publish a public YouTube demo <= 3 minutes, finish Devpost, and check all team/eligibility details. `submission/DEVPOST.md`, `submission/DEMO-SCRIPT.md`, and `submission/JUDGES.md` hold evidence-grounded drafts. No authenticated submission has been made.


## Run locally

Node.js 24 recommended (22 supported). Install locked dependencies:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Camera capture works on localhost or HTTPS.
FFmpeg and FFprobe binaries are included through the pinned npm packages. You can
use system binaries by setting `FFMPEG_PATH` and `FFPROBE_PATH`.

To enable **paid** inference, obtain a funded fal account and configure `FAL_KEY`
as a server secret. Generate `JOB_SIGNING_SECRET` using 32 random bytes, store it
as a stable server secret, and set `INFERENCE_ENABLED=true` only after the owner
has approved a compute budget. Do not paste keys into the browser or commit them.
For a public demo, use `CINEMA_RENDER_CODE` plus a provider-side spending cap.

```sh
npm run typecheck
npm test
npm run build
npm start
```

The managed execution sandbox needs network/listen permission for browser checks
and Next builds. It also required Next's TypeScript compiler API mode instead of
the detached CLI subprocess; type checking remains enabled.

## Judge workflow

1. Enable camera, record up to five seconds, and preview the original; or upload
   an MP4, WebM or MOV under 4 MB. A licensed sample performance is also available.
2. The server creates a standard 24 fps H.264 MP4 for the model. Larger dimensions
   are scaled to fit 768 pixels. Minimal black padding aligns dimensions to 32;
   footage is not cropped to a different composition.
3. Choose **Silver screen**, then transform. When inference is unavailable the
   interface reports the blocker instead of producing fake results.
4. Once the model actually completes, compare input and result, play both from
   the start, and download the generated MP4. This step still needs a real render
   to be verified on the deployed application.
5. Use New performance to repeat. Browser IndexedDB retains the current take and
   job across refreshes. Job capabilities expire after 24 hours.

Recording is silent in this version. Original uploaded audio is retained in the
source and normalization, while the configured AI output is silent. Long uploads
use their first five seconds; the full original file is retained locally.

## Architecture

```text
MediaRecorder / uploaded file
          ↓
POST /api/normalize → FFprobe validation → FFmpeg → normalized MP4
          ↓
POST /api/jobs → validate again → fal media upload → LTX queue submission
          ↓
Signed job capability → GET /api/jobs/status → provider queue/status/result
          ↓
Source/output comparison → GET /api/export → streamed MP4 download
```

- `src/hooks/useCamera.ts`: camera permissions, capture, timer, stop and cleanup.
- `src/hooks/useCinema.ts`: take preparation, submission, polling, recovery.
- `src/lib/storage.ts`: browser-local source and job persistence.
- `src/server/video.ts`: bounded local-file transcoding; temporary files cleaned.
- `src/server/inference.ts`: maintained provider API integration and model config.
- `src/server/security.ts`: signed capabilities, origin checks and basic limits.
- `src/components/`: presentation. `src/app/tokens.css` and `globals.css` contain
  layout/design tokens, without model or recording logic.

Inference is asynchronous on fal GPU infrastructure. Vercel only serves the UI,
preprocesses small clips and orchestrates jobs; it does not run the model.
The provider queue is durable; the server stores no job database. Source and
result addresses in capabilities are provider-hosted media, not local paths.

## Model and controls

Selected endpoint:
[`fal-ai/ltx-2.3-22b/distilled/video-to-video`](https://fal.ai/models/fal-ai/ltx-2.3-22b/distilled/video-to-video/api).
LTX-2.3 is by Lightricks. CINEMA does not claim to have invented its model.

Actual configured controls: `video_url`, `video_strength=0.7`, matching input
duration/FPS, normalized input dimensions, fixed treatment prompt, random seed,
prompt expansion disabled, safety checker enabled, H.264 MP4 output and generated
audio disabled. The full clip conditions generation. These settings are based
on the provider schema; their cinematic quality and performance preservation
have **not** been demonstrated yet and must be tuned on real renders.

Jobs expose their model, submitted configuration, seed, provider inference time
when supplied, and wall time until the result is observed. Queue wall time is
not a model-speed benchmark. Facial identity and gesture fidelity are not exact
guarantees. No training is performed.

## Deploy

A new Vercel project named `cinema-live` was created in `davemafys-projects`.
Only CINEMA infrastructure is modified. The connected Vercel account lacks a
GitHub Login Connection, so source-file deployment is used instead of Git auto
deployment. Supply production secrets in the Vercel dashboard, then redeploy.
Deployment identity and verification evidence are recorded in `WORKLOG.md`.

FFmpeg/FFprobe Linux x64 binaries are explicitly traced into preprocessing
functions; unused platform binaries are excluded. Public inference remains
disabled by default. Set provider spending limits before enabling it.

## Verification

`npm test` exercises real FFmpeg transcoding, portrait dimensions, five-second
trimming, retained AAC source audio, invalid container rejection, upload limits,
origin rejection, token tampering/expiry and truthful missing-provider behavior.
Generated test charts are codec fixtures, never product results.

`npm run verify:browser` uses Chromium with an **emulated** camera to test real
MediaRecorder recording, auto-stop, server transcoding, licensed human-video
upload/playback, normalized source download, refresh recovery and error recovery.
It checks desktop and 320/390 px mobile overflow and browser errors. It does not
claim physical camera testing or AI output verification. To run against production:

```sh
BASE_URL=https://your-production-url ARTIFACT_DIR=artifacts/production npm run verify:browser
```

`scripts/prove-inference.ts` is a reproducible real-inference check once compute
is authorized; it stops early if inference is disabled. Do not run it to simulate
results. See `docs/INFERENCE.md`.

## Limits and security

- Upload cap 4 MB, chosen below Vercel's 4.5 MB request cap. No accounts or billing.
- Source stays in the browser until transformation; normalized footage is then
  uploaded to fal. Provider media retention is outside this app's guarantees.
- Rate limits and processing concurrency guards are per warm function instance;
  they are not distributed spending controls. A render access code and a
  provider-side cap are required before broadly enabling paid public rendering.
- Single active take per browser. No cross-device recovery or long-term library.
- Submission is not automatically retried. A dropped response after acceptance
  requires checking provider history before retrying to avoid duplicate spend.
- Temporary files have random directories, never user-controlled paths. Video
  headers are validated before invoking FFmpeg. Remote input URLs are not accepted.
- Signed export capabilities allow only HTTPS fal media storage hosts. No provider
  credentials are exposed to the browser.

## Credits

See [THIRD_PARTY.md](THIRD_PARTY.md) for the model, codecs and licensed sample.
Application code is MIT licensed. The sample is input footage by ARTSEDGE/The
Kennedy Center under CC BY 3.0, excerpted/transcoded with attribution. It is never
presented as a generated output. Submission materials live in `submission/`.
