"""One isolated, evidence-producing VACE render. Never imports or starts serve.py.

No GPU inference has been verified by the authors of this experiment yet.
Run --bootstrap in a Kaggle GPU notebook, --api-check on a CPU with dependencies.
"""
from __future__ import annotations

import argparse
import contextlib
import gc
import hashlib
import importlib.metadata
import inspect
import json
import os
from pathlib import Path
import py_compile
import shutil
import subprocess
import sys
import threading
import time
import traceback
import urllib.request

MODEL = "Wan-AI/Wan2.1-VACE-1.3B-diffusers"
REVISION = "ec4d2cb062b548996b179d493fdd05340de702a1"
SOURCE_REVISION = "02bc269ff9930facabd46862bc9f4ddb089ff3dd"
SAMPLE_URL = f"https://raw.githubusercontent.com/Davemafy/cinema-live/{SOURCE_REVISION}/public/demo-performance.mp4"
SAMPLE_SHA256 = "db12280afa65e42db525120158495eb50e98df55d9d78089f388f1330346ab43"
# Match the baseline's 49/12 timing, improve spatial resolution modestly.
WIDTH, HEIGHT, FRAMES, FPS, STEPS = 448, 256, 49, 12, 30
SEED, CONDITIONING, GUIDANCE = 20261011, 1.0, 5.0
PROMPT = (
    "A continuous live-action cinematic shot of two dancers performing the Charleston, "
    "the same two people, clothing, choreography, positions and camera framing as the "
    "reference performance. A moody color neo-noir dance scene, dramatic directional "
    "amber key light from camera left, cool blue rim light, deep but detailed shadows, "
    "subtle atmospheric haze behind the dancers, natural skin texture, crisp faces "
    "and hands, realistic fabric detail. The original dance action continues smoothly "
    "throughout one uninterrupted shot. Photorealistic feature-film cinematography."
)
NEGATIVE = (
    "monochrome, sepia, gray output, flat lighting, film grain, blur, waxy skin, "
    "distorted face, extra fingers, malformed hands, extra people, changed clothing, "
    "changed choreography, frozen motion, flicker, jitter, cuts, subtitles, text, watermark"
)
PINS = {
    "diffusers": "0.36.0", "transformers": "4.49.0", "accelerate": "1.10.1",
    "huggingface-hub": "0.34.4", "safetensors": "0.6.2", "sentencepiece": "0.2.1",
    "ftfy": "6.3.1", "imageio": "2.37.0", "imageio-ffmpeg": "0.6.0",
}
GIB = 1024 ** 3


def say(message):
    print(f"[{time.strftime('%H:%M:%S')}] {message}", flush=True)


def command(args, timeout=90):
    result = subprocess.run([str(v) for v in args], capture_output=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"{args[0]} failed ({result.returncode}): "
                           + result.stderr.decode(errors="replace")[-4000:])
    return result.stdout


def available_ram():
    for line in Path("/proc/meminfo").read_text().splitlines():
        if line.startswith("MemAvailable:"):
            return int(line.split()[1]) * 1024
    raise RuntimeError("Cannot measure available system RAM")


def resource_gate(ram, disk, gpu_total, gpu_free, uncached_weights=19_015_511_004):
    """Conservative engineering gates, not measured model peak requirements."""
    reasons = []
    if ram < 18 * GIB:
        reasons.append("need at least 18 GiB AVAILABLE RAM for staged UMT5 loading; stop the old worker")
    if disk < uncached_weights + 3 * GIB:
        reasons.append("insufficient free disk for uncached weights plus 3 GiB headroom")
    if gpu_total < 14 * GIB or gpu_free < 12 * GIB:
        reasons.append("need one GPU with at least 14 GiB total and 12 GiB free VRAM; two T4s are not pooled")
    if reasons:
        raise RuntimeError("HARDWARE GATE: " + "; ".join(reasons) + ". No weights downloaded, no render attempted.")


