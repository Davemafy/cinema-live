# CINEMA — Banana Hacks 2026 submission draft

**Publication status: NOT SUBMITTED.** The public app's complete live AI-render workflow has not been verified. The branch includes a real, independently inspectable offline appearance-transfer film. Do not imply that the example was generated live from a visitor's upload.

## Tagline

A performance-first workspace for exploring cinematic treatments from a recorded take.

## Inspiration

Ordinary filmmakers and student creators often have one usable performance but not the time, actors, locations or equipment to reshoot it under multiple lighting setups. Prompt-to-video products can make beautiful unrelated scenes, yet may change the performer, gestures and staging. CINEMA begins with the actual take.

## What it does

CINEMA provides a web workspace to record or upload a short performance, normalize it for editing, retain the original take locally, and inspect comparison and export workflows. An asynchronous video-conditioned inference adapter exists, but reliable production GPU availability and end-to-end judge-facing generation are **not** verified.

We also built and **actually rendered** a source-preserving AI-directed cinematic finishing experiment. Image AI establishes a strong amber/cool appearance reference from a real performance frame. Rather than inserting generated faces or recreating all frames, CINEMA extracts a bounded low-frequency illumination/color treatment, follows motion using confidence-checked optical flow, and applies the treatment to original source pixels. The five-second MP4 visibly changes the look while retaining the original frames and movement. This is AI-derived appearance transfer—not physically accurate relighting or arbitrary scene replacement.

## How we built it

The studio uses Next.js, React, TypeScript, MediaRecorder and IndexedDB. FFprobe/FFmpeg validate and normalize clips, preserving composition and supporting original and processed media playback. Job capabilities, async status handling and model adapters separate UI from compute.

The validated experimental pipeline uses a real AI-generated image as the director frame; Python, NumPy and OpenCV calculate bounded RGB changes in linear light, estimate dense motion flow, evaluate forward/backward confidence and composite onto the unmodified source frame geometry. FFmpeg encodes the original-frame-based video, retaining input timing and audio when present.

In parallel, real Kaggle experiments executed LTX 2B and Wan2.1 VACE 1.3B video conditioning on Tesla T4 hardware. LTX completed a four-second render in approximately 45 seconds; Wan completed 49 frames at 448×256 in approximately 224 seconds of inference. Their visual edits were not strong enough to replace the preservation-first result. CINEMA did not train either foundation model.

## Engineering challenges

A successful inference response is not the same as a convincing film. Full-frame regeneration often smoothed or degraded dancers, while conditioning on the original appearance resisted dramatic change. We separated cinematic look generation from footage preservation. Other challenges included constrained T4 memory, temporary model caches, Python/CUDA version mismatches, precomputed embedding device placement, video normalization, browser media permissions and reliable asynchronous job status.

## Accomplishments — measured, not simulated

- A genuine, licensed Charleston performance was used as input.
- A real AI-generated image establishes the cinematic reference, with image-generation provenance recorded.
- The source-preserving pipeline rendered **120 frames at 854×480, 24000/1001 fps, approximately 5.005 seconds**.
- The measured second CPU render took **20.808 seconds**, **excluding** image-generation time.
- Original frames, action and detail underlie the final video; no faces or movements are regenerated in this finishing path.
- A real 56-second offline evidence film, comparison sheet, model/source credits and exact hashes are committed to GitHub.
- TypeScript, app security/video tests, browser-playback checks and preservation-specific Python tests cover separate aspects of correctness; passing tests do not prove aesthetic quality.

**Evidence:** [5-second treated film](https://github.com/Davemafy/cinema-live/blob/experiment/preservation-aware-treatment/docs/evidence/preservation-v1/treated-source.mp4), [56-second evidence walkthrough](https://github.com/Davemafy/cinema-live/blob/experiment/preservation-aware-treatment/docs/evidence/preservation-v1/cinema-evidence-demo.mp4), [method, images and provenance](https://github.com/Davemafy/cinema-live/tree/experiment/preservation-aware-treatment/docs/evidence/preservation-v1).

## Lessons learned

A video transformer can render every frame successfully and still make the actual footage less useful. Creators need intentional transformation **and** preservation of their performance. Treating the AI image as a directorial reference, rather than copying its altered faces, is a more reliable first step.

## Limitations and next steps

The verified preservation film is an **offline experiment**, not a live visitor-generated result. Image AI is not yet connected to an always-on production endpoint. The appearance-transfer treatment is two-dimensional: it does not create new scene geometry, realistic moving shadows, weather or full physical relighting. The example has no audio; AAC preservation was tested separately. The public deployment may have unavailable temporary Kaggle compute. Videos from the experimental Wan and LTX models exhibited imperfect visual fidelity.

Next: integrate user-controlled reference generation and source-preserving processing into a reliable live compute service, expand cinematography controls and preserve quality at export.

## Built with

Next.js · React · TypeScript · MediaRecorder · IndexedDB · Python · NumPy · OpenCV optical flow · FFmpeg · FFprobe · image AI reference generation · LTX 2B and Wan VACE research · Kaggle T4 · Vercel.

**Attribution:** ARTSEDGE / The Kennedy Center, *Charleston-dance.webm*, CC BY 3.0. AI reference from OpenAI image-generation tool (specific model identifier not exposed), with exact provenance in repository. LTX by Lightricks; Wan VACE by its authors. See [CREDITS.md](https://github.com/Davemafy/cinema-live/blob/experiment/preservation-aware-treatment/docs/evidence/preservation-v1/CREDITS.md).

## Submission checklist (owner must complete)

- Confirm official eligibility and team/member details.
- Publish a public YouTube video **3 minutes or less**; committed 56-second evidence draft is not a public YouTube URL.
- Attach project URL, public GitHub URL, and screenshots showing real evidence.
- Verify the actual Vercel deployment and describe unimplemented live inference accurately.
- Complete and submit the Devpost form before the deadline. This file is only a draft.
