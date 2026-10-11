# Subject-aware cinematography experiment

Branch: `experiment/subject-aware-cinematography`, continued from preservation
branch d09fc90. Production and `kaggle/serve.py` (working LTX) are unchanged.

**Real image-AI inference and local product integration succeeded. Overall visual
superiority over the previous treatment has not been established.** Stop expanding
models for the hackathon. This candidate has useful independent illumination but
matte halos and changing borders; do not replace the previous verified demo or
advertise production-quality relighting.

## Inspect the actual evidence

- [A/B/C comparison MP4](evidence/subject-aware-v1/comparison-abc.mp4)
- [Beginning / middle / end](evidence/subject-aware-v1/comparison-start-middle-end.jpg)
- [All 120 output frames](evidence/subject-aware-v1/every-frame.jpg)
- [Moving predicted masks](evidence/subject-aware-v1/moving-subject-masks.mp4)
- [Actual IC-Light reference](evidence/subject-aware-v1/ic-light-reference.png)
- [Measured offline run](evidence/subject-aware-v1/run.json)
- [Fresh different-upload run](evidence/subject-aware-v1/fresh-upload-run.json)
- [Its downloaded film](evidence/subject-aware-v1/fresh-upload-download.mp4)

A is `public/demo-performance.mp4`, SHA256
`db12280afa65e42db525120158495eb50e98df55d9d78089f388f1330346ab43`.
B is the owner's attached actual appearance-transfer movie, SHA256
`396a74cb32d2a2c1aad5fb9d3f43eca0f5c3e6b33f9bbcf8580ef3ebe80afc51`.
C is a real 120-frame 854×480 H.264 movie at 24000/1001 fps, SHA256
`307dbf9682b6201d62774922b49caf902d29eea3e83438f0848a8392f483ad81`.
All output frames decode; source geometry, frame count and rational fps match.
The licensed sample is silent. This branch retains uploaded AAC audio.

## What was implemented

1. Automatic semantic people segmentation with pretrained torchvision
   LRASPP-MobileNetV3-Large COCO/VOC weights, person class 15. Checkpoint 12.5 MiB;
   3,221,538 parameters. SAM is unnecessary for this smallest viable experiment.
2. Source-conditioned **IC-Light** (`lllyasviel/ic-light`, revision
   `9cad1878695f546a7fb9eaca14e2a89131ba5ffe`) generates a fresh image from the
   uploaded frame and its foreground matte. Base SD1.5 realistic-vision-v51,
   revision `19e3643d7d963c156d01537188ec08f0b79a514a`. Official 8-channel
   foreground latent concatenation and additive UNet checkpoint are implemented;
   no invented model controls. 512×288 reference, CFG 2, strength .9,
   seed 20261012; 20 requested, **19 actually executed denoising steps**.
3. Learned probability masks receive source-RGB-guided filtering and one GrabCut
   refinement iteration. Neural inference runs on every frame; confidence-checked
   bidirectional Farneback flow transports masks and the reference lighting cue.
4. Distance-transform/Sobel **silhouette-derived 2.5D normals** respond to moving
   people. A warm key, restrained cool edge and approximate contact darkening
   follow that structure. Background exposure is independent of foreground.
5. Film pixels always come from actual source frames. The model supplies a bounded
   low-frequency intensity cue; generated faces, poses and background never enter
   the film. Subject/background editing differs from an image-wide color filter.

This is **not physically accurate relighting**, reconstructed depth, measured
surface normals or a video diffusion render. Most spatial direction is the
silhouette model; IC-Light supplies a bounded cue. It cannot infer true skin
geometry, visibility, off-screen lights or accurate cast shadows. It selects all
visible people, not an individual lead actor.

## Actual results and quality decision

The CPU machine had 9.7 GiB RAM and no NVIDIA GPU. Models total approximately
3.8 GB on disk. First actual reference: **206.131 s inference**, **221.617 s
loading + inference**, BF16 UNet/CLIP and FP32 VAE. Initial correspondence
IoU .796; refined-mask correspondence .7179. That first same-input reference was
reused explicitly for three compositing revisions, not used on another input.

C3 compositing/export/comparison took **486.271 s**, with a concurrent separate
reference render competing for CPU; peak process RAM **1.423 GiB**. This timing
excludes its cached reference generation. The first less-refined complete
compositing pass took 81.868 s; these are not GPU benchmarks.

The actual browser uploaded a different 2-second excerpt with a different first
frame. It triggered a new IC-Light reference (different reference hash), followed
by 48-frame native-resolution processing. The complete worker took **611.654 s**,
peak process RAM **3.789 GiB**; reference inference **490.416 s**, load + inference
**541.086 s**, while CPU was shared with C3. Its result SHA256
`c28dd4ffa390f193426e55cdc69cbbb915ad0bb8994f8e5736f72735c81ebec4`
exactly matches the file downloaded through the app export API.

The original browser test hit its 600 s wait limit before completion. Verification
then reattached that genuinely completed server job, passed source-hash validation,
played original and output through their ends, and downloaded it. It did not
submit a fake render or use the fixed demo. Both videos: 2.002 s, 854×480, no media
or page errors; 390-pixel viewport has no horizontal overflow. This tested the
local development app, not public Vercel. Later normalization additionally
stream-copies already-compatible source H.264/CFR; that final change is tested
separately, not claimed as the original browser submission.

