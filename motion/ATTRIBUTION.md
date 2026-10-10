# Reference-code inspection and attribution

Reference checkouts were inspected as implementation sources, not just collected as links. No original demo textures, models or third-party audio were included in the delivered film.

| Source and inspected revision | Responsible implementation | Execution/capture | CINEMA adaptation / license |
| --- | --- | --- | --- |
| [remotion-dev/template-three](https://github.com/remotion-dev/template-three), aa9cd28f063959547bb5fa5fd83208538cb5831b | `src/Scene.tsx`, `src/Root.tsx`; ThreeCanvas inside a Remotion composition | CINEMA's adapted ThreeCanvas compositions rendered to PNG/MP4. Original device demo not run. | ThreeCanvas and composition architecture; no phone assets/code copied. Repository LICENSE.md is MIT, although package.json says UNLICENSED; notice retained. Remotion itself has separate commercial licensing terms. |
| [pmndrs/threejs-journey](https://github.com/pmndrs/threejs-journey), 922d6260d4e2ac1a2b0287099fbbe700de0e275f | `examples/extra/PostProcessing/src/Effects.jsx`, `customEffects/Displacement.jsx` | Adapted bloom/DOF pipeline rendered in CINEMA; old React 17/Next 12 playground not installed | Design-level study of threshold bloom and shader uniform control. No source or assets copied. No root license file found, so source was not redistributed. |
| [pmndrs/drei-vanilla](https://github.com/pmndrs/drei-vanilla), 28978f680f9071e4f4794611781c19f46de48e35 | `src/materials/MeshWobbleMaterial.ts`, `SpotLightMaterial.ts`, `MeshTransmissionMaterial.ts` | Adapted shader injection executed in CINEMA renders | `onBeforeCompile` uniform/deformation injection pattern adapted; CINEMA math and film masks are new. MIT notice included. Spotlight view/depth attenuation inspected; no spotlight source copied. |
| [Mamboleoo/InfiniteTubes](https://github.com/Mamboleoo/InfiniteTubes), a3b831b6c95bed4d803dfeed8b66ec76de333996 | `js/demo1.js` / `demo2.js`: CatmullRomCurve3, TubeGeometry, original-vertex deformation, camera update | Original brick tunnel executed in headless Chromium, screenshot captured (`reference-tunnel.png`) | Curve-following spatial composition and camera study. CINEMA uses a new analytic ribbon surface and frame-based camera; original frame-dependent smoothing and textures are not reused. Codrops resource license retained. |
| [ChipiKaf/smooth-image-transition](https://github.com/ChipiKaf/smooth-image-transition), 58070e2b7b5674c5a6cb0461d86bca94d1b4a302 | `src/shaders/fragment3.glsl`, `vertex.glsl`, `Experience.jsx` | Implementation inspected; original example not run | Studied UV displacement and mixed image sampling. CINEMA instead bends image-bearing geometry in 3D; no source/assets copied. README declares MIT; statement retained. |
| [Three.js](https://github.com/mrdoob/three.js), npm 0.178.0 | `examples/jsm/postprocessing/UnrealBloomPass.js`, `BokehPass.js`, `OutputPass.js`; `lights/RectAreaLightUniformsLib.js` | These actual modules execute in every CINEMA frame | Imported bloom, optical defocus, output color conversion and area-light support. MIT notice retained. |

## Original work

CINEMA analytic ribbons, procedural film perforations/emulsion, reflection-card layout, frame choreography, image-band transformation, logo fragment placement, dust GLSL, composition and synthesized stereo audio were written for this project.

## Assets and branding

The CINEMA wordmark specification comes directly from `src/components/Studio.tsx`, `src/app/globals.css`, and `src/app/tokens.css` at application commit ed6c7a762ee4d66a60332c2a0c5eb55e8c0f65b4. Brand rights stay with CINEMA's owner. The supplied cinematic frame's provenance is described in README; no additional rights assertion is made.
