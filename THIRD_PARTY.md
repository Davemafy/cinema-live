# Third-party licenses and attribution

The CINEMA application and orchestration code use the [MIT License](LICENSE). Upstream libraries, pretrained weights, codecs and sample footage are **not** relicensed by the application.

- **IC-Light** — pretrained reference-lighting model. [Source and license](https://github.com/lllyasviel/IC-Light). Its weight/checkpoint terms should be reviewed separately from code licensing.
- **Stable Diffusion 1.5 and realistic-vision-v51** — pretrained weights underlying the experimental IC-Light setup. Review the exact checkpoint/model cards and permitted uses before commercial deployment.
- **Torchvision person segmentation** — LRASPP-MobileNetV3; torchvision is BSD-3-Clause. [Source](https://github.com/pytorch/vision).
- **LTX** — Lightricks video-generation model, evaluated locally/on Kaggle and available through a fal model adapter. [LTX source](https://github.com/Lightricks/LTX-2).
- **Wan VACE** — experimental video-editing model evaluated during development; model checkpoints remain under their original terms.
- **FFmpeg / FFprobe** — media processing binaries. The FFmpeg static distribution includes libx264/GPL components; inspect [upstream licensing](https://ffmpeg.org/legal.html) and package-specific binary notices.
- **Next.js, React, TypeScript, OpenCV, FastAPI, NumPy** — upstream dependencies with their own licenses and notices.

**Licensed sample:** ARTSEDGE / The Kennedy Center, Charleston dance. [Source](https://commons.wikimedia.org/wiki/File:Charleston-dance.webm) and [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). CINEMA excerpts seconds 8–13, transcodes the footage and removes audio. It is labeled as source performance, not generated video; no endorsement is implied.

For the exact film/reference provenance and adaptations, see [submission/ATTRIBUTIONS.md](submission/ATTRIBUTIONS.md).
