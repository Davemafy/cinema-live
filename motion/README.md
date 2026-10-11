# CINEMA motion reconstruction

Isolated workspace on `motion/film-ribbon-ident`. The application is untouched.
The existing Three/R3F/Remotion rendering pipeline remains in use. The ending
is a clearly labeled, unapproved footage placeholder.

## Preview

```bash
cd motion
npm ci
python3 -m pip install -r requirements.txt
npm run preview -- --host 127.0.0.1
```

The Player offers A (physical ribbon), B (macro-to-wide), C (lens crossing),
Opening and Ending. Each frame evaluates the same source used for export.
For a self-contained offline preview:

```bash
npm run build
mkdir -p out/reconstruction
python3 bundle-preview.py
```

Open `out/reconstruction/browser-preview-v2.html` with WebGL enabled. Embedded
media avoids file:// texture restrictions. `sound.py` regenerates the audio.

## Export

```bash
python3 sound.py
npx remotion browser ensure
mkdir -p out/reconstruction
npx remotion render src/index.tsx ExperimentA out/reconstruction/experiment-A.mp4 --gl=swangle --concurrency=2 --crf=17
npx remotion render src/index.tsx ExperimentB out/reconstruction/experiment-B.mp4 --gl=swangle --concurrency=2 --crf=17
npx remotion render src/index.tsx ExperimentC out/reconstruction/experiment-C.mp4 --gl=swangle --concurrency=2 --crf=17
npx remotion render src/index.tsx Opening out/reconstruction/opening-v2.mp4 --gl=swangle --concurrency=2 --crf=17
# Inspect opening before exporting ending.
npx remotion render src/index.tsx Ending out/reconstruction/ending-placeholder-v2.mp4 --gl=swangle --concurrency=2 --crf=17
bash finalize-reconstruction.sh
python3 contact-sheets.py
npm run typecheck
node verify-reconstruction.cjs
node verify-reconstruction-videos.cjs
```

All videos: 1920×1080, 24 fps. Experiments: 48 frames each; opening: 120;
ending: 96; combined: 228 including a 12-frame black spacer. Finalization pins
container/audio duration to 5/4/9.5 seconds. Restricted environments can prepend
`NODE_OPTIONS=--require=./runtime-shim.cjs` to Remotion/Vite commands.
QA uses runtime Playwright via `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; adapt to
local Playwright outside this environment. FFmpeg and Pillow make contact sheets.

## Implementation

- `src/reconstruction/Hero.tsx`: solid film, real perforation walls, arc-length
  curvature, photographic emulsion, physical material and custom GLSL.
- `src/Scene.tsx:Rig`: preserved environment/postprocessing, authored camera and
  focus. Legacy scene remains in this file for comparison.
- `src/reconstruction/LensRibbon.tsx`: physical camera-space occluder aligned
  with the precise compositor's reveal parameter.
- `src/reconstruction/Edit.tsx`: editorial timing, logo mask and distinct image
  shutter ending with a clear placeholder label.
- `public/cinema-original-wordmark.png`: original repository DOM logo frozen
  by `capture-logo.cjs`; no generated lettering.
- `sound.py`: deterministic stereo whoosh, identity and blackout cues.

Animation uses current frame/fps. No accumulated delta or uncontrolled clocks.
`useFrame` only submits the existing composer. Geometry/materials are memoized.

Read [REFERENCE-HARVEST-V2.md](REFERENCE-HARVEST-V2.md) for inspected functions,
executed evidence, licenses and performance limits. [QUALITY-REPORT-V2.md](QUALITY-REPORT-V2.md)
records visual review. Earlier attribution and quality files describe the first edit.

`capture-references.cjs` expects adjacent `../../references/` checkouts named
`path-flow`, `three-source`, `postprocessing` and `windline`. Install Windline's
dependencies, plus compatible Three .178 / postprocessing 6.38 into
`references/post-harness`. Native examples and a targeted postprocessing harness
run in isolated local servers. Unlicensed model assets and WebGPU dependencies
never enter CINEMA production.

Replace `public/generated-frame.jpg` with a verified CINEMA result before
removing the ending label or approving the ending. The original repository logo
is heavier than the storyboard lettering; exact repository identity is preserved.
