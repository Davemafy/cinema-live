# CINEMA — final Devpost copy

**Status: prepared, not submitted.** Use the sections below in Devpost. Do not
claim that the public site has a verified always-on source-preserving GPU service.
Primary showcase: B, the actual AI-directed appearance-transfer result. C is a
separate experimental subject-aware pipeline with imperfect matte boundaries.

## Project name
CINEMA

## Tagline
Record one performance. Explore a cinematic treatment. Preserve the take. Export the film.

## Inspiration
Independent and student filmmakers often have one usable performance but cannot
keep assembling actors, lighting, costumes and locations just to explore another
visual direction. Text-to-video can produce impressive scenes while changing the
person, movement or staging that made the original take useful. CINEMA begins
with the recorded performance and keeps the source available for inspection.

## What it does
CINEMA is a camera-first browser workspace for recording or uploading a short
performance, choosing a cinematic treatment, comparing source and result, and
exporting an actual playable MP4. Capture, preprocessing, asynchronous job handling,
comparison and download are implemented. Source-preserving image-AI processing
has been exercised through the local application using real uploaded footage.

Our primary visual showcase is an explicitly labeled offline example: image AI
proposes an amber/cool treatment, and optical-flow-guided appearance transfer
applies that direction to the original frames. It preserves the actors' movement,
framing and useful detail. It is not physically accurate relighting.

We also implemented a genuine per-input IC-Light reference pipeline with automatic
moving-person masks, independent foreground/background illumination and
silhouette-derived geometric cues. Local upload-to-download jobs genuinely ran
this model. Its matte halos remain visible, so we present it as technical evidence
and use the stronger earlier appearance-transfer result as the main showcase.

The existing public application is deployed, but a reliably reachable public GPU
worker for the new source-preserving pipeline has not been established. Offline
examples are not presented as newly generated responses to a visitor's upload.

## How we built it
The studio uses Next.js, React, TypeScript, browser MediaRecorder and IndexedDB.
FFprobe/FFmpeg validate and normalize recordings without cropping the composition.
Original footage remains accessible. Signed job capabilities, genuine asynchronous
states and MP4 export connect the interface to a separate FastAPI inference worker.

The finishing pipeline uses Python, NumPy and OpenCV. A real image-AI reference
supplies a bounded low-frequency illumination cue. Confidence-checked optical flow
transports the treatment while source-frame compositing preserves performance.
The subject-aware experiment adds pretrained torchvision LRASPP-MobileNetV3 person
segmentation, source-RGB matte refinement and IC-Light's official foreground-latent
conditioning over an SD1.5 base. Its lighting geometry is a silhouette-based proxy,
not reconstructed physical scene geometry. Generated faces are not copied into
its film.

Each source-aware job runs in an isolated process with a timeout and retained
execution log. The worker keeps the existing /health, job-submission, status and
signed-MP4 API contract. Provider-independent URL/token configuration lets the same
application connect to an appropriately configured worker on another host without
rewriting rendering code. Model selection remains explicit; a failed subject-aware
job never silently becomes an LTX job.

CINEMA did not train or invent IC-Light, Stable Diffusion, torchvision segmentation,
LTX or Wan VACE. Its contribution is the capture-to-reference workflow, performance
preservation, treatment transport, engine orchestration, comparison and export.

## Challenges we ran into
Successful inference does not guarantee a useful cinematic result. Whole-frame
regeneration could change actors and movements; preserving source frames improved
control but made spatial lighting harder. Coarse people masks introduced visible
borders under strong foreground/background contrast. We evaluated actual beginning,
middle and end frames and retained the cleaner output instead of declaring an
experimental treatment an improvement.

We also handled browser video formats, rational frame rates, constrained model
memory, per-job errors and a repeat-job stall caused by reusing model state in a
worker thread. Isolating each render fixed the observed success/failure queue issue.
Temporary notebook hosting remains an availability limitation, not a solved
production infrastructure problem.

## Accomplishments
- A real, licensed performance and an actual AI-generated reference underpin the
  primary 120-frame, 854×480, approximately five-second MP4.
- The same input is available as an A/B/C comparison with all-frame inspection,
  masks, reference images, measured timings and exact media hashes.
- A genuine fresh-upload local app job generated its own IC-Light reference,
  processed 48 source frames, played both videos and exported matching bytes.
- The hardened CPU worker completed that two-second job in 344.672 seconds with
  3.774 GiB peak process RAM. This is not a GPU-speed claim.
- Real failure-and-retry checks succeeded after a completed model render.
- Production build, type checks and application/Python checks are documented;
  synthetic tests are not presented as proof of aesthetic quality.

## What we learned
Preserving a performance and changing its visual treatment are different technical
problems. Image AI can direct the look without replacing every face and gesture.
A defensible demo also requires inspecting the actual exported film and clearly
separating offline visual evidence from a currently reachable live service.

## What's next
Improve matte edges and temporal stability, verify the source-aware pipeline on
GPU hardware, and establish dependable public worker hosting. Current job state
and MP4s live on the worker; switching hosts does not migrate in-progress jobs.
We have not implemented a distributed queue or durable unattended serving.

## Built with
Next.js, React, TypeScript, MediaRecorder, IndexedDB, Python, NumPy, OpenCV, FFmpeg,
FFprobe, FastAPI, IC-Light, Stable Diffusion 1.5, torchvision, LTX, Vercel, Kaggle.

## Links for the form
- Project: https://madeincinema.vercel.app
- Public repository: https://github.com/Davemafy/cinema-live
- Submission branch: https://github.com/Davemafy/cinema-live/tree/experiment/subject-aware-cinematography
- Primary actual film: docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4
- Final demonstration: submission/assets/cinema-final-demo.mp4
- A/B/C evidence: docs/evidence/subject-aware-v1/comparison-abc.mp4
- Technical record: docs/subject-aware-cinematography.md
- Attribution: submission/ATTRIBUTIONS.md
- Public YouTube demonstration URL: add after authenticated publication.

## Attribution and limitations
Source: ARTSEDGE / The Kennedy Center, Charleston-dance.webm, CC BY 3.0, excerpt
and transcode by CINEMA. The source author does not endorse the project. Primary
B image reference: actual OpenAI image-generation tool; the specific model name
was not exposed, and recorded provenance remains in the repository. C uses the
pinned IC-Light and SD1.5 checkpoints with torchvision person segmentation.
See submission/ATTRIBUTIONS.md for model/code terms and media credits.

Recording is silent. Uploaded AAC audio is retained by source-aware export;
the demonstrated performance is silent. People segmentation is coarse and not
instance-specific. Lighting geometry and contact darkening are approximate.
GPU execution of the new pipeline and complete public source-aware generation
are not verified. A working website or passing test is not evidence that these
limitations have been resolved.
