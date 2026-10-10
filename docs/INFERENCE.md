# Reproduce genuine inference

No GPU is attached to the current managed environment. No FAL_KEY is configured.
The chosen production path runs inference on fal's GPU infrastructure, so the
missing resource is **authorized access to that endpoint**, not a GPU on Vercel.
There is no useful CPU-only fallback for the selected 22B model here.

## Selected hosted path

1. Configure a funded `FAL_KEY` as a secret on the local environment and CINEMA's
   production Vercel project. Set a small provider-side spending cap.
2. Obtain owner authorization for renders. `INFERENCE_ENABLED=true` is the
   implementation gate, not evidence of spending authorization by itself.
3. Configure a stable random `JOB_SIGNING_SECRET` (at least 32 characters).
4. Run a real performance through the deployed UI. Inspect source/result actions,
   character continuity and scene treatment. Download and decode the result.
5. Record job ID, model, config, provider inference time and actual output video.

Provider documentation and current price example, checked 2026-10-10:
https://fal.ai/models/fal-ai/ltx-2.3-22b/distilled/video-to-video
Listed cost is $0.001205 per generated megapixel. Its example of 121 frames at
1280 × 720 costs about $0.1344. Billing follows provider calculations; this is
not an inference benchmark or a guaranteed cap.

After authorization, this command performs real preprocessing, submission,
polling and download (the script loads `.env.local` without printing it):

```sh
NODE_USE_ENV_PROXY=1 node --import tsx scripts/prove-inference.ts public/demo-performance.mp4 artifacts/inference
```

Inspect `artifacts/inference/result-contact-sheet.jpg` and `result.mp4`. The script
cannot judge performance preservation for you and does not claim success merely
because the file exists. On hosted Vercel, exercise playback, comparison and
export again; a local script alone is not deployed-journey verification.

## Self-hosted alternative, not executed

Official LTX-Video revision inspected:
`4b2d053057623ddd4d0a1d3e9cd28890e9ef487f`.
https://github.com/Lightricks/LTX-Video

The official implementation supports complete video-segment conditioning with
`conditioning_media_paths`, `conditioning_start_frames`, and
`conditioning_strengths`. This is different from extending a video and from
using only the first frame. A reproducible starting command is:

```sh
git clone https://github.com/Lightricks/LTX-Video.git ltx-video
cd ltx-video
git checkout 4b2d053057623ddd4d0a1d3e9cd28890e9ef487f
python -m venv .venv
. .venv/bin/activate
python -m pip install -e .
python inference.py \
  --pipeline_config configs/ltxv-13b-0.9.8-distilled.yaml \
  --conditioning_media_paths /absolute/path/performance.mp4 \
  --conditioning_start_frames 0 --conditioning_strengths 0.7 \
  --prompt 'A realistic black-and-white cinematic restyling of the same recorded performance, preserving gesture timing and framing, sculpted side light, subtle film grain.' \
  --height 448 --width 768 --num_frames 121 --frame_rate 24 \
  --offload_to_cpu true --output_path outputs
```

Input segments should contain `8n+1` frames for this implementation. Prepare 121
frames, extending the last source frame by one if needed, without changing action
timing. Follow the pinned repo's CLI `--help` and model license. Dependencies and
weights are downloaded by the official implementation; inspect them before use.

GPU VRAM/latency for this alternative are **not measured** on available hardware.
Do not procure hardware based on an invented exact requirement. Before approving
compute, confirm a compatible CUDA GPU, sufficient RAM/disk for weights, and the
chosen precision/offloading configuration with the official repository. The
hosted endpoint above is the lower-friction route for this mission and avoids
provisioning an untested GPU. This alternative is not integrated into production.
