# CINEMA — draft submission

**Status: NOT SUBMITTED. Core AI rendering is blocked; do not describe this build
as a finished camera-to-film product until a genuine deployed render is verified.**

## Tagline

A performance-first workspace for exploring cinematic treatments from a recorded take.

## Inspiration and problem

Independent filmmakers and student productions often cannot repeatedly arrange
actors, locations, costumes and lighting to explore a scene's visual treatment.
A text-generated clip does not show how a particular performance might look.
CINEMA starts with the creator's actual take and keeps that source available for
inspection, rather than replacing it with an unrelated generated scene.

## What it does — current, demonstrated build

CINEMA records a short camera performance or accepts a user video, preprocesses
it into a model-compatible MP4, previews the original, preserves it across browser
refreshes, and downloads the original or normalized input. It includes a licensed
human-performance sample and clear permission/upload error handling.

The asynchronous full-video-conditioned LTX integration, job status, result
comparison and generated-film download are implemented but **not demonstrated**
because GPU provider credentials and compute authorization were unavailable.
The production interface explicitly says AI rendering is unavailable. There are
no filters, fake progress percentages, prerecorded outputs or simulated renders.

After genuine inference is enabled and verified, update this section with the
actual job ID, measured inference duration, observed performance fidelity and
confirmed export behavior. Do not remove this disclosure based on a build or
deployment alone.

## How we built it

The application uses TypeScript, React and Next.js. Browser MediaRecorder captures
the take. FFprobe validates video containers and FFmpeg trims, scales, pads and
normalizes them to H.264 at 24 fps. Source preservation and recovery use IndexedDB.

The selected inference endpoint is Lightricks LTX-2.3 22B Distilled video-to-video,
served asynchronously on fal. The adapter uploads the entire normalized clip,
submits a fixed cinematic prompt and documented video conditioning control, and
tracks real provider queue states. Signed job capabilities permit recovery without
accounts or a database. Export streams the provider's MP4 through the server.

CINEMA contributes capture, format normalization, source preservation, treatment
selection, job orchestration, recovery, comparison and export UX. The underlying
generative model is existing work by Lightricks; CINEMA did not train or invent it.

## Design process

The temporary interface emphasizes footage, legible controls and truthful service
states. Capture, storage, provider integration and design tokens are separate,
so a subsequent verified UI reference harvest can change presentation without
rewriting the pipeline. No marketing landing page replaces the studio workflow.

## Challenges

Browser recordings can have WebM containers with no duration metadata, and host
request limits constrain upload size. The pipeline bounds decoding to five seconds
and applies a 4 MB upload limit. An origin mismatch caused by Next's internal bind
address was found through browser testing and corrected. Provider SDK retries
were removed from paid submission to avoid duplicate jobs after network errors.

The external blocker is missing authorized GPU inference access. The team did not
fabricate a successful render or claim a CPU-only model execution.

## Accomplishments and verification

Production build/type checking and seven integration/security tests pass. Browser
checks cover real MediaRecorder capture with an emulated camera, a licensed human
performance upload, MP4 normalization/playback, source download, IndexedDB refresh
recovery, invalid-file recovery and desktop/mobile layouts. Physical-camera
testing, AI cinematic quality and the complete deployed result/export journey
remain unverified.

## Limits

Five-second model input; uploads under 4 MB; a single browser-local take; silent
camera recording and silent AI output; no exact facial-identity guarantee; no
long-term media retention guarantee. Rate limiting is per function instance and
does not replace provider spending caps.

## Built with

TypeScript, React, Next.js, MediaRecorder, IndexedDB, FFmpeg, FFprobe, fal API,
Lightricks LTX-2.3 Distilled, Vercel.

Repository: https://github.com/Davemafy/cinema-live

Production URL and screenshot links: see `WORKLOG.md` after deployment verification.

## Required final submission fields

The official event page requires listed team members, a public YouTube video of
three minutes or less, a project description and GitHub source. Team identity,
eligibility and authenticated Devpost/YouTube access have not been supplied.
A local demo file alone does not satisfy its public YouTube requirement.

Official event: https://banana-hacks-1111.devpost.com/
Work deadline supplied by owner: 2026-10-12 03:59 UTC (04:59 WAT).
