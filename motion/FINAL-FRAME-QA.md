# CINEMA — The Final Frame: final visual QA

## Delivered edit

| File | Edit | Frames | Container duration |
| --- | --- | --- | --- |
| `cinema-opening-final.mp4` | Darkness → photographic ribbon macro → authored pullback → lens-crossing identity reveal → blackout | 120 | 5.000 s |
| `cinema-outro-final.mp4` | Landscape → continuous photographic fold → camera enters image → authentic identity → director credit → event and technology card → blackout | 240 | 10.000 s |
| `cinema-combined-final.mp4` | Opening, 12 black frames, outro | 372 | 15.500 s |

All three are 1920×1080, 24 fps H.264/yuv420p MP4, with 48 kHz stereo AAC. Exact-duration WAV sound was remuxed/assembled to remove Remotion's container padding. Native browser decoders report approximately 5–13 ms of AAC padding; the video frame counts and MP4 container durations are exact.

## Actual review and corrections

Source, V2 combined footage, prior experiments and both reference-harvest documents were inspected. A 960×540 opening proof and a 107-frame folding proof were rendered, viewed as frame contact sheets and scrubbed in the browser. Full 1080p exports were then reviewed rather than treating compilation as visual approval.

1. **Flat ending replaced.** V2 used a city still and a two-dimensional shutter. The new image is one UV 0–1 photograph mapped continuously to a 180×28-segment sheet with front/back surfaces and thickness. Its silhouette, horizon and figure remain recognizable during deformation. Perforated physical rails grow along its two boundaries.
2. **Material improved.** The opening proof looked too bronze. A final-only photographic shader mode retains the plate's colour, reduces centre metalness from .28 to .07 and edge metalness from .74 to .38, and makes individual photographic frames visible. The original modes remain available.
3. **Discovery improved.** The initial black overlay now releases early; actual narrow strip lighting and low environment illumination control the discovery. The camera uses an authored Catmull-Rom macro-to-wide path with eased acceleration and a shifting focal target; there is no continuous orbit.
4. **Geometry defect corrected.** Full-resolution review exposed vertical streaks during the fold: the top rail's exact v=1 boundary was classified as the bottom edge. Edge selection now derives from the vertex layer, not a UV inequality. Frames 36–105 were re-rendered and inspected; the defect is absent in the final image at frame 48 and final contact sheet.
5. **Typography corrected.** The first browser review exposed an unreliable text-gradient clipping effect. It was replaced with reliably rendered ivory editorial type, an amber pretitle, restrained optical movement and framing rules. The director's exact requested name is prominent in two lines, not a small utility credit. The actual licensed font loaded successfully.
6. **Blackout corrected.** The original opening fade ended after its last sampled frame. Frames 116–119 were re-rendered with a frame-reachable fade endpoint. All final files now end on a measured RGB-zero frame.

The revised shot ranges were joined at exact frame boundaries to retain already successful shots. `finalize-exports.py` records this delivery assembly. Rendering the full `FinalOpening`, `FinalOutro` and `FinalCombined` compositions reproduces the final choreography without needing the revision fragments.

## Quality gates

- **Composition:** opening uses dominant macro detail and spatial pullback; outro begins with an uninterrupted landscape and turns into a single image surface. Director credit is a deliberate asymmetric editorial composition; acknowledgment card is centred and quieter.
- **Lighting:** amber photographic highlights with cool edge separation; reduced environmental light at discovery, and low bloom (.055–.07). No generic particles or effects clutter.
- **Image continuity:** no unrelated object swap and no UV tiling in the image-to-sheet transition. The same image survives the fold and lens approach. The opening intentionally repeats individual film frames, which is a different visual structure.
- **Occlusion:** rendered frames 100, 103 and 105 were inspected. At frame 103, the photographic surface fills the entire view, ahead of the 4.4 s identity passage. Camera anchor and normal come from the sheet itself. Identity is revealed after the lens is filled; it does not fade over a disappearing wide object.
- **Logo:** unchanged `cinema-original-wordmark.png`, git blob `5f58a43416e2320de29d9f2b9085c01946214b05`. The shared original compositor preserves its aspect ratio, ivory/amber colour and letterforms. No AI wordmark or substituted storyboard lettering.
- **Timing and sound:** all pictures derive from the Remotion frame, including shader time, camera, morph, masks and typography. Original deterministic stereo synthesis gives the lens/identity and credit passages separate cues, then decays into silence. Peaks approximately −9.00 dBFS opening and −11.60 dBFS outro; no clipping.
- **Playback:** native MP4 playback decoded all 120, 240 and 372 video frames with **zero dropped frames**. Independent FFmpeg full-decode checks passed. Frame dimensions, fps, frame counts, durations and stereo tracks passed machine checks.
- **Browser:** final portable preview loads without page errors; credit font loaded. Seeking to frame 80, away, and back produced byte-identical canvas screenshots. This verifies the rendered state at that tested frame, not a guarantee of cross-GPU bit identity.
- **Isolation:** all committed changes are under `motion/`. Application, generation and inference functionality are unchanged; production branch and main remain untouched.

Evidence: `before-after-opening.jpg`, `before-after-outro.jpg`, final contact sheets, `media-qa.json`, `browser-qa.json`, `playback-qa.json`, folding proof and opening proof.

## Comparison with the approved visual direction

The film shares the reference's dark photographic material, gold/cool specular lighting, macro scale, curved ribbon depth, lens transition and confident identity hold. The ending now has the requested image-to-film narrative and dedicated director/event typography, which V2 lacked. The actual CINEMA repository wordmark is bolder than the thin lettering pictured in the storyboard; exact brand fidelity takes precedence over inventing a replacement.

## Remaining limitations and honest status

- The opening retains the successful existing coiled hero geometry; it is a refined material/camera treatment, not a completely new fragmented sculpture.
- Materials use the existing real-time raster/PMREM compositor, not path-traced transmission, caustics or motion-blur simulation. Highlights and thickness are convincing at the reviewed frames but do not duplicate the reference's offline-rendered optical complexity.
- The landscape is an **original, explicitly labeled temporary AI-generated plate**. It is not verified CINEMA inference output or live-action motion footage. The available 384×256 recovered clip lacked sufficient provenance and resolution. The film is delivered, but the hero plate remains provisional for submission; replacing it requires no engine rebuild.
- The outro's fold is an authored geometric interpolation, not a cloth simulation. Sound is original synthesized design rather than an orchestra or commercially mastered soundtrack.
- No claim of award calibre or studio-quality parity is made. The before/after evidence supports a visible improvement, especially the continuous ending and film-credit treatment; these exports remain open to creative judgment.
