# CINEMA — Credits/outro reference harvest V3

Research status: harvested and source-audited, **not implemented or rendered as V3**. Preserve the motion pipeline and the V2 reconstruction.

## Existing state inspected

- `src/reconstruction/Hero.tsx`: physical perforated 384-section hero, welded normals, `generated-frame.jpg` is still an unverified static image. Current `fract(filmUV.x)` repeats texture rather than preserving one full source image during flatten/fold.
- `src/reconstruction/LensRibbon.tsx`: physical near-lens occluder + perforation shader; reuse it.
- `src/reconstruction/Edit.tsx`: opening mask, canonical logo, image-shutter ending and placeholder label; no credit cards or synchronized moving-video texture yet.
- `src/index.tsx`: Opening 120 frames, Ending 96 frames, Combined 228 frames at 24fps; adjust composition duration if adding credits.
- `package.json`: Remotion 4.0.406, Three 0.178.0. Match any new Remotion package versions.

## New harvested references and implementation mechanics

1. [Remotion video in Three.js](https://www.remotiondocs.com/docs/videos/as-threejs-texture): preferred `@remotion/media <Video headless onVideoFrame>` -> `CanvasTexture`. The callback draws decoded frames, sets `needsUpdate` and calls `advance(performance.now())` during export, `invalidate()` during preview. Must test package compatibility and seek determinism. The older `useVideoTexture` API is deprecated.
2. [Three.js CurveModifier](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/modifiers/CurveModifier.js): `updateSplineTexture`, `computeFrenetFrames`, tangent/normal/binormal fields, vertex transform. MIT. Consider stable parallel-transport frames for ribbon animation; current geometry must be tested before replacement.
3. [Codrops kinetic typography](https://tympanus.net/codrops/2020/06/02/kinetic-typography-with-three-js/) / [MIT code](https://github.com/marioecg/codrops-kinetic-typo): render text to a `WebGLRenderTarget`, use as mesh texture or masking system. For CINEMA, preserve an unchanged original logo in 2D; use the technique optionally for credits.
4. [Split titles](https://www.artofthetitle.com/title/split/): typographic segmentation/grid and synchronized editorial rhythm; adapt motion grammar, not footage.
5. [The Fall titles](https://www.artofthetitle.com/title/the-fall/): typography belongs to shot composition and must be timed to editing. Adapt placement and readability.
6. [Remotion ThreeCanvas](https://www.remotiondocs.com/docs/three-canvas): render everything from `useCurrentFrame`, test nonsequential seeks; `useFrame` must not independently drive animation.
7. [Audio cues](https://www.remotiondocs.com/docs/audio/sfx): place and level cue assets in a controlled timeline; confirm audio rights.

The branch's `REFERENCE-HARVEST-V2.md` already documents executed path-flow, camera, postprocessing, windline and morph examples; **do not reharvest identical examples**. The V2 reconstruction is reported as improved but the exported V2 MP4 was not independently reviewed during this research pass.

## Proposed true transition (requires prototype)

Use the same UV-stable image sheet in flat and deformed states:

`P(u,v,p) = mix(Pflat(u,v), Curve(u) + (v-.5)*width*Normal(u), ease(p))`

Bind CINEMA output frames to this geometry via the Remotion media texture bridge. Avoid sudden asset swaps and repeating `fract(u)` during the visual continuity phase. Introduce photographic film perforations and metallic appearance later as a material transformation. The physical ribbon/gate must reach full-frame camera occlusion before revealing the logo/credits.

A full 16:9 image cannot map to a narrow film strip without distortion: first test a **broad photographic sheet folding into film bands**, preserving the original image visibly.

## Proposed 10-second outro (240 frames @24 fps)

| Frames | Shot |
|---|---|
| 0–35 | Verified CINEMA-generated output, full frame |
| 36–87 | Image-bearing sheet deforms into physical ribbon |
| 88–107 | Ribbon crosses lens, total occlusion |
| 108–139 | Original exact CINEMA logo hold |
| 140–184 | CREATED & DIRECTED BY / DAVID IMAFIDON |
| 185–225 | BUILT WITH (verified actual stack) / BUILT FOR BANANA HACKS 2026 |
| 226–239 | Fade to black |

Sponsor caution: [Banana Hacks sponsors](https://www.bananahacks.tech/sponsors) lists CodeCrafters, Interview Cake, Rosebud AI, XYZ and Kariaa as **event partners**, not sponsors of CINEMA. If shown, label event sponsorship accurately and avoid implying endorsement. The [hackathon criteria](https://www.bananahacks.tech/prizes) give presentation one of five equal scores and request a demo <=3 minutes; do not crowd out actual AI-function evidence.

Current branch README says real generation/inference remains unverified, and V2 explicitly labels its input image as placeholder. Do not remove that label without a traceable genuine CINEMA output.

## Next isolated experiment and QA

Do not build another ident first. Build **a 3-second moving-video-to-ribbon proof** in a separate composition. Validate source video frame continuity at arbitrary forward/backward seeks, color space, stable normals, no image repetition, complete occlusion, brand fidelity, 1080p rendering, and frame-timed audio. Inspect the MP4 and contact sheet before extending Ending/Combined. If this fails, keep the existing V2 intro and focus on real generation/demo.

## Licensing and evidence

Three.js MIT; Codrops sample repository MIT; pmndrs/postprocessing Zlib. zz85/threejs-path-flow has no explicit license per the prior V2 audit: study only, do not copy. Film-title videos are visual research only, not distributable production assets. This file contains source research and a proposed design; no new executable reference demos or output films are claimed.
