# CINEMA — The Final Frame

Isolated motion production; the application is unchanged. This branch derives from the existing film-ribbon production branch. Original compositions remain available alongside `FinalOpening`, `FinalOutro` and `FinalCombined`.

## Preview and export

From `motion/`, install pinned dependencies with `npm ci`, then:

```sh
python3 sound.py
python3 final-sound.py
npm run preview
```

The browser room supports opening, outro and combined playback and exact-frame scrubbing. Controls belong to the preview page, never to the exported films.

```sh
npx remotion render src/index.tsx FinalOpening out/final/cinema-opening-final.mp4 --gl=swangle --concurrency=2 --crf=17
npx remotion render src/index.tsx FinalOutro out/final/cinema-outro-final.mp4 --gl=swangle --concurrency=2 --crf=17
npx remotion render src/index.tsx FinalCombined out/final/cinema-combined-final.mp4 --gl=swangle --concurrency=2 --crf=17
```

Export dimensions are 1920×1080, 24 fps. Opening is 120 frames; outro 240 frames; combined 372 frames with a 12-frame black separation. In environments where OS network enumeration is unavailable, prefix Node commands with `NODE_OPTIONS=--require=./runtime-shim.cjs`; this is a runtime compatibility shim, not an animation clock.

For a portable browser preview, run `npm run build` and `python3 bundle-final-preview.py`. The resulting HTML embeds every final-production asset and can be opened without a server.

## Edit points

- `src/final/Opening.tsx`: five-shot camera/focus/light choreography and physical-edge identity masking.
- `src/final/Sculpture.tsx`: seven preferred ribbon shapes with thickness, actual holes and camera-space film gate.
- `src/final/Film.tsx`: distinct outro, precise identity, director and event titles.
- `src/final/ImageSheet.tsx`: UV-stable flat-to-curled sheet, actual thickness, emerging perforated rails and camera anchor.
- `src/material.ts`: retained physical film shader with an optional solid-ribbon photographic surface mode.
- `src/reconstruction/`: legacy experiments remain available.
- `src/Scene.tsx`: retained rendering pipeline; optional authored camera/material-light direction.
- `final-sound.py`: reproducible directed opening and outro sound design.

The landscape is an explicitly labeled original temporary AI-generated plate. Replace only `public/final-frame-plate.jpg` with verified cinematic output of the same 16:9 dimensions to preserve the UV transition. Review provenance labeling before any submission using a replacement.

See `FINAL-FRAME-ATTRIBUTION.md` and `FINAL-FRAME-QA.md` for attribution, actual review and remaining limitations.

## Recommended final and comparison

This production is on `motion/into-the-frame-final`, derived from `motion/film-ribbon-ident` at `7177e12a5bc9184e3816400e66c51a703fff8048`. It preserves the user-preferred seven-ribbon sculpture and replaces its largely stationary middle and fragment collapse with macro discovery, a spatial push, and a physical lens gate. The separate original production branch is preserved.

For inexpensive experiments, add `--props='{"renderQuality":0.5}' --scale=0.5`. Final exports use default renderQuality 1 at full 1080p. The portable browser preview uses lower interactive resolution; this affects only browser performance. Film motion always derives from the current video frame.

`finalize-exports.py` assembles the reviewed gate-light correction at exact frames 70–95, retains the other full-resolution opening pictures and the successful prior outro frames 0–105, incorporates newly rendered outro frames 106–239, muxes exact-length scores, and creates the combined preview. A complete render of the committed compositions already includes that correction. Run the assembly utility only with its expected render files; it is a delivery utility, not part of the animation engine.

`make-final-contacts.py /path/to/preferred-opening.mp4 /path/to/previous-combined.mp4` extracts matched before/after frames. The recommended delivery consists of the three final-named MP4s. Reduced-resolution proofs and intermediate renders are review evidence, not alternate finals.
