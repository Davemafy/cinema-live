# Isolated Wan VACE quality experiment

Branch: `experiment/wan-vace-quality`, based on Kaggle worker commit
`02bc269ff9930facabd46862bc9f4ddb089ff3dd`. Production, the LTX worker, frontend
contracts and deployment configuration are unchanged. Nothing is deployed.

## Controlled render

`kaggle/experiments/wan_vace_quality.py` runs exactly one render using
`Wan-AI/Wan2.1-VACE-1.3B-diffusers`, revision
`ec4d2cb062b548996b179d493fdd05340de702a1` (Apache 2.0).

- Same real dance input as the LTX selftest, pinned and SHA-256 checked.
- 49 frames at 12 fps (4.083 seconds), 448 × 256, 30 steps, fixed seed 20261011.
- Documented full-video grayscale conditioning, all-white regeneration mask,
  first-frame color reference, conditioning scale 1.0 and guidance 5.0.
- Descriptive color neo-noir prompt requests directional amber key light, blue
  rim light, detailed shadows and atmosphere while retaining the dance.
- No style filter, monochrome conversion, grain or smoothing on generated output.
  FFmpeg only encodes H.264; source preparation fits/pads without cropping.

This is a **candidate**, not an adopted model or demonstrated quality improvement.
Grayscale conditioning can constrain relighting; one appearance reference can
still drift. Inspect actual video, not just the generated-file check.

## T4 feasibility and stop conditions

The pinned repository contains approximately 19.02 GB (17.71 GiB) of weights:
11.36 GB text encoder, 7.15 GB transformer, 0.51 GB VAE. Config/tokenizer files add
a small amount. The script obtains exact metadata and accounts for cached files
before loading weights. It requires uncached bytes plus 3 GiB free disk.

UMT5 uses BF16 **on CPU**, then is released before the diffusion models load.
The T4 transformer uses FP16 and CPU offload; the VAE uses FP32 and tiling. Native
CUDA BF16 or FlashAttention is not required. GPUs are never assumed to pool VRAM.

Conservative gates: at least 18 GiB available host RAM; one GPU with at least
14 GiB total and 12 GiB free VRAM. These are engineering safeguards, not measured
VACE peak requirements. The real render records peak CUDA/process memory.
The old LTX process must release its GPU/RAM for this experiment, without editing
its source or deleting cached weights. Retain its output MP4 first.

The cell creates an isolated venv, pins small libraries, retains Kaggle's CUDA
PyTorch version and validates APIs/scheduler before model downloads. Diffusers
0.35.1's prompt-embedding guard failed the CPU graph check; 0.36.0 fixes it.
Every source is compiled before execution. Resource/preflight errors stop without
weight downloads. Non-finite latents, OOM and timeout fail with logs; no automatic
retry or substitution. A render-stage budget of 30 minutes and an outer execution
timeout of 45 minutes bound the run.

## Execute

Use the single pinned cell in `kaggle/experiments/run_cell.py` in a GPU notebook
with Internet enabled. It does not start an API, create a tunnel, read a CINEMA
token or touch the running production deployment. Do not run two inference
processes on the same GPU. Preserve the working LTX notebook/cell for restart.

Optional: set `LTX_RESULT` in that same cell to the local previously generated
LTX MP4 to add a third column. Without it, comparison frames show source/VACE;
an LTX visual comparison cannot yet be claimed. For a different source, also set
`SOURCE` and a matching descriptive `PROMPT` in the cell.

Outputs in the printed timestamped directory:

- `vace-output.mp4`: actual AI output, only after a completed real render.
- `source-normalized.mp4`, `conditioning-gray.mp4`, `appearance-reference.png`:
  clearly identified input/conditioning artifacts.
- `comparison-00.png`, `comparison-24.png`, `comparison-48.png` and contact sheet.
- `run.json`: source/output hashes, config, timing, memory and decode checks.
- `experiment.log`; `failure.json` on a failed attempt.

Download the output MP4, `run.json`, contact sheet and logs for visual review.
View the entire clip and inspect beginning/middle/end. Adoption requires better
cinematic direction plus recognizable motion/subjects, temporal stability and
acceptable artifacts. Keep LTX until that evidence exists. User baseline scores
(engineering 7/10, transformation 4/10, readiness 3/10) have not been raised.

## CPU validation

Run in an isolated environment with the script's pinned dependencies and CPU
PyTorch. No foundation-model weights are downloaded:

```sh
python -m py_compile kaggle/serve.py kaggle/experiments/wan_vace_quality.py
python kaggle/experiments/wan_vace_quality.py --api-check
python -m unittest discover -s tests -p 'test_vace_experiment.py' -v
```

Checks cover memory gates, actual human-video preprocessing/encoding, grayscale
and full-frame mask semantics, API signatures/scheduler, BF16 CPU text staging,
and a tiny random-weight VACE graph plus staged loader. The tiny graph only tests
compatibility and exports no video; it proves nothing about cinematic quality.

## Primary references inspected

- [Official VACE task/preprocessing guide](https://github.com/ali-vilab/VACE/blob/main/UserGuide.md)
- [Pinned Wan model/configuration](https://huggingface.co/Wan-AI/Wan2.1-VACE-1.3B-diffusers/tree/ec4d2cb062b548996b179d493fdd05340de702a1)
- [Diffusers 0.36 VACE implementation](https://github.com/huggingface/diffusers/blob/v0.36.0/src/diffusers/pipelines/wan/pipeline_wan_vace.py)
- [LTX 0.9.7 distilled checkpoint](https://huggingface.co/Lightricks/LTX-Video-0.9.7-distilled):
  much larger transformer/text-encoder download than this candidate; its resource
  cost and unverified quality make it a higher-risk switch for the current sprint.

The often-quoted Wan T2V 8.19 GB VRAM figure is not treated as a measured VACE T4
requirement. No GPU testing, actual MP4 or visual superiority is claimed here.