def hardware(out):
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("HARDWARE GATE: CUDA unavailable. Enable Kaggle T4 GPU. No weights downloaded.")
    devices = []
    for index in range(torch.cuda.device_count()):
        free, total = torch.cuda.mem_get_info(index)
        devices.append({"index": index, "name": torch.cuda.get_device_name(index),
                        "free": free, "total": total,
                        "capability": list(torch.cuda.get_device_capability(index))})
    device = max(devices, key=lambda d: d["free"])
    report = {"ramAvailable": available_ram(), "diskFree": shutil.disk_usage(out).free,
              "torch": torch.__version__, "cuda": torch.version.cuda, "devices": devices,
              "selectedDevice": device["index"]}
    say("HARDWARE " + json.dumps(report))
    # The exact uncached download size is checked after lightweight dependency
    # validation. This first gate also works when weights are already cached.
    resource_gate(report["ramAvailable"], report["diskFree"], device["total"], device["free"], 0)
    return report


def validate_apis():
    import torch
    from diffusers import WanVACEPipeline, AutoencoderKLWan, WanVACETransformer3DModel
    from diffusers import UniPCMultistepScheduler
    from transformers import UMT5EncoderModel, AutoTokenizer
    versions = {name: importlib.metadata.version(name) for name in PINS}
    mismatches = [f"{k}={versions[k]} (expected {v})" for k, v in PINS.items() if versions[k] != v]
    if mismatches:
        raise RuntimeError("Dependency mismatch: " + ", ".join(mismatches) + "; run --bootstrap")
    required = {"video", "mask", "reference_images", "conditioning_scale", "height", "width",
                "num_frames", "num_inference_steps", "guidance_scale", "generator", "prompt_embeds",
                "negative_prompt_embeds", "callback_on_step_end", "max_sequence_length"}
    missing = required - set(inspect.signature(WanVACEPipeline.__call__).parameters)
    if missing:
        raise RuntimeError("Unsupported WanVACEPipeline API: " + ", ".join(sorted(missing)))
    for cls, method in [(WanVACEPipeline, "encode_prompt"), (WanVACEPipeline, "enable_model_cpu_offload"),
                        (AutoencoderKLWan, "enable_tiling")]:
        if not callable(getattr(cls, method, None)):
            raise RuntimeError(f"Missing required API {cls.__name__}.{method}")
    scheduler = UniPCMultistepScheduler(prediction_type="flow_prediction", use_flow_sigmas=True, flow_shift=3.0)
    scheduler.set_timesteps(STEPS, device="cpu")
    if len(scheduler.timesteps) != STEPS or not torch.isfinite(scheduler.timesteps).all():
        raise RuntimeError("Scheduler preflight failed")
    if FRAMES % 4 != 1 or WIDTH % 16 or HEIGHT % 16:
        raise RuntimeError("Invalid temporal or spatial dimensions")
    for exe in ("ffmpeg", "ffprobe"):
        if not shutil.which(exe):
            raise RuntimeError(f"Install {exe} before running; no model downloads attempted")
    say("API PREFLIGHT PASSED (CPU, zero model weights): " + json.dumps(versions))
    return versions


def fetch_sample(out):
    target = out / "original.mp4"
    with urllib.request.urlopen(SAMPLE_URL, timeout=45) as response:
        data = response.read(4_000_001)
    if len(data) > 4_000_000 or hashlib.sha256(data).hexdigest() != SAMPLE_SHA256:
        raise RuntimeError("Pinned sample integrity check failed")
    target.write_bytes(data)
    say("SOURCE: licensed real human dance, CC BY 3.0; input only, not generated output")
    return target


def read_source(path):
    from PIL import Image
    # Same beginning/timebase as the baseline. Fit, pad; never crop or stretch.
    frame_size = WIDTH * HEIGHT * 3
    raw = command([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-threads", "2",
        "-i", path, "-an", "-vf",
        f"fps={FPS},scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease:force_divisible_by=2,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=rgb24",
        "-frames:v", FRAMES, "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
    ])
    if len(raw) % frame_size:
        raise RuntimeError("Partial decoded frame")
    count = len(raw) // frame_size
    if count < FRAMES:
        raise RuntimeError(f"Need {FRAMES} source frames at {FPS} fps; decoded {count}. Use a >=4.1-second clip.")
    return [Image.frombytes("RGB", (WIDTH, HEIGHT), raw[i * frame_size:(i + 1) * frame_size])
            for i in range(FRAMES)]


