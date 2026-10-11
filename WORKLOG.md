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

## Quality sprint — 2026-10-11

Fetched current remote state. The owner's working LTX backend is on
`kaggle-worker-demo` at 02bc269; the owner reports a real 49-frame/12-fps,
384×256, 20-step render in approximately 45 seconds after model loading, with
weak transformation quality. That MP4 has not been supplied here for inspection.
The earlier missing-inference record above describes the earlier implementation.

Created `experiment/wan-vace-quality` from that working branch. Added one isolated
Wan VACE experiment with fixed source/model revisions, full-video gray control,
white masks, a color appearance reference, no output grading, pre-download
resource checks, a single render, diagnostics and beginning/middle/end evidence.
The working LTX source and production configuration are unchanged. No deployment.

CPU dependency/scheduler checks pass with Diffusers 0.36.0. Version 0.35.1 rejected
the supported prompt-embedding call; updated the experiment pin after identifying
the guard in official source. Five CPU experiment tests pass, covering real
FFmpeg preprocessing, hardware gates, text staging and a tiny random-weight VACE
graph (no video output or quality claim). Existing seven application tests,
TypeScript checks and production build pass.

Remaining blocker: no direct Kaggle GPU execution access. The owner will run the
pinned single cell and supply actual output/logs. A T4 is a plausible candidate
under the documented memory gates, not a verified fit. Do not adopt, integrate,
deploy or increase readiness/quality scores before inspecting actual generated
footage. Next action: review that evidence and compare with the preserved LTX MP4.

## Preservation-aware sprint — 2026-10-11

Created `experiment/preservation-aware-treatment` from updated Wan branch
92b6db7, retaining its Python 3.13 ensurepip workaround, /tmp cache layout and
explicit GPU prompt-embedding placement. Owner reports verified Wan T4 baseline:
224 seconds, 5.19 GiB peak allocation, weak transformation. Actual baseline video
has not been received here; these are owner-supplied results, not local measurements.

Generated a real image-AI appearance reference from the licensed source's first
frame using the session image-generation tool. Strong amber-left/cool-right
lighting; generated poses/faces drift, so generated pixels never enter Path A.
Implemented linear-light gain extraction, confidence-checked optical-flow field
propagation, original-frame compositing and native-resolution MP4 with audio
preservation. Two real renders produced the same hash. Second CPU processing:
20.808 seconds excluding image generation, 120 frames, 854x480 at 24000/1001 fps.
Sample is silent. Inspected start/middle/end plus all 120 frames via contact sheet;
retained subject/action/detail and visible directed appearance, no obvious flicker.
This is AI-derived appearance transfer, not physical relighting or scene synthesis.

Nine Python CPU tests pass; real AAC fixture export preserves identical AAC
packets, source dimensions/frame count/timing, no-op pixel values and provenance
checks. Added Wan supplied-restyled-reference and cache-only modes without
changing its controlled seed/sampling/source settings. Existing venvs are now
preserved instead of cleared. No new GPU result has run. No production changes.

Evidence is committed under docs/evidence/preservation-v1. Next action: use the
single pinned Kaggle cell to reproduce Path A and test Path B with cached Wan,
then inspect the real candidate against the preserved baseline. Live image-AI
serving and complete deployed journey remain unverified; no readiness-score bump.

Packaging verification: source/result both played to completion in Chromium,
5.005 seconds, 854x480, no playback/page errors. Recorded this in evidence run.json.
Prepared and visually inspected a real 56-second H.264 evidence demo, decoded the
entire file with FFmpeg. Captions explicitly distinguish offline appearance
transfer from live image-AI serving. Eleven Python tests now pass, including
pinned launcher manifest integrity and exact-baseline selection. Prepared current
submission notes with checked Devpost rubric, public YouTube requirement and
strict owner deadline. No submission/publication performed, no production changes.

Next required external action: run the pinned preservation cell in the owner's
existing Kaggle GPU session. It reuses /tmp Wan environment/weights, creates one
restyled-reference render, preserves errors/evidence, and auto-selects only a
hash-matched baseline with matching source/seed/settings. Inspect actual GPU MP4
before integration; no improved generative result is claimed.

## Subject-aware sprint — 2026-10-11

Continued from remote preservation branch d09fc90 on
`experiment/subject-aware-cinematography`; production/LTX worker untouched.
Implemented small automatic LRASPP people segmentation, source-conditioned actual
IC-Light/SD1.5 reference inference, RGB edge/GrabCut matte refinement, existing
confidence-checked optical flow, moving silhouette-based 2.5D lighting and native
source compositing. This is not physically accurate relighting or measured depth.

