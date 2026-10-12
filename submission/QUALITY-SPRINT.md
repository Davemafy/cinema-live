# CINEMA quality-sprint submission notes

Status: evidence prepared, not submitted in this sprint. Production is unchanged.
The original product name/promise and interface are retained.

## Demonstrable contribution

Independent/student filmmakers need to explore visual treatments without
reassembling their actors, location and equipment for each look. CINEMA begins
with a real performance and preserves a comparison against its source.

The latest actual example uses image AI to establish an amber/cool cinematic
direction, derives a bounded illumination/color field, transports that field with
confidence-checked optical flow, and composites against original frames. The
generated image's faces/poses are excluded. Every output frame retains source
geometry and detail. This contribution is orchestration and preservation-aware
treatment transfer, not foundation-model invention or physically exact relighting.

The original capture/upload/preprocessing, asynchronous model jobs, comparison and
export application remains intact. LTX/Wan are open-source models by their authors.
The owner reports successful GPU baselines but weak visual transformation. A new
restyled-reference Wan experiment is ready; it must run and be inspected before
being represented as an improvement or integrated into the public workflow.

## Media available now

- `docs/evidence/preservation-v1/treated-source.mp4`: actual 5.005-second,
  854×480 source-preserving result, visually reviewed and fully played in Chromium.
- `ai-reference.png` and `ai-provenance.json`: actual generated image and exact
  prompt; tool model identifier was not exposed. Reference is not a film output.
- `comparison.jpg`, `every-frame.jpg`, `run.json`: actual inspection/evidence.
- `cinema-evidence-demo.mp4`: 56-second offline evidence montage, with accurate
  labels. It shows before/after immediately and identifies pending integration.
  This is an evidence draft; it does not demonstrate a live deployed render.

Source: ARTSEDGE/The Kennedy Center, Charleston-dance.webm, CC BY 3.0. Changes:
the existing five-second excerpt, encoding/audio removal, image-AI reference and
appearance-transfer adaptation. Credits and license links accompany the media.

## Limitations to disclose

This mode is 2D AI-derived appearance transfer: no new geometry, physical-light
solution or guaranteed subject-aware atmosphere. Flow can drift/occlude. Constant
frame-rate input only in this prototype; original AAC is copied when available.
The demonstrated sample is silent. No complete live image-AI upload/recording
workflow is claimed. The session image tool is not a production serving endpoint.
No direct visual ranking against LTX/Wan is possible without their actual MP4s.

Eleven Python correctness/API tests pass. Earlier unchanged application build,
TypeScript and seven application tests pass. Unit fixtures prove correctness,
not creative quality. No new GPU run or production deployment occurred here.

## Event and final publication requirements

Checked the [official Devpost page](https://banana-hacks-1111.devpost.com/).
It lists technical execution, originality, meaningful image-AI usage, usefulness
and presentation as judging criteria. Required materials include team names,
description, GitHub source and a public YouTube demonstration of at most three
minutes. Student/age eligibility must be confirmed by the actual entrants.

The page shows October 12, 00:00 EDT (05:00 WAT). Use the owner's stricter
04:59 WAT deadline. The separate rules page was inaccessible to the browsing tool.

No authenticated Devpost or YouTube publication session, team identity or
eligibility details are available here. Do not invent those or mark this as
submitted. Update the description/demo after real GPU review and final integration.
