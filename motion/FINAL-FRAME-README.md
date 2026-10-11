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

- `src/final/Film.tsx`: frame choreography, cameras, exact identity compositing, director and event titles.
- `src/final/ImageSheet.tsx`: UV-stable flat-to-curled sheet, actual thickness, emerging perforated rails and camera anchor.
- `src/reconstruction/Hero.tsx`: retained tactile film geometry/shader; configurable final plate texture.
- `src/Scene.tsx`: retained rendering pipeline; optional authored camera/material-light direction.
- `final-sound.py`: reproducible outro sound design.

The landscape is an explicitly labeled original temporary AI-generated plate. Replace only `public/final-frame-plate.jpg` with verified cinematic output of the same 16:9 dimensions to preserve the UV transition. Review provenance labeling before any submission using a replacement.

See `FINAL-FRAME-ATTRIBUTION.md` and `FINAL-FRAME-QA.md` for attribution, actual review and remaining limitations.
