# CINEMA reconstruction — rendered review

## Result

The opening is materially different from the first edit: a single solid film
subject, a close view that opens into depth, restrained gold/cool reflections,
and an actual lens-crossing film gate connecting the shot to the original logo.
The existing rendering/export infrastructure was preserved. The ending is a
distinct image shutter/light composition, explicitly labeled **PLACEHOLDER
FOOTAGE · ENDING UNAPPROVED**. It is not a verified CINEMA-generated result.

## Before / after

| Aspect | First combined preview | Reconstruction |
|---|---|---|
| Composition | Seven competing thin strips, similar framing through the shot | One dominant continuous hero ribbon; macro-to-wide scale change |
| Geometry | Double-sided surfaces; perforations discarded in shader | Front/back surfaces, .036-unit thickness, real hole walls and welded normals |
| Material / light | Broad illumination, repeated reflections and airborne dust | Photographic emulsion, warm grazing key, cool rim, quieter bloom; no particles |
| Camera | Small sinusoidal drift and shallow push/pull | Authored translation through near foreground into a settled wide composition |
| Reveal | Strips and box fragments faded, then a wordmark appeared | Physical near-lens occluder and compositor share a trailing-edge parameter |
| Ending | Reused opening ribbon structure with image fragments | Image window closes through a light seam, uncovering identity underneath |
| Brand | Live font compositor could vary between machines | Frozen canonical repository wordmark, unchanged geometry and colours |

`before-after.jpg` compares actual frames at 1, 2.5 and 4.5 seconds. Experiment
contact sheets show six frames per independent two-second render. A/B/C were
reviewed first. The opening was then rendered, its dense reveal frames inspected,
and its playback checked before the ending was exported. This is an internal
visual quality gate; it does not imply the user's creative approval.

## Visual findings and corrections

- Initial experiment A showed obvious faceting. Shared/welded vertex normals
  replaced independent face normals before final experiment export.
- The first emulsion shader created fine moiré. Reduced spatial frequency and
  contrast, and removed repeated high-frequency scratch lines.
- A/B/C selected respectively the physical film, directed camera and connected
  occluder. Continuous spin, particles and logo-shard fade were removed from
  the active edit. Bloom strength reduced from .26 to .12.
- The ribbon remains present behind the passing film gate; it does not abruptly
  disappear to reveal disconnected lettering. Final logo is a precise image
  compositor, not deformed geometry or generated text.
- Ending's logo is already behind the image shutter. Closing image coverage
  naturally uncovers it; no separate wordmark fade is needed.

## Storyboard comparison

Opening timing: black start → illuminated tactile material during 0–1.15s →
macro-to-wide depth/camera build 1–3.4s → full-frame lens crossing 3.25–4.1s →
precise identity hold → black transition over 4.82–4.98s. The approved visual
reference informed the warm grazing light, dark void, photographic film and
macro scale. The reconstruction uses fewer fragments and a simpler authored
loop; it is not an exact reconstruction of every storyboard panel.

Ending: image hold → closing photographic window from .6–2.2s → identity exposed
by the same framing motion → deliberate black ending from 3.48–3.92s. This uses
framing/light rather than copying the opening's spatial camera narrative.

## Technical and playback review

All delivered streams are H.264, 1920×1080, 24/1 fps. Experiments are 48 frames
and exactly 2s, silent. Opening is 120 frames / 5s; ending 96 / 4s; combined 228 /
9.5s including a 12-frame black spacer. Finalization removes silent experiment
audio and bounds main AAC/container durations to the edit. Browser playback
decoded every video frame with zero dropped frames. AAC browser duration may
include roughly 10–15 ms of decoder padding; video frames and container timing
remain exact, and padding falls after the fade to black.

`sound.py` uses a fixed seed and 48 kHz stereo. Opening identity cue begins at
3.98s, ending shutter cue at 2.2s, and closing blackout cue at 3.5s. The same
WAVs are embedded in browser preview and muxed into the final edit. Peaks are
below clipping. Sound placement and exported track presence were checked;
headless playback cannot substitute for final listening on a calibrated system.

TypeScript and Vite build passed. Browser mode switch/scrub checks produced no
JavaScript errors. Revisited frame 48 had no visible camera/geometry drift.
The final standalone preview's frame-48 revisit was byte-identical. An earlier
software-GPU capture pair differed at 483 pixels, mean absolute RGB difference
.00124/255, with 79 pixels above 5/255; this small variance is retained in the
record rather than promising universal bit-for-bit preview identity.
Animation inputs, shaders and masks are purely frame-derived;
no real-time clock or delta integration drives exports. No promise is made of
bit-identical GPU rasterization across machines.

## Remaining limitations / approval status

1. **Ending remains unapproved.** Supplied city footage has unverified generation
   provenance. A confirmed CINEMA result is still required; labeling is retained
   in both browser preview and MP4, including the combined preview.
2. The hero is deliberately more metallic and orderly than the storyboard's
   translucent, irregular film fragments. Hole corners and some welded edge
   highlights remain stylized. It has no physically simulated film dynamics or
   ray-traced transmission, and the lens gate uses shader-cut perforations.
3. Opening's precise wordmark sits on black after the wipe; it does not reproduce
   the storyboard's surrounding final ribbon arrangement. The camera pulls from
   macro to wide rather than flying through multiple fragment fields.
4. The canonical repository logo is a bold wordmark with an accent square. The
   storyboard has thinner concept lettering. The original identity is preserved;
   changing it would violate the user's fidelity requirement.
5. Photographic detail and ending input are 1280×720 source imagery, so the final
   output is 1080p but cannot create genuine missing source-image detail.

These limitations keep the result honestly scoped as a substantially improved
reconstruction preview, with a final ending still awaiting verified footage.