def conditions(frames):
    from PIL import Image
    if len(frames) != FRAMES or any(f.size != (WIDTH, HEIGHT) for f in frames):
        raise RuntimeError("Incorrect source conditioning dimensions/count")
    # Official VACE 'gray' control, full-white regeneration mask, one color frame
    # as appearance reference. Every source frame conditions the output motion.
    gray = [frame.convert("L").convert("RGB") for frame in frames]
    masks = [Image.new("L", (WIDTH, HEIGHT), 255) for _ in frames]
    return gray, masks, [frames[0].copy()]


def encode_mp4(frames, target):
    import numpy as np
    if len(frames) != FRAMES:
        raise RuntimeError(f"Expected {FRAMES} output frames, got {len(frames)}")
    data = bytearray()
    for f in frames:
        a = np.asarray(f)
        if a.shape != (HEIGHT, WIDTH, 3) or not np.isfinite(a).all():
            raise RuntimeError("Model returned invalid/non-finite image data")
        if a.dtype != np.uint8:
            if a.min() < 0 or a.max() > 1:
                raise RuntimeError("Model returned pixels outside [0, 1]")
            a = np.rint(a * 255).astype(np.uint8)
        data.extend(a.tobytes())
    # Encoding only. NO hue, contrast, grain, smoothing or stylistic postprocess.
    args = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-f", "rawvideo",
            "-pixel_format", "rgb24", "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS),
            "-i", "pipe:0", "-an", "-c:v", "libx264", "-threads", "2", "-crf", "18",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-y", str(target)]
    result = subprocess.run(args, input=bytes(data), capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError("MP4 encode failed: " + result.stderr.decode(errors="replace")[-3000:])


def comparison(frames, generated, out, ltx_path=None):
    import numpy as np
    from PIL import Image, ImageDraw
    baseline = read_source(ltx_path) if ltx_path else None
    indices = (0, FRAMES // 2, FRAMES - 1)
    sheets = []
    for i in indices:
        a = np.asarray(generated[i])
        if a.dtype != np.uint8:
            a = np.rint(a * 255).astype(np.uint8)
        images = [frames[i], Image.fromarray(a)]
        labels = ["SOURCE (normalized input)", "VACE (AI output; no grade)"]
        if baseline:
            images.append(baseline[i]); labels.append("LTX baseline (includes FFmpeg grade)")
        sheet = Image.new("RGB", (WIDTH * len(images), HEIGHT + 42), "#141414")
        draw = ImageDraw.Draw(sheet)
        for col, (im, label) in enumerate(zip(images, labels)):
            sheet.paste(im, (col * WIDTH, 42))
            draw.text((col * WIDTH + 8, 9), f"{label} | frame {i}, {i / FPS:.2f}s", fill="white")
        sheet.save(out / f"comparison-{i:02d}.png")
        sheets.append(sheet)
    all_frames = Image.new("RGB", (sheets[0].width, sheets[0].height * len(sheets)), "black")
    for row, sheet in enumerate(sheets):
        all_frames.paste(sheet, (0, row * sheet.height))
    all_frames.save(out / "comparison-contact-sheet.jpg", quality=95)


def inventory(cache):
    from huggingface_hub import HfApi, try_to_load_from_cache
    info = HfApi().model_info(MODEL, revision=REVISION, files_metadata=True)
    if info.sha != REVISION:
        raise RuntimeError("Unexpected model revision")
    files = [f for f in info.siblings if f.rfilename.startswith(
        ("text_encoder/", "transformer/", "vae/", "tokenizer/", "scheduler/"))
        and (f.rfilename.endswith((".safetensors", ".json", ".model")))]
    missing, total = 0, 0
    for f in files:
        if f.size is None:
            raise RuntimeError("Cannot establish download size for " + f.rfilename)
        total += f.size
        hit = try_to_load_from_cache(MODEL, f.rfilename, revision=REVISION, cache_dir=str(cache))
        if not isinstance(hit, str) or not Path(hit).is_file():
            missing += f.size
    say(f"PINNED MODEL: {total / GIB:.2f} GiB files, {missing / GIB:.2f} GiB uncached. No download yet.")
    return missing


@contextlib.contextmanager
def heartbeat(stage, torch):
    stop = threading.Event()
    started = time.monotonic()
    def monitor():
        while not stop.wait(20):
            gpu = (f", CUDA allocated {torch.cuda.memory_allocated() / GIB:.2f} GiB" if torch.cuda.is_available() else "")
            say(f"{stage}: {time.monotonic() - started:.0f}s elapsed, RAM available {available_ram() / GIB:.1f} GiB{gpu}")
    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()
    try:
        yield
    finally:
        stop.set(); thread.join(timeout=1)


def render(args, out):
    import torch
    from diffusers import AutoencoderKLWan, WanVACEPipeline, UniPCMultistepScheduler
    from transformers import UMT5EncoderModel, AutoTokenizer
    versions = validate_apis()
    hw = hardware(out)
    torch.cuda.set_device(hw["selectedDevice"])
    torch.set_num_threads(min(4, os.cpu_count() or 1))
    cache = out.parent / "cinema-vace-cache"
    missing = inventory(cache)
    free, total = torch.cuda.mem_get_info()
    resource_gate(available_ram(), shutil.disk_usage(out).free, total, free, missing)
    source = Path(args.source).resolve() if args.source else fetch_sample(out)
    if not source.is_file():
        raise RuntimeError("Source video does not exist")
    frames = read_source(source)
    gray, mask, refs = conditions(frames)
    encode_mp4(frames, out / "source-normalized.mp4")
    encode_mp4(gray, out / "conditioning-gray.mp4")
    refs[0].save(out / "appearance-reference.png")
    prompt = args.prompt or PROMPT
    config = {"model": MODEL, "revision": REVISION, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "width": WIDTH, "height": HEIGHT, "frames": FRAMES, "fps": FPS, "steps": STEPS, "seed": SEED,
              "conditioningScale": CONDITIONING, "guidanceScale": GUIDANCE, "flowShift": 3.0,
              "conditioning": "full-video-gray + white-regeneration-mask + first-frame-color-reference",
              "prompt": prompt, "negativePrompt": NEGATIVE, "transformerDtype": "float16",
              "textEncoderDtype": "bfloat16 on CPU, unloaded before diffusion", "vaeDtype": "float32",
              "stylePostprocessing": False, "versions": versions, "hardware": hw,
              "ltxBaselineSupplied": bool(args.ltx_result), "gpuVerified": False, "visualDecision": "pending"}
    (out / "run.json").write_text(json.dumps(config, indent=2))
    started = time.monotonic()
    kwargs = {"revision": REVISION, "cache_dir": str(cache), "local_files_only": False}
    # Staged loading: UMT5 never occupies T4 VRAM or shares RAM with the DiT.
    with heartbeat("LOAD/ENCODE UMT5 ON CPU", torch), torch.inference_mode():
        encoder = UMT5EncoderModel.from_pretrained(MODEL, subfolder="text_encoder", torch_dtype=torch.bfloat16,
                                                  low_cpu_mem_usage=True, use_safetensors=True, **kwargs).eval()
        tokenizer = AutoTokenizer.from_pretrained(MODEL, subfolder="tokenizer", **kwargs)
        text_pipe = WanVACEPipeline.from_pretrained(MODEL, text_encoder=encoder, tokenizer=tokenizer,
                                                  transformer=None, vae=None, torch_dtype=torch.bfloat16, **kwargs)
        positive, negative = text_pipe.encode_prompt(prompt=prompt, negative_prompt=NEGATIVE,
                                                     device=torch.device("cpu"), dtype=torch.float32,
                                                     max_sequence_length=256)
        for tensor in (positive, negative):
            if not torch.isfinite(tensor).all() or tensor.abs().max() > 65504:
                raise RuntimeError("Invalid/FP16-unsafe prompt embeddings; no diffusion attempted")
        positive, negative = positive.cpu(), negative.cpu()
    del text_pipe, encoder, tokenizer
    gc.collect()
    say("UMT5 released. RAM available " + f"{available_ram() / GIB:.1f} GiB")
    load_started = time.monotonic()
    with heartbeat("LOAD VACE + VAE", torch):
        vae = AutoencoderKLWan.from_pretrained(MODEL, subfolder="vae", torch_dtype=torch.float32,
                                              use_safetensors=True, low_cpu_mem_usage=True, **kwargs)
        pipe = WanVACEPipeline.from_pretrained(MODEL, vae=vae, text_encoder=None, tokenizer=None,
                                              torch_dtype=torch.float16, use_safetensors=True,
                                              low_cpu_mem_usage=True, **kwargs)
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=3.0)
        pipe.scheduler.set_timesteps(STEPS, device="cpu")
        pipe.enable_model_cpu_offload(gpu_id=hw["selectedDevice"])
        pipe.vae.enable_tiling()
    config["diffusionModelLoadSeconds"] = round(time.monotonic() - load_started, 2)
    config["loadAndPromptSeconds"] = round(time.monotonic() - started, 2)
    torch.cuda.reset_peak_memory_stats()
    generation_start = time.monotonic()
    def step_end(pipeline, step, timestep, callback_kwargs):
        latents = callback_kwargs["latents"]
        if not torch.isfinite(latents).all():
            raise RuntimeError(f"Non-finite diffusion latents at step {step + 1}. FP16 numerical failure; do not retry unchanged.")
        elapsed = time.monotonic() - generation_start
        say(f"DENOISE STEP {step + 1}/{STEPS}, timestep {float(timestep):.1f}, {elapsed:.1f}s elapsed")
        if elapsed > 1800:
            raise TimeoutError("Render exceeded 30-minute GPU stage budget. Retain LTX; do not repeat unchanged.")
        return callback_kwargs
    say("ONE CONTROLLED RENDER STARTING; no retry, no post-grade")
    with heartbeat("GPU RENDER (includes conditioning/decoding)", torch), torch.inference_mode():
        result = pipe(
            video=gray, mask=mask, reference_images=refs,
            prompt_embeds=positive, negative_prompt_embeds=negative,
            height=HEIGHT, width=WIDTH, num_frames=FRAMES,
            num_inference_steps=STEPS, conditioning_scale=CONDITIONING,
            guidance_scale=GUIDANCE, generator=torch.Generator(device="cpu").manual_seed(SEED),
            max_sequence_length=256, callback_on_step_end=step_end,
        ).frames[0]
    torch.cuda.synchronize()
    config["inferenceSeconds"] = round(time.monotonic() - generation_start, 2)
    config["peakCudaAllocatedGiB"] = round(torch.cuda.max_memory_allocated() / GIB, 3)
    config["peakCudaReservedGiB"] = round(torch.cuda.max_memory_reserved() / GIB, 3)
    import resource
    config["peakProcessRamGiB"] = round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024 / GIB, 3)
    target = out / "vace-output.mp4"
    encode_mp4(result, target)
    probe = json.loads(command(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
                               "-show_entries", "stream=width,height,nb_read_frames,r_frame_rate:format=duration",
                               "-of", "json", target]))
    stream = probe["streams"][0]
    if int(stream["nb_read_frames"]) != FRAMES or stream["width"] != WIDTH or stream["height"] != HEIGHT:
        raise RuntimeError("Encoded MP4 failed frame/dimension validation")
    command(["ffmpeg", "-v", "error", "-i", target, "-f", "null", "-"])
    comparison(frames, result, out, args.ltx_result)
    config.update({"gpuVerified": True, "outputProbe": probe,
                   "totalSeconds": round(time.monotonic() - started, 2),
                   "outputSha256": hashlib.sha256(target.read_bytes()).hexdigest()})
    (out / "run.json").write_text(json.dumps(config, indent=2))
    say("REAL INFERENCE COMPLETED; visual quality and adoption remain unverified")
    say("RESULT " + str(target)); say("EVIDENCE " + str(out / "comparison-contact-sheet.jpg"))
    say("TIMINGS/MEMORY " + json.dumps(config))


