# CINEMA realism research V5

Research only. Production rendering infrastructure and application are unchanged. The current film is not visually approved.

## Diagnosed implementation problems

- `src/material.ts`: default metalness .87; physical-hole variant uses .80 rails and .24 photographic center. Actual photographic film is layered polyester/emulsion, not a metal sculpture. Use dielectric film with controlled clearcoat and photographic texture; reserve stronger metallic response for intentional artistic accents.
- The vertex shader adds sinusoidal normal displacement (.012 amplitude) without corresponding normal correction. Remove unmotivated displacement or recompute coherent deformed normals. This displacement is large relative to .009 half-thickness.
- `solidPreferredRibbon`: total thickness .018 across widths .42/.58/.74 is 4.29/3.10/2.43% of width. Calibrate against an actual film stock rather than treating this as credible film thickness. No physical stock thickness was verified in this research.
- 72 perforations across 12 photographic frames gives six perforations per frame; choose a defined gauge. Kodak's conventional 35mm frame indexing uses four perforations. KS holes measure 2.794 x 1.981mm; the current UV proportions and repeated photograph need revision. Use arc-length UVs and curated photographic frames.
- `Scene.tsx`: PMREM panels and rectangle lights provide illumination, but the current scene lacks shadow casting. Three.js RectAreaLight does not support shadows. Add deliberate shadow separation with supported lights/contact treatment, or test path-traced export.
- `final/Opening.tsx`: changing position, target, focus and FOV through separately timed curves complicates perceived acceleration. Author a fixed-lens camera journey with continuous derivatives, arc-length timing and tracked focal subject. Preserve the layered multi-ribbon composition.

## Actual implementations inspected

### three-gpu-pathtracer
MIT, Garrett Johnson. Tested tag v0.0.23, commit eaaa1c06ff8c5fba03cc3d457ce276bf125a44ca. Its package declares Three >=0.151; latest main 0.0.27 requires a newer Three release and is not an appropriate drop-in for this production.

Relevant source: `example/primitives.js`, `example/renderVideo.js`, `src/core/WebGLPathTracer.js`, `src/core/PathTracingRenderer.js`, `src/uniforms/MaterialsTexture.js`.

The video example waits for a sample budget, records the canvas, then advances camera and mixer by 1/fps. The renderer exposes reset/updateCamera; stableNoise resets the sampling seed. This supports a frame-driven export design without replacing Remotion choreography or logo/audio compositing.

Run evidence: `research/realism-v5/` contains the adapted MIT primitive example, pinned dependencies, license, two captured canvases, and error/status JSON. Tested Three 0.178.0 with path tracer 0.0.23. Both variants completed without reported errors. Captures are 256x192 with a four-sample target; a queued callback resulted in status reporting five samples. These visibly noisy primitive images establish runtime compatibility only, not CINEMA photorealism. Higher-resolution software rendering caused capture timeouts.

Limitations: high sample cost, animation resets, software GPU throughput. The path tracer serializes supported physical material properties; it does not execute our custom onBeforeCompile shader. Bake photographic, roughness and normal maps and actual geometry first. Avoid competing render-loop owners. For each Remotion frame/subframe, reset stable sampling and wait for an exact sample budget before capture. Never rely on wall-clock convergence.

https://github.com/gkjohnson/three-gpu-pathtracer/tree/v0.0.23

### react-three-gpu-pathtracer
MIT. Inspected commit 6301a31d8bdd16b18d148cb234405f044c2d6e9f, `package/src/Pathtracer.tsx`. Uses existing R3F scene/camera/gl, sets the scene, resets camera sampling and renders at priority 1. Peers React >=18 / R3F >=8. Integration is feasible, but the wrapper is not an export synchronization system; adapt deterministic sampling instead of dropping it alongside the existing priority-1 composer. Not separately executed.

https://github.com/pmndrs/react-three-gpu-pathtracer

### Three.js physical materials, lights and curve implementation
Official docs plus installed r178 Curve source inspected. Clearcoat models a surface layer; transmission preserves reflection on thin dielectric surfaces. Environment lighting remains important. Curve.getPointAt/getTangentAt support arc-length sampling. RectAreaLight has no shadow support.

https://threejs.org/docs/pages/MeshPhysicalMaterial.html
https://threejs.org/docs/pages/RectAreaLight.html
https://threejs.org/docs/pages/Curve.html

### Remotion exposure sampling
Official CameraMotionBlur documentation inspected. Shutter samples model exposure; Trail repeats past positions and does not model realistic exposure. CameraMotionBlur carries color/compositing limitations. Prefer controlled linear-HDR subframe accumulation for the 3D scene; validate actual motion frames. Newer Remotion documentation must not be assumed to describe APIs available in pinned 4.0.406.

https://www.remotion.dev/docs/motion-blur/camera-motion-blur

### Physical and creative references
Kodak 2383 documents polyester base and photographic layers. Essential Reference Guide supplies standard 35mm perforation dimensions/frame conventions. Analog's Film4 production describes a full-CG environment and in-camera scrolling: a directed journey through film space, applicable to the opening's middle section. Study composition and camera craft, never reuse protected brand assets.

https://www.kodak.com/en/motion/product/post/print-films/vision-color-2383-3383/
https://www.kodak.com/content/products-brochures/Film/kodak-essential-reference-guide-for-filmmakers.pdf
https://analogstudio.co.uk/work/film-4-film-ident
https://mvsm.com/project/film4

## Recommended implementation order

1. Preserve the preferred interwoven sculpture. Correct film gauge, thickness, UVs, normals, photographic detail and dielectric response on one close-up.
2. Establish large restrained champagne/cool reflection shapes and shadow separation. Compare raster and optional path-traced export on identical geometry; do not upgrade production dependencies speculatively.
3. Author macro-to-structure-to-through-frame camera travel with fixed lens, continuous velocity/acceleration and explicit focus.
4. Integrate genuine camera-space occlusion and controlled shutter sampling. Keep exact logo asset and existing frame/audio infrastructure.
5. Render a two-second CINEMA proof and inspect native frames plus playback before another full pair. Compatibility tests are not the visual acceptance gate.

No claim of studio-quality output follows from this research. The viable rendering route is supported by actual source and a compatible runtime test; its final visual quality remains to be demonstrated on CINEMA geometry.
