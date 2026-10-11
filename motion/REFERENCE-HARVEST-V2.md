# CINEMA reference harvest — reconstruction

## Existing production diagnosis

The original branch commit was `8fb6f0539d22bb1d161ff6518df19661a8755ce6`.
The actual combined MP4 was inspected, not only its code. The old seven-strip
composition had no dominant subject, thin double-sided surfaces, repetitive
illumination and little change in scale. Dust and bloom softened the image.
The wordmark appeared after the strips and box fragments faded away. The ending
reused the same ribbon motion with an image-fragment overlay.

Responsible code: `src/geometry.ts:ribbon`, `src/material.ts:filmMaterial`,
`src/Scene.tsx:Rig/Ribbons/Dust/Ident`, `src/Fragments.tsx:ImageFragments/LogoFragments`.
The existing ThreeCanvas → RenderPass → BokehPass → UnrealBloomPass → OutputPass,
Remotion compositions, browser Player, audio generator and export infrastructure
remain in use. Old source remains available for comparison.

## Executed references

`capture-references.cjs` runs native examples plus a targeted postprocessing
harness. Captures are supplied in the reference evidence archive. All five final
runs had no page errors. The first overloaded Windline capture timed out; the
second isolated run succeeded. Its on-screen performance was approximately 1 fps
on software WebGL, so it is not a suitable production dependency here.

