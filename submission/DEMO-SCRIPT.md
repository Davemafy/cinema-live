# CINEMA — final demo structure (maximum 3 minutes)

**Evidence rule:** Label the 56-second proof as an **offline AI-image-directed appearance-transfer experiment**. Do not claim it is an end-to-end live generation from the website. The website's live GPU availability must be demonstrated or honestly stated as unavailable.

## Recommended short demonstration — 90–120 seconds

0:00–0:12 — **Hook.** Show the actual original vs treated performance immediately. Say: "What if filmmakers could explore a new cinematic look without losing their original performance?"

0:12–0:30 — **Performance in CINEMA.** Show the existing studio, "Use sample performance" or video upload, actual source playback and treatment selection. State that browser capture and normalization are implemented.

0:30–0:55 — **The AI-directed look.** Show the genuine AI-created image reference beside the original keyframe. Explain that the image model proposed amber/cool illumination but altered faces, so its generated pixels were **not** copied into the final video.

0:55–1:25 — **Technical proof.** Reveal the original 854×480 5-second MP4 and the source-preserving film side by side. Say: "We derive an illumination/color field and propagate it with optical flow, compositing onto original frames. Every movement remains the source movement." Show brief architecture: Image AI → reference field → optical flow → original frames → export.

1:25–1:40 — **Honest status.** LTX and Wan VACE GPU experiments ran, but their transformations degraded quality; live user-controlled image reference generation and dependable public inference are not complete. Show no mock results.

1:40–2:00 — **The roadmap and credits.** Preserve CINEMA's broader cinematic-treatment identity; acknowledge licensed source and model authors; show GitHub and before/after evidence.

## Existing evidence assets

- `docs/evidence/preservation-v1/cinema-evidence-demo.mp4` — 56-second real evidence, not a live user run.
- `docs/evidence/preservation-v1/treated-source.mp4` — verified 5.005-second output.
- `docs/evidence/preservation-v1/comparison.jpg` — static beginning/middle/end comparison.
- `docs/evidence/preservation-v1/ai-reference.png` — AI keyframe only, not generated video.
- `docs/evidence/preservation-v1/CREDITS.md` — required license/model disclosure.

**Before the cutoff:** Export and upload a <=3-minute final demo to **public YouTube**, put its public URL into Devpost, and submit. GitHub-hosted videos alone do not fulfill that requirement.
