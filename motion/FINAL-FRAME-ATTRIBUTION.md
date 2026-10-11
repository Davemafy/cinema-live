# CINEMA — The Final Frame: source and asset attribution

Production continues `motion/film-ribbon-ident` at `7177e12a5bc9184e3816400e66c51a703fff8048`, on the separate branch `motion/into-the-frame-final`. The application and inference pipeline are untouched.

## Applied harvest

The actual reference-code inspections, native example captures and licensing decisions remain in `REFERENCE-HARVEST-V2.md`, `REFERENCE-HARVEST-CREDITS-V3.md`, `REFERENCE-HARVEST-PREFERRED-OPENING-V4.md` and `licenses/`. This production applies those findings rather than replacing the engine or repeating link collection.

| Source | Applied technique | Responsible production source | License / reuse |
| --- | --- | --- | --- |
| Three.js CurveModifier / spline camera / morph examples | Authored focal targets and camera progression, tangent-derived ribbon normals, interpolation of flat and curled positions | `src/final/Opening.tsx`, `src/final/Sculpture.tsx`, `src/final/Film.tsx`, `src/final/ImageSheet.tsx` | Three.js MIT; new production geometry and choreography are original implementations. No source footage copied. |
| pmndrs/postprocessing and existing Three.js compositor | Controlled highlights, physical lighting, focus and low-strength bloom | Existing `src/Scene.tsx:Rig`, optional authored `Director` override | Harvested library Zlib; actual active Three.js passes MIT. Existing working compositor preserved. |
| Remotion ThreeCanvas | Frame-addressed R3F scenes; deterministic exports and composited exact brand asset | `src/final/Film.tsx`, `src/index.tsx` | Existing Remotion dependency and terms retained. Every pose derives from `useCurrentFrame()/24`; no wall-clock animation. |
| Codrops kinetic typography / film title research | Editorial scale, negative space, title framing and controlled reveal | Director and event cards in `src/final/Film.tsx` | Visual grammar only; no external title footage, logo or code copied. Refer to V3 for research links and code license. |
| Google Fonts: Cormorant Garamond | Original director and event typography | `public/fonts/CormorantGaramond-subset.ttf` | SIL Open Font License 1.1. Original copyright and full terms in `CormorantGaramond-OFL.txt`. Unicode subset only; family name unchanged. Source https://github.com/google/fonts/tree/main/ofl/cormorantgaramond |
| CINEMA repository | Authentic frozen wordmark, ivory lettering and amber square | Existing `public/cinema-original-wordmark.png`, `reconstruction/Edit.tsx:Logo` | Brand asset from this repository; unchanged source pixels, aspect ratio and colour. Never regenerated. |

## Temporary landscape provenance

`public/final-frame-plate.jpg` was created specifically for this production using the image-generation tool on 2026-10-11. It is original temporary artwork, not verified CINEMA-generated footage and not footage licensed from a stock library. The visible outro explicitly labels it **TEMPORARY CINEMATIC PLATE · ORIGINAL AI-GENERATED ARTWORK**. No external photograph or film is used to make this plate. Tool output use is permitted under the applicable OpenAI service terms; no third-party footage license is asserted.

Direction: lone figure on a basalt cliff above clouds, layered mountains, amber sunrise through a storm gap, cool foreground, realistic geology and photographic contrast. No text, interface, logos or ribbon were generated. Its 1920×1080 adaptation is texture-mapped once, UV 0–1, to the entire physical sheet. It never changes into an unrelated metallic asset or tiled image.

The recovered `cinema-cffccdaaf311f703d865c1d7.mp4` was 384×256, silent, 12 fps and 49 frames. Its download name is consistent with CINEMA's naming scheme, but no inference receipt or equivalent provenance was present. It was therefore inspected but not represented as verified product footage or used as the full-screen hero.

## Credits and relationships

“A FILM BY / DAVEMAFY IMAFIDON” is the requested director credit. “CREATED FOR / BANANA HACKS 2026” acknowledges the submission context. Three.js, React Three Fiber and Remotion are installed production technologies. No event sponsor is presented as a CINEMA sponsor. Event reference: https://www.bananahacks.tech/ (checked 2026-10-11).

## Sound

`final-sound.py` synthesizes the new directed opening score with seed 404 and the retained/refined outro score with seed 2026. `sound.py` still produces the legacy composition scores. No commercial samples or external music are used. `public/*.wav` files are regenerated from these scripts rather than committed binaries.

## Preferred opening and V4 application

The supplied `opening(1).mp4` is the comparison baseline. Its seven analytic film shapes originate in this repository's `src/geometry.ts:ribbon`, not a downloaded studio asset. `Sculpture.tsx:solidPreferredRibbon` samples these same pre-collapse forms, constructs front/back surfaces and perforation walls, and welds consistent normals with the Three.js MIT utility `BufferGeometryUtils.mergeVertices`. The group retains the original staging orientation.

Film4's camera journey, Radical's layered ribbon choreography, The Crown's glancing material light, Netflix's decisive payoff and Sarofsky's title hierarchy inform original shot direction only. Their footage, music, logos and proprietary code are not included or reproduced. V4 records their research context. The lens gate and its modest transmitted-edge light shader are original production code.

## Deadline demo contingency

The optional editorial outro uses original frame-driven optical-matte code instead of the simulated fold. Its temporary plate retains the provenance above. The supplied preferred opening is retained unchanged. The recommended three-second closer contains only the authentic logo and licensed director typography; it contains no temporary scenery. Existing original synthesized audio is trimmed and faded to that edit.