Beginning, middle, end and all 120 frames show moving recognizable performers
with a darkened room and independent foreground response. Borders around arms,
feet and clothing still reveal the matte; contact shadows are approximate. The
contrast is stronger, but this is **not a verified overall improvement over B**.
No new model chase or replacement of the working engine is warranted before the
submission deadline. GPU inference has not been tested here.

## Product wiring

The existing radio group gains **Directed light**. Its separate availability and
provider route never dispatch to LTX or fal. The server preserves compatible
native source video or normalizes recorder timing/orientation with no downscale,
then calls `kaggle/cinematography_worker.py`. Each new random job directory creates
its own actual reference. An authenticated serial queue uses a fresh bounded subprocess for each render and gives real queued,
rendering, failed and succeeded states. Successful metadata must prove image-AI
execution and match the signed submitted source hash before result acceptance.
Exports use signed media URLs and the existing download proxy.

For a local worker, privately configure `CINEMA_SUBJECT_TOKEN` (32+ random
characters), `CINEMA_SUBJECT_ORIGIN=http://127.0.0.1:8892`, and
`CINEMA_SUBJECT_CACHE` to the weights cache. Use a separate Python 3.12 environment (at least 6 GiB host RAM; roughly 3.8 GB
weights and additional output space). The actual CPU run used PyTorch 2.5.1+cpu
and torchvision 0.20.1+cpu. Install that compatible pair from the official PyTorch
CPU wheel index, then `pip install -r kaggle/requirements-subject.txt`. CUDA users
must keep a matching torch/torchvision pair; do not replace the working LTX venv.
Start with that compatible Python installation:

```sh
python -u kaggle/cinematography_worker.py
```

In development only, set `CINEMA_ALLOW_LOCAL_ENGINE=true` and privately set
`CINEMA_CINEMATOGRAPHY_URL=http://TOKEN@127.0.0.1:8892`; keep a stable
`JOB_SIGNING_SECRET`. Production requires a reachable HTTPS worker. Never put the
private URL/token in a public notebook, frontend or commit. Worker video links
last four hours; worker jobs are session-scoped and lost on restart. Storage
cleanup/durable multi-user hosting remains unsupported; do not expose this
prototype as an unlimited public service. Upload limit is 4 MB, app duration 5 s,
source size at most 1080p. Python uses local-file-only FFmpeg protocols.

**Public deployment blocker:** no reachable authorized inference-worker URL is
available here. The CPU worker is local; this environment has no public port
forwarding capability or connected Kaggle execution session. Vercel Hobby cannot
host this model inside its 2 GB function. Production has not been changed. A new
public user upload is not yet verified for this treatment.

## Verification

TypeScript, production build, application tests and Python tests run independently;
synthetic tests prove compositing/dispatch boundaries, not visual quality. Real
IC-Light inference, MP4 decoding, actual browser comparison/export and frame
inspection provide the media evidence. The existing verified offline demo stays
explicitly labeled and separate from user generation.

See the evidence credits for source/model attribution. CINEMA contributes capture,
per-input reference orchestration, semantic/flow transport, source compositing,
comparison and export; it did not train these pretrained models.


## Isolated Kaggle reproduction

`kaggle/experiments/run_subject_cell.py` pins the already published source commit
and SHA256 of every code/video asset. The delivered single notebook cell also
pins the launcher itself. It checks disk, host RAM and at least 5 GiB available
on one GPU before downloads. It reuses existing subject-model caches and creates
an isolated venv inheriting Kaggle CUDA torch, without touching LTX/Wan venvs.
It performs exactly one fresh source-conditioned IC-Light image render and
exports the actual film, A/B/C comparison and beginning/middle/end frames. It does
not use the stored C reference or movie as generation output. A 30-minute render
limit preserves error logs and stops without claiming success on failure.

The cell is syntax/API/integrity checked here; **Kaggle GPU execution has not run**.
Its memory gate is conservative, not proof of T4 fit or speed. No public worker
or production deployment is started by the cell. Model caches are never deleted.


Repeat-job validation found a stall when PyTorch/diffusion state was reused in a
background worker thread. The worker now runs each job in a fresh subprocess,
retains its execution log and enforces a 30-minute hard timeout. A failed job
returns a truthful failure instead of permanently holding a loading state. The
successful fresh-upload measurements above describe the first worker version;
the hardened worker is checked separately for empty-subject failure and retry.


The hardened worker subsequently completed a **new real browser submission**:
48 frames, 2.002 s, 854×480 at 24000/1001 fps. Actual CPU total **344.672 s**,
reference inference **268.765 s**, load + inference **297.782 s**, peak process RAM
**3.774 GiB**. It generated its own reference in a fresh directory; only weights
were reused. Reference and film hashes exactly reproduce the previous same-input
run (deterministic seed/configuration). The file downloaded through the app again
matches c28dd4...bec4. Both videos played to completion, no page/media errors or
mobile overflow; **no recovery or reattached capability was needed this time**.
The final native-source normalization and signed input-hash check were exercised.
See `hardened-worker-run.json`, its actual execution log and
`hardened-browser-verification.json` in the evidence folder. Different CPU load
makes timings incomparable as a controlled speed benchmark. This verifies the
execution fix, not improved image quality or public availability.


Two additional genuine no-person failures and retries also completed after that
successful hardened-worker inference. The serial queue remains usable after both
success and failure. Evidence: `after-success-failure-verification.json`. This
addresses the observed runtime stall; it does not validate GPU hardware or durable
public hosting. The public production deployment remains unchanged.
