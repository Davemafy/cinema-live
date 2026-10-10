# CINEMA motion idents

Isolated production workspace. Existing application files are untouched.

## Preview

```
cd motion
npm ci
python3 -m pip install -r requirements.txt
npm run preview -- --host 127.0.0.1
```

`out/browser-preview.html` is a self-contained version with the renderer and media embedded. Open it in a browser with WebGL enabled. The Remotion Player provides play, pause, audio, full screen and frame scrubbing.

## Export

```
python3 sound.py
npx remotion browser ensure
npx remotion render src/index.tsx Proof out/ribbon-proof.mp4 --gl=swangle --concurrency=2
npx remotion render src/index.tsx Opening out/opening.mp4 --gl=swangle --concurrency=3 --crf=17
npx remotion render src/index.tsx Ending out/ending.mp4 --gl=swangle --concurrency=3 --crf=17
npx remotion render src/index.tsx Combined out/combined-preview.mp4 --gl=swangle --concurrency=3 --crf=17
```

All compositions use 1920 × 1080 at 24 fps. Opening: 120 frames. Ending: 96 frames. Combined: 228 frames including a 12-frame black spacer. Restricted environments which cannot enumerate interfaces can prepend `NODE_OPTIONS=--require=./runtime-shim.cjs`.

`npm exec tsc` checks source. `npm exec vite build -- --base ./` builds the browser player; `python3 bundle-preview.py` embeds that build and its media into the standalone preview.

## Scene responsibilities

- `geometry.ts`: analytic twisting strip surface, UVs, normals, convergence.
- `material.ts`: physical metal/clearcoat material; custom perforation, emulsion, flex and roughness GLSL.
- `Scene.tsx`: frame clock, camera, reflection cards, lights, bloom, depth of field, fog and custom dust shader; exact logo compositor.
- `Fragments.tsx`: image-bearing strip transformation and logo silhouette fragments.
- `sound.py`: reproducible original stereo sound cues.
- `index.tsx`: Remotion compositions and deterministic sequence order.

There is no exported wall-clock simulation: geometry, uniforms, camera, lighting, fragments and compositing derive from the current frame. R3F's render callback invokes the compositor; it does not advance animation state. The browser uses the same composition with Remotion Player's clock instead of a second GSAP timeline.

## Logo and footage

The authoritative repository logo is CSS text: Arial/Helvetica/sans-serif, weight 800, tracking -0.05em, ivory #f0efea plus orange #efaa68 square, with an 8:30 gap/size ratio. The final compositor scales these values together without changing the letterforms. This differs from the thin custom lettering in the supplied storyboard. There was no original vector wordmark file in either main or kaggle-worker-demo. The final logo uses precise browser compositing, not generated lettering.

`generated-frame.jpg` is extracted at 1 second from the supplied CINEMA-session file `1000386215.mp4` (1280 × 720). That clip's generation provenance was not available in repository metadata. It is not the repo's explicitly labelled sample-input dance clip. Replace this asset with a confirmed generated frame if the submitted film needs independently documented provenance.

See `ATTRIBUTION.md` and `QUALITY-REPORT.md` for source/license history and the visual assessment.

For exactly bounded encoded audio and a 12-frame combined spacer, run `bash finalize-edit.sh` after rendering the individual MP4s. The delivered combined file was assembled from those inspected individual renders. Synthesized WAVs are generated from source and excluded from Git; they are included in the downloadable source kit.