| Reference / inspected revision | Implementation inspected | Rendered evidence | CINEMA decision / export limits |
|---|---|---|---|
| [zz85/threejs-path-flow](https://github.com/zz85/threejs-path-flow), `fd6bc5f4f9041b3f51637ca590c4c33514fa18b7` | `flow.js:initTexture/modifyShader`; texture rows contain position, tangent, normal, binormal; the basis transforms normals as well as vertices. `flow.html` drives interactive path movement. | `references/path-flow.png`: original orca deforming along its editable curve. | Study only: no explicit project license was found. No project code, model or texture redistributed. CINEMA independently uses licensed Three.js arc-length sampling and solid mesh construction. Old Geometry APIs and incremental offsets cannot be pasted into deterministic exports. |
| [Three.js spline camera](https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_extrude_splines.html), `11738a9d55e502fb484cefffcea3a66dc44e9fe9` | `render`: `getPointAt`, tangent/binormal interpolation, distance-based look-ahead, `matrix.lookAt`. Also inspected `examples/jsm/modifiers/CurveModifier.js`. | `references/spline-camera.png`: native animationView enabled. Native source served against installed Three 0.178 compatible addon modules. | MIT. Adapted arc-length geometry sampling and controlled camera targeting, not its Date.now loop or repeated tunnel orbit. The CINEMA camera uses explicit frame-derived ease and authored focus targets. |
| [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), `9cf03cff26615636a564d8bfddf765edb8917441` | `demo/src/demos/DepthOfFieldDemo.js`, `src/effects/DepthOfFieldEffect.js`, `src/materials/CircleOfConfusionMaterial.js`, CoC GLSL, `BloomEffect.js` and bloom GLSL. World distance determines focus; bloom uses luminance filtering and mipmap blur. | `references/postprocessing.png`: executable DOF/BloomEffect harness using compatible npm 6.38.0 and Three 0.178. This is a targeted harness, not the asset-heavy Sponza demo. | Zlib; notice retained. No source copied. Kept the existing compositor, reduced bloom strength to .12, and tied focus distance to the shot. Extra full-screen passes are costly in software export; do not stack generic glow effects. The inspected checkout is newer than the compatible test package. |
| [pajama-studio/three-windline](https://github.com/pajama-studio/three-windline), redirect to rand-monster; `83b1a4139ac9ed5da785768db3fc7dac6110d0a3` | `src/geometry.ts:createWindLineGeometry`, `src/material.ts` TSL shader construction, `src/system.ts:update`, and `demo/src/main.ts` backend selection. | `references/windline.png`: native Breeze scene, WebGL2 fallback, visible curves and diagnostic panel. | MIT + NOTICE retained; study only, no code copied. Adopted stable frame-parameterized deformation rather than accumulated motion. Windline is a thin stylized trail, not photographic film. Its Three >=.185.1 requirement conflicts with production .178; WebGPU/TSL dependency and visibility smoothing are deliberately excluded. |
| [Three.js morph targets](https://github.com/mrdoob/three.js/blob/master/examples/webgl_morphtargets.html), same Three revision | `createGeometry` position target arrays and GUI updates to `mesh.morphTargetInfluences`. | `references/morph-targets.png`: native cube-to-sphere target adjusted to .65. | MIT. Evaluated but not selected for the exact logo. A moving physical occluder connects motion to identity without distorting letterforms. Morphs need consistent topology and matching normal targets; CPU/GPU normals must be verified after deformation. |
| [Remotion ThreeCanvas](https://www.remotion.dev/docs/three-canvas) | Installed `@remotion/three/dist/esm/index.mjs`: `FiberFrameInvalidator`, `ThreeCanvas`, suspense delay handling. Installed version 4.0.406 uses demand rendering for export and invalidates on frame changes. | Browser scrub/revisit captures and exported MP4s in the quality evidence. | Existing wrapper retained. Every camera, deformation uniform, light and mask uses `useCurrentFrame()/fps`. `useFrame` only submits composer rendering. No clock delta, random unseeded animation or accumulated offsets drive export. Documentation describes current versions; installed behavior was checked separately. |

License texts are in `licenses/three-reference-MIT.txt`, `postprocessing-Zlib.txt`,
`windline-MIT.txt` and `windline-NOTICE.md`. Original CINEMA code was written for
the solid perforated mesh, physical material shader, camera-space gate and edit.
Three's `mergeVertices`, CatmullRomCurve3 and the pre-existing Three passes are
used as licensed library APIs. Reference screenshots are research evidence,
not CINEMA production assets. No unlicensed path-flow assets enter CINEMA.

## Selected experiments

| Experiment | Render / evaluation | Selection |
|---|---|---|
| A — physical ribbon, 48 frames | One continuous 384-section strip, actual .036-unit thickness, front/back and perforation walls, photographic emulsion, warm key and cool rim. Initial flat normals caused visible facets; welded normals and restrained texture grain fixed them before final export. | Solid construction, material and lighting selected. Lower contrast protects the highlights and photography. |
| B — cinematic camera, 48 frames | Begins inside the front loop; translates backward and sideways into a composed wide shot. Fixed focal subject, depth change, eased acceleration and settling; no continuous rotation. | Camera selected and stretched over the opening's reveal/build interval. |
| C — identity reveal, 48 frames | A physical camera-space film gate crosses the lens. Its trailing-edge parameter clips the black backing and precise logo compositor. Perforations remain visible during occlusion. | Selected. Geometry remains present behind the occluder; the logo is uncovered instead of fading over disappearing fragments. |

Contact sheets use six evenly spaced frames per experiment. Decisions were based
on the rendered images. The opening was rendered and inspected before the ending
was exported. The opening is a reconstruction preview, not a claim of external
creative approval.

## Identity and footage provenance

The repository contains no standalone vector wordmark. Its authoritative logo is
the DOM wordmark in `src/components/Studio.tsx` and styling in `src/app/globals.css`:
Arial/Helvetica/sans-serif, weight 800, tracking -.05em, ivory #f0efea and accent
#efaa68, baseline square. `capture-logo.cjs` freezes those exact values at 5× scale
into `public/cinema-original-wordmark.png`, preserving raster letterforms rather
than relying on another machine's fonts. The final compositor displays it at
684.265625 × 174 px. No generated logo or guessed storyboard lettering is used.

The available city image was extracted from supplied video `1000386215.mp4`.
Its generation provenance cannot be verified. It is photographic detail in the
ribbon test and explicitly labeled PLACEHOLDER FOOTAGE in the ending. The ending
therefore remains UNAPPROVED until a verified CINEMA output replaces it. The
project's dance demo is documented as input footage and was not misrepresented
as a CINEMA result.