Real CPU image inference succeeded (206.131 s, pinned model revisions, 19 actual
steps). Real A/B/C candidate completed 120 frames, 854x480, 24000/1001 fps; full
media decode and start/middle/end/all-frame inspection. New C3 hash307dbf...ad81.
Reference reused only for same-source prototype revisions. Visible independent
foreground/background response; remaining halos/border changes prevent claiming
an overall cinematic improvement over B. Stop new-model expansion for deadline.

Integrated a separate authenticated queued worker into the existing treatment
controls, explicit mode routing and source-hash-bound result validation. No LTX
fallback for subject-aware requests. A genuinely different 2 s browser upload
created a new IC-Light reference and completed the worker in 611.654 s under CPU
contention (3.789 GiB peak RAM). Original test timed out at 600 s; recovered that
actual job to verify original/output playback, download hash c28dd4...bec4,
390px mobile viewport without overflow, no page/media errors. Public Vercel was
not changed; no authorized public worker endpoint/public port forwarding exists.
Detailed evidence/limitations: docs/subject-aware-cinematography.md.

Existing production build, typecheck and 10 application tests passed before the
final caption/source-hash hardening. Fifteen Python tests passed. Rechecking final
changes now. Next concrete action: commit/push code+actual evidence, pinned
isolated reproduction cell, update honest submission notes; do not claim public
activation or quality superiority without further real verification.

Final application verification: 11 TS/application tests, typecheck and production
build pass. Fifteen Python tests pass; Python dependency check reports no broken
requirements. The complete actual A/B/C comparison played to its end in Chromium
(5.005 s, 1920x400, no media error). Found and fixed comparison labels that had
incorrectly said Silver screen/normalized input; restored selected treatment on
session recovery. Saved genuine desktop/mobile screenshots after the fix.

Terminal GitHub credential is invalid. The connected GitHub app is authorized and
is publishing the exact Git tree instead; do not expose the invalid credential
or request another ordinary push approval. Production has not been deployed.


Published source/evidence with the connected GitHub app at f8a231e6091a81e1f68b346b0c86238353983717;
remote tree exactly matched local committed tree 09d39040c1c2521deae55e363437a257f0dd6cbe.
Added one isolated pinned Kaggle IC-Light reproduction (not another VACE run),
CPU-tested exact source manifest/cache reuse/one-GPU memory rejection. Three
launcher tests and three compositing tests pass. No Kaggle GPU execution claimed.
CPU API/library checks and 11 application tests/production build are already
verified. Publishing final dependency/launcher/documentation follow-up now.


Repeat-job check found a real stall in the threaded in-process model worker after
its first completed image run. Changed execution to one fresh subprocess per
queued job, with a 30-minute hard timeout and per-job logs. Existing completed
media was preserved before restarting only the local worker. Checking repeated
empty-subject errors through the app now; no additional model expansion.

Hardened-worker failure/retry check passed through the actual browser: an empty
synthetic diagnostic clip produced the genuine no-visible-person error twice;
retry became available each time. This is error-path evidence, not an AI-quality
claim. Starting one fresh actual different-upload render through the hardened
worker to verify the significant execution change. Cached weights only; CPU.


Hardened worker genuine success verified: new browser upload → per-input IC-Light
19-step actual CPU inference → 48-frame source-aware film → full comparison
playback → exported download. No timeout recovery needed. 344.672 s total,
268.765 s reference inference, 3.774 GiB peak RAM; output c28dd4...bec4 exactly
reproduces the earlier actual same-input run, with matching downloaded bytes.
Final native-source/hash-bound route was exercised. Rechecking empty-subject
failure/retry AFTER this successful model run to prove the previous stall is gone.
All 18 Python checks pass; 11 application tests, typecheck and build pass; pinned
Kaggle launcher remotely fetched/hash-matched/compiled, GPU remains untested.
Quality superiority remains unestablished; public hosting remains blocked.


Post-success repeat check passed: two further real empty-subject jobs failed
truthfully and made retry available after the successful hardened-worker image
render. No queue/model-state stall recurred. Final source-aware local user journey
is verified for actual uploads and downloadable media; camera hardware and
public deployment were not verified here. Public worker connection unavailable;
C3 visual quality does not beat B reliably. Stop further model expansion.

Final deliverables: actual source code, A/B/C MP4 + all-frame/mask/reference
artifacts, measured CPU logs, separate per-input authenticated worker, genuine
local comparison/export and failure recovery, pinned single-cell GPU reproduction,
accurate submission notes. Production/LTX unchanged; no paid calls or new compute.
Next external action: authorized public worker hosting/secure connection and
Devpost/YouTube publication of truthful evidence. No submission is claimed.
