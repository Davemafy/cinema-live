# Realism proof V5 — review, not final approval

The supplied ElevenLabs intro is 2.925688 seconds, mono 44.1kHz. Preserve its pace. Start it at frame 42 (1.75s) in a five-second opening; its internal pause places the second phrase near the lens/identity transition. The supplied recording is used with user authorization; no voice provenance or commercial-license terms are independently asserted. The original audio file is preserved.

## Delivery recommendation

Use `cinema-preferred-opening-voiceover.mp4` for the immediate demo. Its preferred picture stream is copied without re-encoding: 1920x1080, 24fps, 120 frames. Sound bed at .30 gain, narration intact, stereo 48kHz AAC, limiter .95 with automatic gain disabled. This is a voiceover mix, not a claim of new visual finishing.

The new two-second ribbon proof and five-second voice draft are review renders at 960x540, 24fps. Their compositions remain 1920x1080 and can export natively. No upscaled file is presented as a full-resolution proof.

## Implemented

Preserved all seven sculptural ribbon forms; added opt-in physical treatment, thinner geometry, four perforations per photographic frame, broader photographic gate, derivative-filtered surface detail and no shader displacement that invalidates normals. Dielectric material with clearcoat replaces metallic rails. Added shadow casting directional light to supplement strip lighting. Fixed-lens macro/pullback/push path uses quintic easing with zero velocity/acceleration at endpoints. Narration is an exact-frame Remotion Sequence; existing logo, film-gate, score and rendering infrastructure retained. Previous treatment remains available.

## Actual visual review and correction

Inspected native-render contact sheets from preferred opening, first proof and first voice draft. The first proof had muddy brown reflections and insufficient photographic separation. Revised environment panel colours from saturated orange toward champagne, reduced photographic warm contamination and improved emulsion luminance/coat response. Re-rendered the two-second proof separately.

The layered silhouette survives, and camera compositions vary more strongly than the preferred continuous wide shot. This does not yet establish photorealism or superiority to the preferred opening. Remaining limits: repeated temporary mountain imagery, rectangular perforation corners, raster reflections rather than full interreflection, no genuine shutter accumulation, and synthetic film coating. The first five-second voice draft predates the second material correction and is explicitly an alternate, not the recommended final.

Headless browser playback of the preferred voiceover file reached the end with 120 presented/submitted frames, 9 compositor drops. This software playback environment does not prove display smoothness. Native full decode and metadata checks passed. No source-time or uncontrolled-clock animation was added.

## Source / reproduction

`npx remotion render src/index.tsx RealismProof out/proof.mp4 --gl=swangle --concurrency=2` renders native 1080p. Add `--scale=0.5` for the delivered review resolution. `RealismOpeningVoice` renders the five-second new-scene alternate with narration. Browser preview offers REALISM-PROOF and VOICE-OPENING. Use `npm run preview`.

Underlying physical material, renderer and curve references/licenses are documented in REFERENCE-HARVEST-REALISM-V5.md and existing attribution files. No new third-party code is copied into the production shader. Production application and inference are unchanged.
