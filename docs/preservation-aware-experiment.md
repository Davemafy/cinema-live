# CINEMA: preservation-aware quality experiment

The product remains **CINEMA**: Record one performance. Explore a cinematic
treatment from the entire recorded clip. Compare the source and result, and
download the film. This branch changes experiment code and evidence only, not the
production UI, LTX server, deployment or product identity.

## Actual result: source-preserving path

An actual image-AI edit was generated from frame zero of the existing licensed
Charleston performance using the OpenAI image generation tool in this session.
The tool did not expose its model identifier. The intended direction was warm
amber light from the left, restrained cool light on the right, subdued stage
ambience and detailed shadows. The generated image is an **appearance reference**,
not a video result. Generated faces and poses drifted, so these generated pixels
were excluded from the output film.

`treatment_transfer.py` derives a smooth, bounded RGB illumination/color gain
field in linear light. OpenCV dense flow, forward/backward correspondence checks,
confidence fallback and smoothing propagate the field. Each output uses its
corresponding original frame's pixels; no frame, face, pose or camera movement is
synthesized or warped. FFmpeg encodes the result at original dimensions/frame
rate. AAC input audio is copied; other audio is transcoded to AAC.

This is **AI-derived low-frequency appearance transfer**, not physically accurate
relighting, scene geometry generation or arbitrary video diffusion. It transfers
direction from an actual generated image rather than applying a canned LUT and
calling that generative AI. It cannot reliably create new weather, objects or
occlusion-aware volumetric light.

Two real CPU executions produced the same MP4 hash:
`529578a4f5910709ac39b1132cd654749fc56e87654965b476c88ffe11275862`.
The second took 20.808 seconds, excluding image generation. The video has 120
frames at 24000/1001 fps, 854×480, approximately 5.005 seconds. No downscaling.
This source is silent; audio preservation is separately verified with a real AAC
fixture and bit-identical extracted AAC packets. Do not claim this sample had
audio. Source/reference/output hashes and actual configuration are in `run.json`.

Start/middle/end and the 120-frame contact sheet were inspected. Amber/cool
separation and a darker stage are visible; the original subjects, choreography
and source motion blur remain. No obvious lighting flicker is visible in the
frame sequence. Browser playback verification covers the entire exported clip.
This is useful finishing evidence, not an exceptional generative reinterpretation
or a verified live camera-to-new-image-AI workflow.

Evidence in [evidence/preservation-v1](evidence/preservation-v1): actual MP4,
AI reference, source/output comparison, every-frame sheet and provenance.

## Generative path: one controlled restyled-reference test

The existing Wan experiment now accepts `--appearance-reference` and
`--cache-only`. It retains the same source, seed, 49 frames, 448×256, 12 fps,
30 steps, grayscale full-video conditioning, mask and sampling controls. Only
appearance reference changes. Existing GPU device-placement fixes are retained.
Cache-only mode refuses downloads and requires the pinned cached checkpoint.
Existing venvs are preserved; bootstrap no longer clears them.

The owner reports that the previous original-reference Wan run completed on T4
in 224 seconds with approximately 5.19 GiB allocated, but weak transformation.
Those are owner-supplied results; the baseline MP4 and full logs have not been
provided here for visual inspection. No restyled-reference GPU execution or
improvement is claimed. Keep LTX and the demonstrated Wan baseline unchanged
until the actual candidate MP4 is inspected against both.

Run the single pinned cell `run_preservation_cell.py` in the existing Kaggle GPU
session. It reuses `/tmp/cinema-vace-venv` and `/tmp/cinema-vace-cache`, verifies
script/asset hashes, reproduces the CPU transfer, and runs one cache-only Wan
generation. It preserves evidence under `/kaggle/working`, including errors, and
does not start a tunnel, change a service or use a CINEMA API token. If resources
or cache are missing, stop and preserve logs rather than redownloading unchanged.

## Smallest credible combination and references

- [IC-Light](https://github.com/lllyasviel/IC-Light): inspected actual SD1.5 UNet
  concatenated-condition implementation and checkpoint. Code is Apache 2.0;
  its demo additionally depends on SD1.5-derived model weights and BRIA foreground
  removal, whose licenses need separate handling. It is not integrated here.
- [Light-A-Video](https://github.com/bcmi/Light-A-Video): Apache 2.0 code, inspected
  Wan/CogVideoX relighting route and Python 3.10 environment. Not integrated:
  another video backbone/dependency reconstruction is unnecessary for testing
  source-frame preservation and existing Wan appearance conditioning.
- [AnyV2V](https://github.com/TIGER-AI-Lab/AnyV2V): MIT code; edited-keyframe
  propagation and I2VGen-XL feature injection were inspected. Authors' A6000
  examples are not taken as proof of T4 fit; additional checkpoints are avoided.
- [OpenCV optical flow](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html):
  explicit motion correspondence in this implementation. OpenCV 4.11 is Apache 2.0.
- [Wan VACE task guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md):
  documented video/mask/reference conditioning, reused in the generative test.

SAM 2 is not required for this prototype: it never replaces source subject
pixels. Segmentation may be necessary for a future background-replacement route;
no such feature is claimed. No foundation model was trained.

## Verified checks and remaining blocker

CPU tests verify identity/no-op color transfer, confidence-based field transport,
real MP4 export, frame count/dimensions/timebase and AAC stream preservation,
provenance mismatch rejection and non-overwrite behavior. Existing Wan CPU tests
still cover scheduler, video/mask/reference graph and explicit GPU-boundary
embedding staging. Tests use labeled synthetic fixtures, not fake AI evidence.

No direct Kaggle execution access is available. The owner must run the pinned
cell for the new generative result. The OpenAI session image tool is not a
configured production image-generation endpoint. Public deployment and complete
live user journey are therefore not advanced by this offline evidence alone.

Do not increase hackathon-readiness scores based on a valid output file. The
source-preserving look is stronger and preserves detail in the inspected clip;
direct visual superiority over LTX/Wan and the complete product still require
baseline media, GPU evidence and integration verification.
