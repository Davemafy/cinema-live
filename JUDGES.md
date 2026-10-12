# CINEMA — Judge's quick tour

**Turn a performance into a cinematic scene.**

[Open the working studio](https://madeincinema.vercel.app) · [View the finished example (B)](docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4) · [Inspect the AI experiment (C)](docs/evidence/subject-aware-v1/subject-aware.mp4)

CINEMA is a browser studio for recording or uploading an existing performance, exploring a new visual direction, comparing it with the original, and exporting an MP4. The performance—not a generated replacement—is the foundation of its source-preserving pipeline.

## If you have one minute

1. **See the result first.** [Open the original-versus-treated comparison](docs/evidence/preservation-v1/comparison.jpg) and [play the actual film](docs/evidence/subject-aware-v1/baseline-appearance-transfer.mp4).
2. **See the real AI work.** [Watch the A/B/C comparison](docs/evidence/subject-aware-v1/comparison-abc.mp4). A is the input. B is an offline image-AI-directed appearance-transfer film. C is the experimental subject-aware IC-Light result.
3. **Try the web studio.** [Open CINEMA](https://madeincinema.vercel.app), select **Use sample performance**, choose **Directed light**, then transform if the GPU worker is available. Compare and export the actual output.
4. **Review the proof.** [Technical report and artifacts](docs/subject-aware-cinematography.md) detail inference, segmentation, optical flow, source hashes, separate-video verification and limitations.

## What ran on a GPU?

The deployed Vercel studio was connected to a **temporary Kaggle GPU** running the FastAPI / IC-Light subject-aware processing worker. The built-in sample completed a real processing job through the deployed application. A different uploaded clip also completed the local source-conditioned pipeline, playback and MP4 export.

CINEMA uses a pretrained IC-Light model for a source-specific reference, a pretrained people-segmentation model, optical flow, and source-frame compositing. It does not claim to have trained those models. The current method preserves original frame geometry and movement, but has imperfect subject boundaries and approximate lighting.

## What if inference is unavailable?

**The hosted GPU is temporary.** A Kaggle or other GPU session might be offline by the time this page is opened. The app reports that rather than showing a prerecorded output as a response to a new upload.

You can still inspect the actual published films, the source footage, the application workflow and the technical evidence above. **B is an offline showcase, not a live C render.** Judge the working source-aware architecture and the unfinished visual-quality limitations separately.

## Architecture in one line

**Next.js capture/upload → FFmpeg normalization → authenticated FastAPI GPU job → IC-Light reference + moving-person masks + optical flow → source-preserving compositing → MP4 comparison/export.**

[Main README](README.md) · [Technical evidence](docs/subject-aware-cinematography.md) · [Media and model credits](submission/ATTRIBUTIONS.md) · [Source code](src/)