def bootstrap(args, out):
    # Check the existing CUDA runtime before installing anything or fetching weights.
    hardware(out)
    env_dir = out.parent / "cinema-vace-venv"
    command([sys.executable, "-m", "venv", "--system-site-packages", env_dir], timeout=120)
    interpreter = env_dir / "bin/python"
    import torch
    # Hold Kaggle's CUDA PyTorch version fixed. Never install/replace CUDA wheels.
    constraint = out / "torch-constraint.txt"
    constraint.write_text("torch==" + torch.__version__ + "\n")
    pins = [f"{name}=={version}" for name, version in PINS.items()]
    say("INSTALL PINNED SMALL LIBRARIES in isolated venv; retain Kaggle PyTorch")
    subprocess.run([str(interpreter), "-m", "pip", "install", "--disable-pip-version-check",
                    "--constraint", str(constraint), *pins], check=True, timeout=600)
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["TOKENIZERS_PARALLELISM"] = "false"
    env["HF_HUB_DOWNLOAD_TIMEOUT"] = "120"
    forwarded = [str(interpreter), "-u", str(Path(__file__).resolve()), "--out", str(out)]
    for flag, value in [("--source", args.source), ("--ltx-result", args.ltx_result), ("--prompt", args.prompt)]:
        if value:
            forwarded.extend([flag, value])
    subprocess.run([str(interpreter), "-u", str(Path(__file__).resolve()), "--api-check"], env=env, check=True, timeout=120)
    say("EXECUTE ONCE, 45-minute whole-experiment timeout (includes downloads)")
    subprocess.run(forwarded, env=env, check=True, timeout=2700)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bootstrap", action="store_true")
    parser.add_argument("--api-check", action="store_true")
    parser.add_argument("--source", help="Local >=4.1-second video. Default: same licensed sample as LTX selftest")
    parser.add_argument("--ltx-result", help="Optional downloaded LTX baseline MP4; never a source substitute")
    parser.add_argument("--prompt", help="Descriptive shot prompt matching a custom source")
    parser.add_argument("--out", default="/kaggle/working/cinema-vace-experiment")
    args = parser.parse_args()
    # Compile own source before imports of diffusion code or any weight loading.
    py_compile.compile(__file__, doraise=True)
    if args.api_check:
        validate_apis(); return
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    # No accidental replacement of earlier evidence, even after a failed run.
    if any(out.glob("*.mp4")) or (out / "run.json").exists():
        raise RuntimeError("Output folder already holds experiment media. Keep it; use a new --out directory.")
    log = out / "experiment.log"
    class Tee:
        def __init__(self, original, file): self.original, self.file = original, file
        def write(self, value): self.original.write(value); self.file.write(value); self.file.flush()
        def flush(self): self.original.flush(); self.file.flush()
    original_stdout, original_stderr = sys.stdout, sys.stderr
    with log.open("a") as handle:
        sys.stdout, sys.stderr = Tee(sys.stdout, handle), Tee(sys.stderr, handle)
        try:
            (bootstrap if args.bootstrap else render)(args, out)
        except Exception as exc:
            failure = {"status": "failed", "type": type(exc).__name__, "message": str(exc),
                       "traceback": traceback.format_exc(), "gpuVerified": False,
                       "action": "Inspect error; do not retry unchanged. Existing LTX worker remains untouched."}
            (out / "failure.json").write_text(json.dumps(failure, indent=2))
            traceback.print_exc()
            say("FAILED. Preserve this log and any partial artifacts. No fallback or fake output.")
            raise
        finally:
            sys.stdout, sys.stderr = original_stdout, original_stderr


if __name__ == "__main__":
    main()
