# CINEMA — judging instructions and verified evidence

Public site (unchanged production deployment): https://cinema-live-six.vercel.app

Experiment implementation: https://github.com/Davemafy/cinema-live/tree/experiment/preservation-aware-treatment

## What you can test in the public studio

1. Upload an MP4/WebM/MOV less than 4 MB, click **Use sample performance**, or explicitly enable a camera.
2. Preview the actual source. Normalization preserves composition and produces a compatible MP4.
3. Download the original and normalized input. Refresh the page to recover the take stored in IndexedDB.
4. If model-backed rendering is unavailable, the site reports the real service state. The existing LTX/Kaggle asynchronous pathway is experimental and requires a running GPU provider. Do not treat source preview as AI-generated video.

## Actual verified offline finishing experiment

The experimental branch contains a real **AI-image-directed** appearance transfer, rendered from a licensed human Charleston performance. The AI image is an approved-looking *reference*, not a generated video frame. CINEMA transports its broad illumination/color information through the original frames with confidence-checked OpenCV optical flow and preserves source geometry. This is **not** physical relighting, arbitrary scene replacement or a verified live production inference endpoint.

- Original input: `public/demo-performance.mp4`
- Film: `docs/evidence/preservation-v1/treated-source.mp4`
- 56-second comparison explanation: `docs/evidence/preservation-v1/cinema-evidence-demo.mp4`
- Exact reproducibility, dimensions, hashes, limitations: `docs/evidence/preservation-v1/run.json`
- Licensed source and image AI: `docs/evidence/preservation-v1/CREDITS.md`

The result was browser-played to completion and FFprobe-validated at 854×480, 120 frames, ~5.005 seconds. This particular sample is silent. AAC preservation was separately tested.

## What is not proven

A visitor cannot be promised a fresh image-AI cinematic film on public Vercel; model-serving integration and reliable live availability are unfinished. LTX and Wan VACE were executed on Kaggle GPUs, but their weak visual results were not adopted. Never confuse the offline evidence movie with a new public render.

The real technical work is preserving the recorded performance while following an AI-originated visual direction, not a thin text-to-video API wrapper.

## Subject-aware successor — real local prototype, not a public replacement

`experiment/subject-aware-cinematography` adds an actual IC-Light/SD1.5 reference
for each input, automatic moving-person segmentation, silhouette-based spatial
lighting, independent background exposure and source-frame compositing. This is
not physically accurate relighting. The genuine A/B/C film, all-frame inspection,
model revisions, CPU measurements and actual fresh-upload local app verification
are in `docs/subject-aware-cinematography.md` and `docs/evidence/subject-aware-v1`.

A different 2-second upload generated a new reference and film, played to
completion and downloaded with matching bytes through the local app. Public
activation is blocked by missing reachable worker hosting. Production and working
LTX remain unchanged. Matte artifacts prevent claiming overall visual improvement
over the previous result; this remains an experiment, not the submission's quality
winner. Keep the verified offline demo clearly labeled. No submission occurred.
